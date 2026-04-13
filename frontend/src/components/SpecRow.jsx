import React from "react";
import ConfidenceBadge from "./ConfidenceBadge";

export default function SpecRow({ label, value, confidence }) {
  const isEmpty = value === null || value === undefined || value === "";
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-100 last:border-0 gap-4">
      <span className="text-sm text-gray-500 min-w-[120px] flex-shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <span
          className={`text-sm font-medium ${isEmpty ? "text-gray-300 italic" : "text-gray-900"}`}
        >
          {isEmpty ? "Not identified" : value}
        </span>
        {confidence && (
          <ConfidenceBadge level={isEmpty ? "unknown" : confidence} />
        )}
      </div>
    </div>
  );
}
