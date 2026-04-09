"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { financeApi } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2 } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "مسودة", cls: "bg-yellow-50 text-yellow-700" },
  APPROVED: { label: "معتمدة", cls: "bg-emerald-50 text-emerald-700" },
  CLOSED: { label: "مغلقة", cls: "bg-gray-100 text-gray-600" },
};

export default function BudgetDetailPage() {
  const { id } = useParams();
  const [budget, setBudget] = useState<any>(null);
  const [variance, setVariance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'lines' | 'variance'>('lines');

  useEffect(() => {
    Promise.allSettled([
      financeApi.getBudget(id as string),
      financeApi.getBudgetVariance(id as string),
    ]).then(([b, v]) => {
      if (b.status === 'fulfilled') setBudget(b.value);
      if (v.status === 'fulfilled') setVariance(v.value);
    }).finally(() => setLoading(false));
  }, [id]);

  const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="flex items-center justify-center h-[40vh]"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>;
  if (!budget) return <p className="text-center text-[#999999] font-bold py-12">لم يتم العثور على الميزانية</p>;

  const s = STATUS_MAP[budget.status] || STATUS_MAP.DRAFT;

  const handleApprove = async () => {
    await financeApi.approveBudget(budget.id);
    setBudget({ ...budget, status: 'APPROVED' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#242424]">{budget.name}</h1>
          <p className="text-xs font-bold text-[#666666] mt-1">السنة المالية: {budget.fiscalYearId?.slice(0, 8)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("font-bold text-[10px] border-none", s.cls)}>{s.label}</Badge>
          {budget.status === 'DRAFT' && (
            <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> اعتماد
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F0F0F0] p-1 rounded-md w-fit">
        <button onClick={() => setTab('lines')}
          className={cn("px-4 py-1.5 text-xs font-bold rounded-sm transition-all", tab === 'lines' ? "bg-white text-[#6264A7] shadow-sm" : "text-[#222222]")}>
          البنود
        </button>
        <button onClick={() => setTab('variance')}
          className={cn("px-4 py-1.5 text-xs font-bold rounded-sm transition-all", tab === 'variance' ? "bg-white text-[#6264A7] shadow-sm" : "text-[#222222]")}>
          التباين
        </button>
      </div>

      {tab === 'lines' && (
        <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الحساب</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الفترة</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {(budget.lines || []).map((l: any, i: number) => (
                  <tr key={i} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                    <td className="p-3 font-bold text-[#242424]">{l.account?.code} — {l.account?.name}</td>
                    <td className="p-3 text-[#666666]">{l.fiscalPeriod?.name || l.fiscalPeriodId}</td>
                    <td className="p-3 font-mono font-bold">{fmt(Number(l.amount))}</td>
                  </tr>
                ))}
                {(!budget.lines || budget.lines.length === 0) && (
                  <tr><td colSpan={3} className="p-8 text-center text-[#999999] font-bold">لا توجد بنود</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === 'variance' && variance && (
        <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الحساب</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">مخطط</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">فعلي</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">التباين</th>
                </tr>
              </thead>
              <tbody>
                {(variance.lines || []).map((v: any, i: number) => {
                  const diff = v.actual - v.budgeted;
                  const isExpense = v.accountType === 'EXPENSE';
                  const isGood = isExpense ? diff <= 0 : diff >= 0;
                  return (
                    <tr key={i} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                      <td className="p-3 font-bold text-[#242424]">{v.accountName}</td>
                      <td className="p-3 font-mono">{fmt(v.budgeted)}</td>
                      <td className="p-3 font-mono">{fmt(v.actual)}</td>
                      <td className={cn("p-3 font-mono font-bold", isGood ? "text-emerald-600" : "text-red-600")}>
                        {fmt(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
