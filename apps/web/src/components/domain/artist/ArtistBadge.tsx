import { CheckCircle2 } from "lucide-react";

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white">
      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
    </span>
  );
}
