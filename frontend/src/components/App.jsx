import React, { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import BrandMark from "./BrandMark";
import ImageUpload from "./ImageUpload";
import CarListing from "./CarListing";
import ErrorCard from "./ErrorCard";
import AnalysisProcessing from "./AnalysisProcessing";
import { analyzeCarImage } from "../services/geminiService";

const STATES = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

/** Decorative background — local car photo (blurred) */
const BG_CAR_IMAGE = "/assets/images/tyler-clemmensen-d1Jum1vVLew-unsplash.jpg";

export default function App() {
  const [state, setState] = useState(STATES.IDLE);
  const [imageData, setImageData] = useState(null);
  const [result, setResult] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleImageSelect = useCallback(
    async ({ base64, mimeType, previewUrl, fileName }) => {
      setImageData({ base64, mimeType, previewUrl, fileName });
      setState(STATES.LOADING);
      setResult(null);
      setErrorCode(null);
      setErrorMessage(null);

      try {
        const data = await analyzeCarImage(base64, mimeType);

        if (data.error) {
          setState(STATES.ERROR);
          setErrorCode(data.error);
          setErrorMessage(data.error_message);
          return;
        }

        await new Promise((r) => setTimeout(r, 650));
        setResult(data);
        setState(STATES.SUCCESS);
      } catch (err) {
        setState(STATES.ERROR);
        const msg = err?.message ?? "";
        if (msg === "API_KEY_MISSING") {
          setErrorCode("API_KEY_MISSING");
          if (err.detail) setErrorMessage(err.detail);
        } else if (msg === "PARSE_ERROR") {
          setErrorCode("PARSE_ERROR");
          if (err.detail) setErrorMessage(err.detail);
        } else if (msg === "SERVICE_UNAVAILABLE" || msg === "RATE_LIMIT") {
          setErrorCode(msg);
          if (err.detail) setErrorMessage(err.detail);
        } else {
          setErrorCode("PARSE_ERROR");
          setErrorMessage(err.message);
        }
      }
    },
    [],
  );

  const handleReset = () => {
    setState(STATES.IDLE);
    setImageData(null);
    setResult(null);
    setErrorCode(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen relative text-gray-900">
      {/* Decorative background car (full-bleed, not zoomed) */}
      <div
        className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
        aria-hidden
      >
        <img
          src={BG_CAR_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center blur-[2px] brightness-[0.85] saturate-[0.55]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/40 to-black/65" />
        <div className="absolute inset-0 bg-black/15 backdrop-blur-[1px]" />
      </div>

      {/* Header — Wowcar (partner) left, product title right; inline actions */}
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-black/45 shadow-sm shadow-black/20 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[4rem] max-w-6xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6 sm:py-3.5">
          {state !== STATES.IDLE && (
            <button
              type="button"
              onClick={handleReset}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-200 transition hover:bg-white/10 hover:text-white sm:px-3"
            >
              <RefreshCw className="h-4 w-4 shrink-0 text-brand-orange" />
              New Scan
            </button>
          )}
          <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
            <div className="min-w-0 shrink">
              <BrandMark />
            </div>
            <h1 className="shrink-0 text-right text-base font-bold leading-tight tracking-tight text-white sm:text-lg md:text-xl">
              AutoVision <span className="text-brand-orange">AI</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative max-w-6xl mx-auto px-4 py-10 md:py-14 space-y-8">
        {state === STATES.IDLE && (
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 lg:items-center min-h-[calc(100vh-12rem)]">
            <div className="space-y-4 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
                Identify any car{" "}
                <span className="text-brand-orange">instantly</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-300 max-w-xl mx-auto lg:mx-0">
                Upload a photo — our AI reads the vehicle and builds a full listing
                with specs, fuel type, and an estimated price.
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <ImageUpload
                variant="hero"
                onImageSelect={handleImageSelect}
                isLoading={false}
              />
            </div>
          </div>
        )}

        {state === STATES.LOADING && (
          <AnalysisProcessing previewUrl={imageData?.previewUrl} />
        )}

        {state === STATES.ERROR && (
          <div className="space-y-4">
            {imageData?.previewUrl && (
              <div className="flex justify-center">
                <img
                  src={imageData.previewUrl}
                  alt="Uploaded"
                  className="h-52 w-auto max-w-full rounded-xl object-contain shadow-md border border-gray-100 opacity-70"
                />
              </div>
            )}
            <ErrorCard errorCode={errorCode} errorMessage={errorMessage} />
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange-hover transition shadow-sm shadow-brand-orange/20"
              >
                <RefreshCw className="w-4 h-4" />
                Try Another Image
              </button>
            </div>
          </div>
        )}

        {state === STATES.SUCCESS && result && (
          <CarListing data={result} previewUrl={imageData?.previewUrl} />
        )}
      </main>
    </div>
  );
}
