import React from "react";
import { ShieldCheck, AlertTriangle, HelpCircle } from "lucide-react";

const CONFIG = {
  confirmed: {
    label: "Confirmed",
    icon: ShieldCheck,
    classes: "bg-green-100 text-green-700 border-green-200",
  },
  estimated: {
    label: "Estimated",
    icon: AlertTriangle,
    classes: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  unknown: {
    label: "Unknown",
    icon: HelpCircle,
    classes: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

export default function ConfidenceBadge({ level }) {
  const cfg = CONFIG[level] || CONFIG["unknown"];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.classes}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}
