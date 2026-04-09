"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { financeApi } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function BankStatementsPage() {
  const { bankAccountId } = useParams();
  const [statements, setStatements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getBankStatements(bankAccountId as string)
      .then(d => setStatements(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setLoading(false));
  }, [bankAccountId]);

  const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="flex items-center justify-center h-[40vh]"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#242424]">كشوفات <span className="text-[#6264A7]">الحساب البنكي</span></h1>
      <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">التاريخ</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الرصيد الافتتاحي</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الرصيد الختامي</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {statements.map((s: any) => (
                <tr key={s.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] cursor-pointer">
                  <td className="p-3">
                    <Link href={`/dashboard/finance/reconciliation/${bankAccountId}/${s.id}`} className="font-mono text-[#6264A7] hover:underline font-bold">
                      {new Date(s.statementDate || s.createdAt).toLocaleDateString('ar-IQ')}
                    </Link>
                  </td>
                  <td className="p-3 font-mono">{fmt(s.openingBalance)}</td>
                  <td className="p-3 font-mono">{fmt(s.closingBalance)}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={cn("text-[9px] font-bold border-none",
                      s.status === 'RECONCILED' ? "bg-emerald-50 text-emerald-700" : "bg-yellow-50 text-yellow-700")}>
                      {s.status === 'RECONCILED' ? 'مطابق' : 'قيد المراجعة'}
                    </Badge>
                  </td>
                </tr>
              ))}
              {statements.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-[#999999] font-bold">لا توجد كشوفات</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
