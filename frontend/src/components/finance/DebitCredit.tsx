"use client";
import { cn } from "@/lib/utils";

export function DebitCredit({ debit, credit }: { debit: number; credit: number }) {
  const formatted = (v: number) => (v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className="flex gap-6 font-mono text-sm tabular-nums">
      <span className={cn("min-w-[80px] text-left", debit > 0 ? "text-[#242424] font-semibold" : "text-[#999999]")}>{formatted(debit)}</span>
      <span className={cn("min-w-[80px] text-left", credit > 0 ? "text-[#666666]" : "text-[#999999]")}>{formatted(credit)}</span>
    </div>
  );
}
