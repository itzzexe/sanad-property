"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { financeApi } from "@/lib/api/finance";
import { ReportHeader } from "@/components/finance/ReportHeader";
import { BalancedBadge } from "@/components/finance/BalancedBadge";
import { Loader2 } from "lucide-react";

export default function BalanceSheetPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setLoading(true);
    financeApi.getBalanceSheet({ endDate: asOf }).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [asOf]);

  const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const renderSection = (title: string, items: any[], total: number) => (
    <div className="space-y-1">
      <h3 className="font-black text-xs text-[#242424] uppercase tracking-wider mb-2">{title}</h3>
      {(items || []).map((a: any, i: number) => (
        <div key={i} className="flex justify-between px-2 py-1.5 hover:bg-[#FAFAFA] rounded text-xs">
          <span className="text-[#242424]">{a.code} — {a.name}</span>
          <span className="font-mono">{fmt(a.balance)}</span>
        </div>
      ))}
      <div className="flex justify-between px-2 py-2 border-t border-[#EBEBEB] font-bold text-xs">
        <span>إجمالي {title}</span>
        <span className="font-mono">{fmt(total)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <ReportHeader title="الميزانية العمومية" reportType="balance-sheet" dateRange={`حتى ${asOf}`}>
        <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="w-40 text-xs border-[#999999]" />
        {data && <BalancedBadge isBalanced={data.isBalanced} variance={data.variance} />}
      </ReportHeader>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white border-[#999999] shadow-sm rounded-md">
            <CardContent className="p-5 space-y-6">
              <h2 className="text-lg font-black text-[#6264A7]">الأصول</h2>
              {renderSection("أصول متداولة", data?.assets?.currentAssets, data?.assets?.currentAssets?.reduce((s: number, a: any) => s + a.balance, 0))}
              {renderSection("أصول ثابتة", data?.assets?.fixedAssets, data?.assets?.fixedAssets?.reduce((s: number, a: any) => s + a.balance, 0))}
              <div className="flex justify-between px-2 py-3 bg-[#F0F0F0] rounded-md font-black text-sm">
                <span>إجمالي الأصول</span>
                <span className="font-mono">{fmt(data?.assets?.totalAssets || 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#999999] shadow-sm rounded-md">
            <CardContent className="p-5 space-y-6">
              <h2 className="text-lg font-black text-[#6264A7]">الالتزامات وحقوق الملكية</h2>
              {renderSection("التزامات متداولة", data?.liabilities?.currentLiabilities, data?.liabilities?.currentLiabilities?.reduce((s: number, a: any) => s + a.balance, 0))}
              {renderSection("حقوق الملكية", data?.equity?.lines, data?.equity?.totalEquity)}
              <div className="flex justify-between px-2 py-3 bg-[#F0F0F0] rounded-md font-black text-sm">
                <span>الإجمالي</span>
                <span className="font-mono">{fmt(data?.totalLiabilitiesAndEquity || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
