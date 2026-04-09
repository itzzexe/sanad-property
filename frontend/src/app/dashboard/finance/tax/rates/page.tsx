"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { financeApi } from "@/lib/api/finance";
import { Loader2 } from "lucide-react";

export default function TaxRatesPage() {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getTaxRates().then(d => setRates(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[40vh]"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#242424]">معدلات <span className="text-[#6264A7]">الضرائب</span></h1>
      <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الكود</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الاسم</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">النسبة</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">النوع</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r: any) => (
                <tr key={r.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                  <td className="p-3 font-mono font-bold text-[#6264A7]">{r.code}</td>
                  <td className="p-3 font-bold text-[#242424]">{r.name}</td>
                  <td className="p-3 font-mono">{(Number(r.rate) * 100).toFixed(2)}%</td>
                  <td className="p-3 text-[#666666]">{r.type}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={r.isActive ? "bg-emerald-50 text-emerald-700 text-[9px] font-bold" : "bg-gray-100 text-gray-500 text-[9px] font-bold"}>
                      {r.isActive ? "نشط" : "متوقف"}
                    </Badge>
                  </td>
                </tr>
              ))}
              {rates.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-[#999999] font-bold">لا توجد ضرائب</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
