# AutoVision AI — Car Listing from Photo

Upload a car photo and get an AI-generated listing with make, model, year, specs, estimated price, and per-field confidence indicators.

## Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- A free **Gemini API key** from [AI Studio](https://aistudio.google.com/app/apikey)

## Setup

```bash
# 1. Install frontend dependencies
npm install

# 2. Create the Python virtual environment and install backend dependencies
python -m venv .venv
.venv\Scripts\pip.exe install -r server\requirements.txt   # Windows
# source .venv/bin/activate && pip install -r server/requirements.txt  # macOS / Linux

# 3. Create .env from the example and add your Gemini key
copy .env.example .env   # Windows
# cp .env.example .env   # macOS / Linux
```

Open `.env` and set:

```
VITE_GEMINI_API_KEY=your_key_here
```

## Running

You need **two terminals** — one for the API, one for the UI.

**Terminal 1 — Python API (port 8000):**

```bash
.venv\Scripts\python.exe -m uvicorn server.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — React dev server (port 5173):**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

> Vite automatically proxies `/api/*` requests to the Python server, so the API key never leaves the backend.

## AI Flow

1. User uploads a car image (JPG, PNG, or WebP).
2. The React frontend sends the base64 image to `POST /api/analyze`.
3. The FastAPI backend forwards the image to **Google Gemini 2.5 Flash** with a structured prompt.
4. Gemini returns JSON with identified fields (make, model, year or year range, trim, body style, color, estimated price) plus a per-field confidence level (`confirmed` / `estimated` / `unknown`).
5. The backend retries on 503/429 errors and automatically falls back to `gemini-2.5-flash-lite`.
6. The frontend renders a marketplace-style listing card with confidence badges on every field.

## Error Handling

| Scenario                           | What the user sees                                        |
| ---------------------------------- | --------------------------------------------------------- |
| Blurry / dark photo                | "Image Too Unclear" with a tip                            |
| Half-visible / heavily cropped car | "Car Not Fully in Frame" (`partial_car`)                  |
| Multiple cars in frame             | "Multiple Cars Detected"                                  |
| Not a car at all                   | "Not a Car Image"                                         |
| No reliable identification         | "No Reliable Match Found"                                 |
| API key missing                    | "API Key Not Set"                                         |
| Gemini overloaded (503)            | Retries + fallback model, then "Service Temporarily Busy" |
| Rate limited (429)                 | "Too Many Requests"                                       |
| Malformed AI response              | "Analysis Failed"                                         |

## Limitations

- **No external pricing/specs database.** Price and specs come entirely from Gemini; they are estimates, not verified market data.
- **Single-image analysis only.** The app processes one photo per request; multi-angle uploads are not supported.
- **Free-tier rate limits.** Gemini free keys have low QPM; heavy use may trigger 429 errors.
- **AI accuracy varies.** Rare, modified, or partially visible cars may produce low-confidence or incorrect results.
- **No authentication.** The API is open on localhost; do not expose it to the public internet without adding auth.

## Project Structure

```
├── server/
│   ├── main.py              # FastAPI backend (Gemini proxy + retry logic)
│   └── requirements.txt     # Python dependencies
├── src/
│   ├── components/
│   │   ├── App.jsx           # Root component, state machine
│   │   ├── ImageUpload.jsx   # Upload + drag-and-drop
│   │   ├── CarListing.jsx    # Listing card with specs table
│   │   ├── SpecRow.jsx       # Single spec row with confidence badge
│   │   ├── ConfidenceBadge.jsx
│   │   ├── ErrorCard.jsx     # Error display with tips
│   │   └── LoadingState.jsx
│   └── services/
│       └── geminiService.js  # Frontend → /api/analyze fetch wrapper
├── .env.example
├── vite.config.js            # Vite + /api proxy to :8000
├── tailwind.config.js
└── package.json
```
