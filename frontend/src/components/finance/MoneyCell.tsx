"use client";
export function MoneyCell({ amount, currency = '' }: { amount: number; currency?: string }) {
  const formatted = (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <span className="font-mono text-sm tabular-nums">{currency}{formatted}</span>;
}
