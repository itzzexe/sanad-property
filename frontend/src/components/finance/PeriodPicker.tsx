"use client";
import { useState, useEffect } from "react";
import { financeApi, FiscalPeriod } from "@/lib/api/finance";

interface PeriodPickerProps {
  value: string;
  onChange: (periodId: string) => void;
  className?: string;
}

export function PeriodPicker({ value, onChange, className }: PeriodPickerProps) {
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);

  useEffect(() => {
    financeApi.getFiscalPeriods().then(d => setPeriods(Array.isArray(d) ? d : [])).catch(console.error);
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-xs border border-[#999999] rounded-md px-3 py-2 bg-white font-bold text-[#242424] ${className || ''}`}
    >
      <option value="">كل الفترات</option>
      {periods.map(p => (
        <option key={p.id} value={p.id}>
          {p.name} ({p.status === 'OPEN' ? 'مفتوحة' : 'مغلقة'})
        </option>
      ))}
    </select>
  );
}
