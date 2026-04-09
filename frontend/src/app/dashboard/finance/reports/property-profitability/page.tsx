"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { financeApi } from "@/lib/api/finance";
import { ReportHeader } from "@/components/finance/ReportHeader";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function PropertyProfitabilityPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getPropertyProfitability({}).then(d => setData(Array.isArray(d) ? d : [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <ReportHeader title="تقرير ربحية العقارات" reportType="property-profitability" />

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>
      ) : (
        <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">العقار</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الإيرادات</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">المصروفات</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">صافي الربح</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الإشغال</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r: any, i: number) => (
                  <tr key={i} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                    <td className="p-3 font-bold text-[#242424]">{r.propertyName}</td>
                    <td className="p-3 font-mono text-emerald-600">{fmt(r.revenue)}</td>
                    <td className="p-3 font-mono text-red-600">{fmt(r.expenses)}</td>
                    <td className={cn("p-3 font-mono font-bold", r.netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>{fmt(r.netProfit)}</td>
                    <td className="p-3 font-bold">{((r.occupancyRate || 0) * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
