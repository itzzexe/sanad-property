"use client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export function BalancedBadge({ isBalanced, variance }: { isBalanced: boolean; variance?: number }) {
  if (isBalanced) {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" /> متوازن
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-50 text-red-700 border-red-200 font-bold text-xs gap-1">
      <AlertTriangle className="w-3.5 h-3.5" /> غير متوازن — الفرق: {(variance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
    </Badge>
  );
}
