"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { financeApi } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { Plus, Loader2 } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "مسودة", cls: "bg-yellow-50 text-yellow-700" },
  OPEN: { label: "مفتوحة", cls: "bg-blue-50 text-blue-700" },
  PAID: { label: "مدفوعة", cls: "bg-emerald-50 text-emerald-700" },
  PARTIALLY_PAID: { label: "جزئية", cls: "bg-orange-50 text-orange-700" },
  VOIDED: { label: "ملغاة", cls: "bg-red-50 text-red-600" },
};

export default function BillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getBills().then(d => setBills(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="flex items-center justify-center h-[40vh]"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#242424]">الفواتير</h1>
        <Link href="/dashboard/finance/accounts-payable/bills/new">
          <Button className="bg-[#6264A7] hover:bg-[#5254A0] text-white text-xs font-bold gap-1.5"><Plus className="w-3.5 h-3.5" /> فاتورة جديدة</Button>
        </Link>
      </div>
      <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">رقم الفاتورة</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">المورّد</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">التاريخ</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">المبلغ</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => {
                const s = STATUS_MAP[b.status] || STATUS_MAP.DRAFT;
                return (
                  <tr key={b.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                    <td className="p-3">
                      <Link href={`/dashboard/finance/accounts-payable/bills/${b.id}`} className="font-mono font-bold text-[#6264A7] hover:underline">
                        {b.billNumber}
                      </Link>
                    </td>
                    <td className="p-3 font-bold text-[#242424]">{b.vendor?.name || "–"}</td>
                    <td className="p-3 font-mono text-[#666666]">{new Date(b.date).toLocaleDateString('ar-IQ')}</td>
                    <td className="p-3 font-mono font-bold">{fmt(b.totalAmount)}</td>
                    <td className="p-3"><Badge variant="outline" className={cn("text-[9px] font-bold border-none", s.cls)}>{s.label}</Badge></td>
                  </tr>
                );
              })}
              {bills.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-[#999999] font-bold">لا توجد فواتير</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
