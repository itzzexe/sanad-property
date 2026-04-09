"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { financeApi } from "@/lib/api/finance";
import { BalancedBadge } from "@/components/finance/BalancedBadge";
import { ReportHeader } from "@/components/finance/ReportHeader";
import { Loader2 } from "lucide-react";

export default function TrialBalancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));

  const load = () => {
    setLoading(true);
    financeApi.getTrialBalance({ endDate: asOfDate }).then(setData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [asOfDate]);

  const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const variance = data ? Math.abs(data.totalDebit - data.totalCredit) : 0;
  const isBalanced = variance < 0.01;

  return (
    <div className="space-y-6">
      <ReportHeader title="ميزان المراجعة" reportType="trial-balance" dateRange={`حتى ${asOfDate}`}>
        <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="w-40 text-xs border-[#999999]" />
      </ReportHeader>

      {data && (
        <div className="mb-4" data-testid="balance-status">
          <BalancedBadge isBalanced={isBalanced} variance={variance} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>
      ) : (
        <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">الرمز</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">اسم الحساب</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">المدين</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">الدائن</th>
                </tr>
              </thead>
              <tbody>
                {(data?.rows || []).map((r: any, i: number) => (
                  <tr key={i} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] transition-colors">
                    <td className="p-3 font-mono text-[#666666]">{r.accountCode}</td>
                    <td className="p-3 font-bold text-[#242424]">{r.accountName}</td>
                    <td className="p-3 font-mono text-[#242424]">{fmt(r.debit)}</td>
                    <td className="p-3 font-mono text-[#666666]">{fmt(r.credit)}</td>
                  </tr>
                ))}
                <tr className="bg-[#FAFAFA] border-t-2 border-[#999999]">
                  <td colSpan={2} className="p-3 font-black text-[#242424] text-sm">المجموع</td>
                  <td className="p-3 font-mono font-black text-[#242424]">{fmt(data?.totalDebit || 0)}</td>
                  <td className="p-3 font-mono font-black text-[#242424]">{fmt(data?.totalCredit || 0)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
