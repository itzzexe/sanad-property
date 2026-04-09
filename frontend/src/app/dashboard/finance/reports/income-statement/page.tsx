"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { financeApi } from "@/lib/api/finance";
import { ReportHeader } from "@/components/finance/ReportHeader";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function IncomeStatementPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [compare, setCompare] = useState(false);

  useEffect(() => {
    setLoading(true);
    financeApi.getIncomeStatement({ startDate, endDate, compareWithPriorPeriod: compare })
      .then(setData).catch(console.error).finally(() => setLoading(false));
  }, [startDate, endDate, compare]);

  const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <ReportHeader title="قائمة الدخل" reportType="income-statement" dateRange={`${startDate} إلى ${endDate}`}>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36 text-xs border-[#999999]" />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36 text-xs border-[#999999]" />
        <div className="flex items-center gap-2">
          <Switch checked={compare} onCheckedChange={setCompare} />
          <Label className="text-[10px] font-bold text-[#222222]">مقارنة</Label>
        </div>
      </ReportHeader>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>
      ) : (
        <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الحساب</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">المبلغ</th>
                  {compare && <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">السابق</th>}
                  {compare && <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الفرق</th>}
                </tr>
              </thead>
              <tbody>
                {(data?.sections || []).map((section: any, si: number) => (
                  <React.Fragment key={si}>
                    <tr className="bg-[#F5F5F5]">
                      <td colSpan={compare ? 4 : 2} className="p-3 font-black text-[#242424] text-xs">{section.title}</td>
                    </tr>
                    {(section.accounts || []).map((a: any, ai: number) => (
                      <tr key={ai} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                        <td className="p-3 pr-8 text-[#242424]">{a.code} — {a.name}</td>
                        <td className="p-3 font-mono">{fmt(a.amount)}</td>
                        {compare && <td className="p-3 font-mono text-[#666666]">{fmt(a.priorAmount)}</td>}
                        {compare && (
                          <td className={cn("p-3 font-mono font-bold", a.variance >= 0 ? "text-emerald-600" : "text-red-600")}>
                            {fmt(a.variance)}
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="border-b-2 border-[#EBEBEB]">
                      <td className="p-3 pr-8 font-bold text-[#242424]">إجمالي {section.title}</td>
                      <td className="p-3 font-mono font-bold">{fmt(section.subtotal)}</td>
                      {compare && <td className="p-3" />}
                      {compare && <td className="p-3" />}
                    </tr>
                  </React.Fragment>
                ))}
                {/* Net Income */}
                <tr className="bg-[#F0F0F0] border-t-2 border-[#999999]">
                  <td className="p-4 font-black text-base text-[#242424]">صافي الدخل</td>
                  <td className={cn("p-4 font-mono font-black text-base", (data?.netIncome || 0) >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {fmt(data?.netIncome || 0)}
                  </td>
                  {compare && <td className="p-4" />}
                  {compare && <td className="p-4" />}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import React from "react";
