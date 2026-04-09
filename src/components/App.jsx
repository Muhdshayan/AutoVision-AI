import React, { useState, useCallback } from "react";
import { Car, RefreshCw } from "lucide-react";
import ImageUpload from "./ImageUpload";
import CarListing from "./CarListing";
import ErrorCard from "./ErrorCard";
import LoadingState from "./LoadingState";
import { analyzeCarImage } from "../services/geminiService";

const STATES = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

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

        // If Gemini itself detected an error
        if (data.error) {
          setState(STATES.ERROR);
          setErrorCode(data.error);
          setErrorMessage(data.error_message);
          return;
        }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-none">
                AutoVision AI
              </h1>
              <p className="text-xs text-gray-400">
                Instant car listing from a photo
              </p>
            </div>
          </div>
          {state !== STATES.IDLE && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition px-3 py-1.5 rounded-lg hover:bg-blue-50"
            >
              <RefreshCw className="w-4 h-4" />
              New Scan
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Upload section – always show if idle or show thumbnail after upload */}
        {state === STATES.IDLE && (
          <div className="space-y-3">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Identify Any Car Instantly
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                Upload a photo → AI identifies the car → Get a full listing with
                specs & price
              </p>
            </div>
            <ImageUpload onImageSelect={handleImageSelect} isLoading={false} />
          </div>
        )}

        {/* Loading */}
        {state === STATES.LOADING && (
          <div className="space-y-4">
            {imageData?.previewUrl && (
              <div className="flex justify-center">
                <img
                  src={imageData.previewUrl}
                  alt="Uploaded"
                  className="h-40 w-auto rounded-xl object-cover shadow border border-gray-100 opacity-70"
                />
              </div>
            )}
            <LoadingState />
          </div>
        )}

        {/* Error */}
        {state === STATES.ERROR && (
          <div className="space-y-4">
            {imageData?.previewUrl && (
              <div className="flex justify-center">
                <img
                  src={imageData.previewUrl}
                  alt="Uploaded"
                  className="h-40 w-auto rounded-xl object-cover shadow border border-gray-100 opacity-60"
                />
              </div>
            )}
            <ErrorCard errorCode={errorCode} errorMessage={errorMessage} />
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Try Another Image
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {state === STATES.SUCCESS && result && (
          <CarListing data={result} previewUrl={imageData?.previewUrl} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-8 border-t border-gray-100 mt-8">
        AutoVision AI · Powered by Google Gemini 2.5 Flash · For informational
        purposes only
      </footer>
    </div>
  );
}
