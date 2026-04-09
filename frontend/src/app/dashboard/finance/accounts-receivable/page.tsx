"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { financeApi } from "@/lib/api/finance";
import { Loader2 } from "lucide-react";

export default function AccountsReceivablePage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load tenants from existing API
    import("@/lib/api").then(({ api }) => api.get("/tenants")).then(d => setTenants(Array.isArray(d) ? d : d.data || [])).catch(console.error);
  }, []);

  const loadStatement = async (tenantId: string) => {
    setSelectedTenant(tenantId);
    setLoading(true);
    try {
      const data = await financeApi.getTenantStatement(tenantId, {});
      setStatement(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#242424]">حسابات <span className="text-[#6264A7]">القبض</span></h1>

      <select
        className="text-sm border border-[#999999] rounded-md px-4 py-2.5 bg-white font-bold text-[#242424] w-full max-w-md"
        value={selectedTenant} onChange={(e) => loadStatement(e.target.value)}
      >
        <option value="">اختر مستأجر...</option>
        {tenants.map((t: any) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
      </select>

      {loading && <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>}

      {statement && (
        <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
          <CardHeader className="bg-[#F0F0F0]/50 border-b border-[#999999] p-4 flex-row items-center justify-between">
            <CardTitle className="text-sm font-black text-[#242424]">كشف حساب — {statement.tenant?.name}</CardTitle>
            <div className="text-xs font-bold font-mono">الرصيد: <span className="text-[#6264A7]">{fmt(statement.closingBalance)}</span></div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">التاريخ</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الوصف</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">مدين</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">دائن</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {(statement.lines || []).map((l: any, i: number) => (
                  <tr key={i} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                    <td className="p-3 font-mono text-[#666666]">{new Date(l.date).toLocaleDateString('ar-IQ')}</td>
                    <td className="p-3 text-[#242424]">{l.description}</td>
                    <td className="p-3 font-mono">{fmt(l.debit)}</td>
                    <td className="p-3 font-mono text-[#666666]">{fmt(l.credit)}</td>
                    <td className="p-3 font-mono font-bold">{fmt(l.runningBalance)}</td>
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
