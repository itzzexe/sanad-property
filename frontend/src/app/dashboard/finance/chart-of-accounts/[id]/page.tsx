"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { financeApi } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  ASSET: "bg-blue-50 text-blue-700", LIABILITY: "bg-amber-50 text-amber-700",
  EQUITY: "bg-purple-50 text-purple-700", REVENUE: "bg-emerald-50 text-emerald-700",
  EXPENSE: "bg-rose-50 text-rose-700",
};

export default function AccountDetailPage() {
  const { id } = useParams();
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getAccount(id as string).then(setAccount).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="flex items-center justify-center h-[40vh]"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>;
  if (!account) return <p className="text-center text-[#999999] font-bold py-12">لم يتم العثور على الحساب</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#242424]">
            <span className="font-mono text-[#6264A7]">{account.code}</span> — {account.name}
          </h1>
          <p className="text-xs font-bold text-[#666666] mt-1">{account.description || 'لا يوجد وصف'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[9px] font-bold border-none", TYPE_COLORS[account.type])}>
            {account.type}
          </Badge>
          <Badge variant="outline" className={cn("text-[9px] font-bold", account.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500")}>
            {account.isActive ? "نشط" : "متوقف"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-[#999999] rounded-md"><CardContent className="p-4">
          <p className="text-[9px] font-black text-[#999999] uppercase tracking-widest">النوع</p>
          <p className="text-sm font-bold mt-1">{account.type}</p>
        </CardContent></Card>
        <Card className="bg-white border-[#999999] rounded-md"><CardContent className="p-4">
          <p className="text-[9px] font-black text-[#999999] uppercase tracking-widest">النوع الفرعي</p>
          <p className="text-sm font-bold mt-1">{account.subtype || '–'}</p>
        </CardContent></Card>
        <Card className="bg-white border-[#999999] rounded-md"><CardContent className="p-4">
          <p className="text-[9px] font-black text-[#999999] uppercase tracking-widest">العملة</p>
          <p className="text-sm font-bold font-mono mt-1">{account.currencyCode || 'USD'}</p>
        </CardContent></Card>
        <Card className="bg-white border-[#999999] rounded-md"><CardContent className="p-4">
          <p className="text-[9px] font-black text-[#999999] uppercase tracking-widest">الحساب الأب</p>
          <p className="text-sm font-bold mt-1">{account.parentId || 'حساب رئيسي'}</p>
        </CardContent></Card>
      </div>

      {/* Ledger would list journal lines for this account – placeholder for full implementation */}
      <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
        <CardHeader className="bg-[#F0F0F0]/50 border-b border-[#999999] p-4">
          <CardTitle className="text-sm font-black text-[#242424]">دفتر الأستاذ</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center text-[#999999] text-xs font-bold">
          سيتم عرض حركات الحساب هنا عند تحميل البيانات من دفتر الأستاذ العام
        </CardContent>
      </Card>
    </div>
  );
}
