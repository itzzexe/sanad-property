"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { financeApi } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { Plus, Loader2 } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  DRAFT: { label: "مسودة", class: "bg-yellow-50 text-yellow-700" },
  APPROVED: { label: "معتمدة", class: "bg-emerald-50 text-emerald-700" },
  CLOSED: { label: "مغلقة", class: "bg-gray-100 text-gray-600" },
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getBudgets().then(d => setBudgets(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[40vh]"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#242424]">الميزانيات <span className="text-[#6264A7]">التقديرية</span></h1>
        <Link href="/dashboard/finance/budgets/new">
          <Button className="bg-[#6264A7] hover:bg-[#5254A0] text-white text-xs font-bold gap-1.5"><Plus className="w-3.5 h-3.5" /> ميزانية جديدة</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const s = STATUS_MAP[b.status] || STATUS_MAP.DRAFT;
          return (
            <Link key={b.id} href={`/dashboard/finance/budgets/${b.id}`}>
              <Card className="bg-white border-[#999999] shadow-sm rounded-md hover:border-[#6264A7] transition-colors cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black text-[#242424]">{b.name}</h3>
                    <Badge variant="outline" className={cn("text-[9px] font-bold border-none", s.class)}>{s.label}</Badge>
                  </div>
                  <p className="text-[10px] font-bold text-[#666666]">السنة المالية: {b.fiscalYearId?.slice(0, 8)}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {budgets.length === 0 && <p className="text-sm text-[#999999] font-bold col-span-3 text-center py-12">لا توجد ميزانيات</p>}
      </div>
    </div>
  );
}
