import React from "react";
import { Tag } from "lucide-react";
import SpecRow from "./SpecRow";

function formatPrice(n) {
  if (n == null || n === "") return null;
  const num = typeof n === "number" ? n : Number(String(n).replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(num)) return String(n);
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function CarListing({ data, previewUrl }) {
  const c = data.confidence || {};

  const titleParts = [data.year, data.make, data.model].filter(Boolean);
  const title = titleParts.length ? titleParts.join(" ") : "Identified vehicle";

  return (
    <div className="space-y-6">
      {previewUrl && (
        <div className="flex justify-center">
          <img
            src={previewUrl}
            alt="Your upload"
            className="h-48 w-auto max-w-full rounded-xl object-cover shadow-lg border border-gray-100"
          />
        </div>
      )}

      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {data.trim && (
          <p className="text-gray-500 text-sm">{data.trim}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-700">Listing details</span>
        </div>
        <div className="px-5 py-1">
          <SpecRow label="Make" value={data.make} confidence={c.make} />
          <SpecRow label="Model" value={data.model} confidence={c.model} />
          <SpecRow label="Year" value={data.year} confidence={c.year} />
          <SpecRow label="Trim" value={data.trim} confidence={c.trim} />
          <SpecRow label="Body style" value={data.body_style} confidence={c.body_style} />
          <SpecRow label="Color" value={data.exterior_color} confidence={c.exterior_color} />
          <SpecRow
            label="Est. price (PKR)"
            value={formatPrice(data.estimated_price_pkr)}
            confidence={c.estimated_price_pkr}
          />
        </div>
      </div>

      {data.notes && (
        <p className="text-sm text-gray-500 text-center max-w-xl mx-auto">{data.notes}</p>
      )}
    </div>
  );
}
