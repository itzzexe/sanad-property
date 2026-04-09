"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { financeApi } from "@/lib/api/finance";
import { ReportHeader } from "@/components/finance/ReportHeader";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function CashFlowPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setLoading(true);
    financeApi.getCashFlow({ startDate, endDate }).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [startDate, endDate]);

  const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const Section = ({ title, items, total }: { title: string; items: any[]; total: number }) => (
    <div className="space-y-1 mb-6">
      <h3 className="font-black text-xs text-[#242424] mb-2 uppercase tracking-wider">{title}</h3>
      {(items || []).map((item: any, i: number) => (
        <div key={i} className="flex justify-between px-2 py-1.5 text-xs hover:bg-[#FAFAFA] rounded">
          <span className="text-[#242424]">{item.name}</span>
          <span className={cn("font-mono", item.amount >= 0 ? "text-emerald-600" : "text-red-600")}>{fmt(item.amount)}</span>
        </div>
      ))}
      <div className="flex justify-between px-2 py-2 border-t border-[#EBEBEB] text-xs font-bold">
        <span>الإجمالي</span>
        <span className={cn("font-mono font-black", total >= 0 ? "text-emerald-600" : "text-red-600")}>{fmt(total)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <ReportHeader title="قائمة التدفقات النقدية" reportType="cash-flow" dateRange={`${startDate} إلى ${endDate}`}>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36 text-xs border-[#999999]" />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36 text-xs border-[#999999]" />
      </ReportHeader>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>
      ) : (
        <Card className="bg-white border-[#999999] shadow-sm rounded-md">
          <CardContent className="p-6">
            <div className="flex justify-between px-2 py-3 mb-6 bg-[#F5F5F5] rounded-md text-xs font-bold">
              <span>صافي الدخل</span><span className="font-mono">{fmt(data?.netIncome || 0)}</span>
            </div>
            <Section title="الأنشطة التشغيلية" items={data?.operatingActivities?.items || []} total={data?.operatingActivities?.total || 0} />
            <Section title="الأنشطة الاستثمارية" items={data?.investingActivities?.items || []} total={data?.investingActivities?.total || 0} />
            <Section title="الأنشطة التمويلية" items={data?.financingActivities?.items || []} total={data?.financingActivities?.total || 0} />
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="p-4 bg-[#F5F5F5] rounded-md text-center">
                <p className="text-[9px] font-black text-[#999999] uppercase tracking-widest">رصيد بداية</p>
                <p className="text-sm font-black font-mono mt-1">{fmt(data?.openingCash || 0)}</p>
              </div>
              <div className="p-4 bg-[#6264A7]/5 rounded-md text-center border border-[#6264A7]/20">
                <p className="text-[9px] font-black text-[#6264A7] uppercase tracking-widest">صافي التغير</p>
                <p className={cn("text-sm font-black font-mono mt-1", (data?.netCashChange || 0) >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {fmt(data?.netCashChange || 0)}
                </p>
              </div>
              <div className="p-4 bg-[#F5F5F5] rounded-md text-center">
                <p className="text-[9px] font-black text-[#999999] uppercase tracking-widest">رصيد نهاية</p>
                <p className="text-sm font-black font-mono mt-1">{fmt(data?.closingCash || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
