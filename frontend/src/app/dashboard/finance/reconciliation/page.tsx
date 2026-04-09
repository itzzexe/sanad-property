"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { financeApi } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { Loader2, Landmark } from "lucide-react";

export default function ReconciliationPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getBankAccounts().then(d => setAccounts(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[40vh]"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#242424]">التسويات <span className="text-[#6264A7]">البنكية</span></h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((ba) => (
          <Link key={ba.id} href={`/dashboard/finance/reconciliation/${ba.id}`}>
            <Card className="bg-white border-[#999999] shadow-sm rounded-md hover:border-[#6264A7] transition-colors cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center"><Landmark className="w-5 h-5 text-[#6264A7]" /></div>
                  <div>
                    <h3 className="text-sm font-black text-[#242424]">{ba.name}</h3>
                    <p className="text-[10px] font-bold text-[#666666]">{ba.bankName}</p>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-[#999999]">رقم الحساب</span>
                  <span className="font-mono text-[#242424]">{ba.accountNumber}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {accounts.length === 0 && <p className="text-sm text-[#999999] font-bold col-span-3 text-center py-12">لا توجد حسابات بنكية</p>}
      </div>
    </div>
  );
}
