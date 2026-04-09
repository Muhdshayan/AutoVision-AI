"""
Gemini proxy: uses google-generativeai from your venv (same stack as scripts/test_gemini_key.py).
Run: python -m uvicorn server.main:app --reload --port 8000
"""
from __future__ import annotations

import base64
import json
import os
import re
import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import google.generativeai as genai  # noqa: E402

DEFAULT_MODEL = "gemini-2.5-flash"
DEFAULT_FALLBACK_MODELS = ["gemini-2.5-flash-lite"]
MAX_ATTEMPTS_PER_MODEL = 3
BASE_DELAY_MS = 900

SYSTEM_PROMPT = """You are an expert at identifying vehicles from photos. Analyze the image and respond with ONLY valid JSON (no markdown fences).

If the image is unusable or not a single car listing, use one of these error codes in this exact shape:
{"error":"unclear_image","error_message":"brief reason"}
{"error":"partial_car","error_message":"brief reason"}
{"error":"multiple_cars","error_message":"brief reason"}
{"error":"not_a_car","error_message":"brief reason"}
{"error":"no_match","error_message":"brief reason"}
{"error":"unsupported_format","error_message":"brief reason"}

Use partial_car when the vehicle is heavily cropped, only half (or a small part) of the car is visible, or too little of the car is shown to identify make/model/year reliably. Prefer partial_car over guessing when the subject is not sufficiently in frame.

For a successful identification, use this shape (omit unknown strings as null; numbers as numbers; confidence per field: "confirmed", "estimated", or "unknown"):
{
  "make": "string or null",
  "model": "string or null",
  "year": "string or null (single year like '2021' or range like '2019-2021')",
  "trim": "string or null",
  "body_style": "string or null",
  "exterior_color": "string or null",
  "estimated_price_pkr": number,
  "notes": "short optional note",
  "confidence": {
    "make": "confirmed|estimated|unknown",
    "model": "confirmed|estimated|unknown",
    "year": "confirmed|estimated|unknown",
    "trim": "confirmed|estimated|unknown",
    "body_style": "confirmed|estimated|unknown",
    "exterior_color": "confirmed|estimated|unknown",
    "estimated_price_pkr": "confirmed|estimated|unknown"
  }
}

For estimated_price_pkr, you MUST always provide an estimated price in Pakistani Rupees (PKR) based on the Pakistan used-car market. Never return null for this field. Even if you are unsure, provide your best rough estimate and set the confidence to "estimated"."""


def _api_key() -> str:
    return (
        (os.environ.get("GEMINI_API_KEY") or "").strip()
        or (os.environ.get("VITE_GEMINI_API_KEY") or "").strip()
    )


def _model_ids() -> list[str]:
    primary = (os.environ.get("GEMINI_MODEL") or os.environ.get("VITE_GEMINI_MODEL") or "").strip() or DEFAULT_MODEL
    extra = [
        s.strip()
        for s in (os.environ.get("GEMINI_FALLBACK_MODELS") or os.environ.get("VITE_GEMINI_FALLBACK_MODELS") or "").split(",")
        if s.strip()
    ]
    ordered = [primary, *extra, *DEFAULT_FALLBACK_MODELS]
    seen: set[str] = set()
    out: list[str] = []
    for m in ordered:
        if m not in seen:
            seen.add(m)
            out.append(m)
    return out


def _is_transient(msg: str) -> bool:
    return bool(
        re.search(r"\b503\b", msg)
        or re.search(r"\b429\b", msg)
        or re.search(r"high demand", msg, re.I)
        or re.search(r"overloaded", msg, re.I)
        or re.search(r"unavailable", msg, re.I)
        or re.search(r"Resource exhausted", msg, re.I)
    )


def _classify(msg: str) -> str | None:
    if re.search(r"\b429\b", msg) or re.search(r"Resource exhausted", msg, re.I):
        return "RATE_LIMIT"
    if re.search(r"\b503\b", msg) or re.search(r"high demand", msg, re.I) or re.search(r"overloaded", msg, re.I):
        return "SERVICE_UNAVAILABLE"
    return None


def _extract_json(text: str) -> dict:
    t = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", t)
    raw = fence.group(1).strip() if fence else t
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("PARSE_ERROR")
    return json.loads(raw[start : end + 1])


def _generate_with_retries(model: genai.GenerativeModel, parts: list) -> object:
    last_err: Exception | None = None
    for attempt in range(MAX_ATTEMPTS_PER_MODEL):
        try:
            return model.generate_content(parts)
        except Exception as e:
            last_err = e
            msg = str(e)
            if not _is_transient(msg) or attempt == MAX_ATTEMPTS_PER_MODEL - 1:
                raise
            time.sleep(BASE_DELAY_MS * (2**attempt) / 1000.0)
    assert last_err is not None
    raise last_err


class AnalyzeBody(BaseModel):
    base64: str = Field(..., description="Raw base64, no data: URL prefix")
    mimeType: str = Field(default="image/jpeg")


app = FastAPI(title="Car Vision API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"ok": True, "has_key": bool(_api_key())}


@app.post("/api/analyze")
def analyze(body: AnalyzeBody):
    key = _api_key()
    if not key:
        return {"error": "API_KEY_MISSING", "error_message": "Set GEMINI_API_KEY (or VITE_GEMINI_API_KEY) in .env"}

    genai.configure(api_key=key)
    try:
        raw = base64.b64decode(body.base64, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid_base64")

    mime = body.mimeType or "image/jpeg"
    parts: list = [SYSTEM_PROMPT, {"mime_type": mime, "data": raw}]

    last_err: Exception | None = None
    for model_id in _model_ids():
        try:
            model = genai.GenerativeModel(model_id)
            response = _generate_with_retries(model, parts)
            text = (response.text or "").strip()
            if not text:
                raise ValueError("PARSE_ERROR")
            try:
                data = _extract_json(text)
            except Exception:
                return {"error": "PARSE_ERROR", "error_message": "Could not parse model JSON."}

            if isinstance(data, dict) and data.get("error"):
                return data
            if isinstance(data, dict):
                if not isinstance(data.get("confidence"), dict):
                    data["confidence"] = {}
                return data
            return {"error": "PARSE_ERROR", "error_message": "Unexpected response shape."}
        except Exception as e:
            last_err = e
            msg = str(e)
            if _is_transient(msg):
                continue
            code = _classify(msg)
            if code:
                return {"error": code, "error_message": msg}
            return {"error": "PARSE_ERROR", "error_message": msg}

    code = _classify(str(last_err)) if last_err else None
    return {
        "error": code or "SERVICE_UNAVAILABLE",
        "error_message": str(last_err) if last_err else "All models failed.",
    }
