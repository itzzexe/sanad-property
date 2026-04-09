"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { financeApi } from "@/lib/api/finance";
import { ReportHeader } from "@/components/finance/ReportHeader";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function ArAgingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getArAging().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <ReportHeader title="تقرير أعمار الديون" reportType="ar-aging" dateRange={`حتى ${new Date().toLocaleDateString('ar-IQ')}`} />

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>
      ) : (
        <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">المستأجر</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">العقار</th>
                  <th className="text-right p-3 font-black text-[#666666] uppercase text-[10px] tracking-wider">حالي</th>
                  <th className="text-right p-3 font-black text-amber-600 uppercase text-[10px] tracking-wider">30-60</th>
                  <th className="text-right p-3 font-black text-orange-600 uppercase text-[10px] tracking-wider">61-90</th>
                  <th className="text-right p-3 font-black text-red-600 uppercase text-[10px] tracking-wider">90+</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {(data?.rows || []).map((r: any, i: number) => (
                  <tr key={i} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] transition-colors">
                    <td className="p-3 font-bold text-[#242424]">{r.tenantName}</td>
                    <td className="p-3 text-[#666666]">{r.propertyName} - {r.unitNumber}</td>
                    <td className="p-3 font-mono text-[#666666]">{fmt(r.current)}</td>
                    <td className={cn("p-3 font-mono", r.bucket30 > 0 && "text-amber-600 font-bold")}>{fmt(r.bucket30)}</td>
                    <td className={cn("p-3 font-mono", r.bucket60 > 0 && "text-orange-600 font-bold")}>{fmt(r.bucket60)}</td>
                    <td className={cn("p-3 font-mono", (r.bucket90 + r.bucket90plus) > 0 && "text-red-600 font-bold")}>{fmt(r.bucket90 + r.bucket90plus)}</td>
                    <td className="p-3 font-mono font-black text-[#242424]">{fmt(r.total)}</td>
                  </tr>
                ))}
                <tr className="bg-[#FAFAFA] border-t-2 border-[#999999]">
                  <td colSpan={2} className="p-3 font-black text-[#242424]">الإجمالي</td>
                  <td colSpan={4} className="p-3" />
                  <td className="p-3 font-mono font-black text-[#242424]">{fmt(data?.totalOutstanding || 0)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
