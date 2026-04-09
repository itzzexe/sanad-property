"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { financeApi } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, Link2, Wand2, CheckCheck } from "lucide-react";

export default function ReconciliationWorkspacePage() {
  const { bankAccountId, statementId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  const load = () => {
    setLoading(true);
    financeApi.getReconciliation(statementId as string)
      .then(setData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statementId]);

  const handleAutoMatch = async () => {
    setMatching(true);
    try {
      await financeApi.autoMatch(statementId as string);
      load();
    } catch (e) { console.error(e); }
    finally { setMatching(false); }
  };

  const handleManualMatch = async (bankTxnId: string, journalLineId: string) => {
    try {
      await financeApi.manualMatch(bankTxnId, journalLineId);
      load();
    } catch (e) { console.error(e); }
  };

  const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="flex items-center justify-center h-[40vh]"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>;

  const bankTxns = data?.bankTransactions || [];
  const unmatchedJL = data?.unmatchedJournalLines || [];
  const matched = bankTxns.filter((t: any) => t.matched);
  const unmatched = bankTxns.filter((t: any) => !t.matched);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#242424]">ورقة <span className="text-[#6264A7]">التسوية</span></h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAutoMatch} disabled={matching} className="gap-1.5 text-xs font-bold border-[#999999]">
            {matching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} مطابقة تلقائية
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5" disabled={unmatched.length > 0}>
            <CheckCheck className="w-3.5 h-3.5" /> إتمام التسوية
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Bank Transactions */}
        <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
          <CardHeader className="bg-[#F0F0F0]/50 border-b border-[#999999] p-4">
            <CardTitle className="text-sm font-black text-[#242424]">حركات بنكية ({bankTxns.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-[#F5F5F5] max-h-[60vh] overflow-y-auto">
            {unmatched.map((t: any) => (
              <div key={t.id} className="p-3 hover:bg-[#FAFAFA]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#242424]">{t.description}</p>
                    <p className="text-[10px] text-[#666666] font-mono">{new Date(t.date).toLocaleDateString('ar-IQ')}</p>
                  </div>
                  <div className="text-left">
                    <p className={cn("text-xs font-mono font-bold", t.amount >= 0 ? "text-emerald-600" : "text-red-600")}>{fmt(t.amount)}</p>
                    <Badge variant="outline" className="text-[8px] bg-yellow-50 text-yellow-700 border-none font-bold">غير مطابق</Badge>
                  </div>
                </div>
              </div>
            ))}
            {matched.map((t: any) => (
              <div key={t.id} className="p-3 bg-emerald-50/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#242424]">{t.description}</p>
                    <p className="text-[10px] text-[#666666] font-mono">{new Date(t.date).toLocaleDateString('ar-IQ')}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-mono">{fmt(t.amount)}</p>
                    <Badge variant="outline" className="text-[8px] bg-emerald-50 text-emerald-700 border-none font-bold gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> مطابق
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right: Unmatched Journal Lines */}
        <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
          <CardHeader className="bg-[#F0F0F0]/50 border-b border-[#999999] p-4">
            <CardTitle className="text-sm font-black text-[#242424]">قيود غير مطابقة ({unmatchedJL.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-[#F5F5F5] max-h-[60vh] overflow-y-auto">
            {unmatchedJL.map((l: any) => (
              <div key={l.id} className="p-3 hover:bg-[#FAFAFA] cursor-pointer group" data-testid={`journal-line-${l.id}`}
                onClick={() => unmatched.length > 0 && handleManualMatch(unmatched[0].id, l.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#242424]">{l.journalEntry?.entryNumber || l.description}</p>
                    <p className="text-[10px] text-[#666666] font-mono">{new Date(l.journalEntry?.date || l.createdAt).toLocaleDateString('ar-IQ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono">{fmt(Number(l.debit) - Number(l.credit))}</p>
                    <Link2 className="w-3.5 h-3.5 text-[#999999] group-hover:text-[#6264A7] transition-colors" />
                  </div>
                </div>
              </div>
            ))}
            {unmatchedJL.length === 0 && <p className="p-6 text-center text-[#999999] text-xs font-bold">جميع القيود مطابقة</p>}
          </CardContent>
        </Card>
      </div>

      {/* Status Bar */}
      <Card className="bg-white border-[#999999] shadow-sm rounded-md">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-6 text-xs font-bold">
            <span className="text-[#666666]">رصيد افتتاحي: <span className="font-mono text-[#242424]">{fmt(data?.openingBalance || 0)}</span></span>
            <span className="text-[#666666]">إيداعات: <span className="font-mono text-emerald-600">{fmt(data?.totalCredits || 0)}</span></span>
            <span className="text-[#666666]">سحوبات: <span className="font-mono text-red-600">{fmt(data?.totalDebits || 0)}</span></span>
            <span className="text-[#242424]">رصيد ختامي: <span className="font-mono font-black">{fmt(data?.closingBalance || 0)}</span></span>
          </div>
          {unmatched.length === 0 && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        </CardContent>
      </Card>
    </div>
  );
}
