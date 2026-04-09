"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { financeApi } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, Lock } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "مفتوحة", cls: "bg-emerald-50 text-emerald-700" },
  CLOSED: { label: "مغلقة", cls: "bg-gray-100 text-gray-600" },
  ADJUSTING: { label: "تعديل", cls: "bg-amber-50 text-amber-700" },
};

export default function FiscalPeriodsPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getFiscalPeriods().then(d => setPeriods(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[40vh]"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#242424]">الفترات <span className="text-[#6264A7]">المالية</span></h1>

      <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الاسم</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">البداية</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">النهاية</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الحالة</th>
                <th className="p-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => {
                const s = STATUS_MAP[p.status] || STATUS_MAP.OPEN;
                return (
                  <tr key={p.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                    <td className="p-3 font-bold text-[#242424]">{p.name}</td>
                    <td className="p-3 font-mono text-[#666666]">{new Date(p.startDate).toLocaleDateString('ar-IQ')}</td>
                    <td className="p-3 font-mono text-[#666666]">{new Date(p.endDate).toLocaleDateString('ar-IQ')}</td>
                    <td className="p-3"><Badge variant="outline" className={cn("text-[9px] font-bold border-none", s.cls)}>{s.label}</Badge></td>
                    <td className="p-3">
                      {p.status === 'OPEN' && (
                        <Button variant="outline" size="sm" className="gap-1 text-[10px] font-bold border-[#999999]"
                          onClick={() => financeApi.closeFiscalPeriod(p.id).then(() => location.reload())}>
                          <Lock className="w-3 h-3" /> إغلاق
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {periods.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-[#999999] font-bold">لا توجد فترات</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
