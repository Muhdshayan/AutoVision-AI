import React, { useEffect, useState } from "react";
import {
  Sparkles,
  ScanLine,
  Crosshair,
  Car,
  Wand2,
  LineChart,
  CheckCircle2,
} from "lucide-react";

const STEPS = [
  { id: 0, label: "Scanning image & lighting", icon: ScanLine },
  { id: 1, label: "Locating vehicle in frame", icon: Crosshair },
  { id: 2, label: "Identifying make & model", icon: Car },
  { id: 3, label: "Extracting specs & color", icon: Wand2 },
  { id: 4, label: "Computing market estimate", icon: LineChart },
];

export default function AnalysisProcessing({ previewUrl }) {
  const [activeStep, setActiveStep] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setActiveStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 1100);
    return () => clearInterval(stepTimer);
  }, []);

  useEffect(() => {
    const p = setInterval(() => {
      setProgress((v) => (v >= 92 ? 92 : v + Math.random() * 8 + 2));
    }, 280);
    return () => clearInterval(p);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => (p + 1) % 1000), 50);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-orange/20 bg-gradient-to-br from-white via-brand-orange-light/30 to-white p-6 shadow-lg shadow-brand-orange/10">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-orange/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-amber-200/40 blur-2xl" />

      <div className="relative flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 text-brand-orange">
          <Sparkles className="h-5 w-5 animate-pulse" />
          <span className="text-sm font-semibold tracking-wide uppercase">
            AI Vision pipeline
          </span>
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>

        {/* Image with scan + rings */}
        {previewUrl && (
          <div className="relative">
            <div
              className="absolute inset-0 rounded-2xl ring-2 ring-brand-orange/40 ring-offset-2 ring-offset-white animate-pulse"
              style={{ animationDuration: "2s" }}
            />
            <div className="relative h-52 w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 shadow-md sm:h-60 sm:max-w-md">
              <img
                src={previewUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="analysis-scanline pointer-events-none absolute inset-0" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-orange/10 to-transparent" />
            </div>
            <div
              className="pointer-events-none absolute -inset-3 rounded-3xl border border-dashed border-brand-orange/30 opacity-60"
              style={{
                transform: `rotate(${Math.sin(pulse / 100) * 2}deg)`,
              }}
            />
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full max-w-md space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Processing</span>
            <span className="font-mono tabular-nums text-brand-orange">
              {Math.round(Math.min(progress, 92))}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-orange via-amber-400 to-brand-orange transition-[width] duration-300 ease-out"
              style={{ width: `${Math.min(progress, 92)}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <ul className="w-full max-w-md space-y-2.5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const done = i < activeStep;
            const current = i === activeStep;
            return (
              <li
                key={step.id}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-300 ${
                  current
                    ? "border-brand-orange/50 bg-brand-orange-light/80 shadow-sm"
                    : done
                      ? "border-gray-100 bg-white/80 text-gray-600"
                      : "border-transparent bg-gray-50/50 text-gray-400"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    done
                      ? "bg-green-100 text-green-600"
                      : current
                        ? "bg-brand-orange text-white"
                        : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className={`h-4 w-4 ${current ? "animate-pulse" : ""}`} />
                  )}
                </span>
                <span
                  className={
                    current ? "font-semibold text-gray-900" : "font-medium"
                  }
                >
                  {step.label}
                </span>
                {current && (
                  <span className="ml-auto flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-orange [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-orange [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-orange [animation-delay:300ms]" />
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <p className="text-center text-xs text-gray-500">
          Gemini is analyzing your photo — results appear as a saved listing + JSON
          when ready.
        </p>
      </div>
    </div>
  );
}
