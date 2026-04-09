"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { financeApi } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { Loader2, DollarSign } from "lucide-react";

export default function BillDetailPage() {
  const { id } = useParams();
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { financeApi.getBill(id as string).then(setBill).catch(console.error).finally(() => setLoading(false)); }, [id]);

  const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="flex items-center justify-center h-[40vh]"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>;
  if (!bill) return <p className="text-center text-[#999999] font-bold py-12">لم يتم العثور على الفاتورة</p>;

  const handlePay = async () => {
    try {
      await financeApi.payBill(bill.id, { amount: bill.totalAmount, paymentDate: new Date().toISOString().slice(0, 10) });
      setBill({ ...bill, status: 'PAID' });
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#242424]">فاتورة <span className="text-[#6264A7]">#{bill.billNumber}</span></h1>
          <p className="text-xs font-bold text-[#666666] mt-1">{bill.vendor?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("font-bold text-[10px]",
            bill.status === 'PAID' ? "bg-emerald-50 text-emerald-700" : "bg-yellow-50 text-yellow-700")}>
            {bill.status === 'PAID' ? 'مدفوعة' : bill.status}
          </Badge>
          {bill.status !== 'PAID' && bill.status !== 'VOIDED' && (
            <Button onClick={handlePay} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> تسجيل الدفع
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-[#999999] rounded-md"><CardContent className="p-4">
          <p className="text-[9px] font-black text-[#999999] uppercase tracking-widest">التاريخ</p>
          <p className="text-sm font-bold font-mono mt-1">{new Date(bill.date).toLocaleDateString('ar-IQ')}</p>
        </CardContent></Card>
        <Card className="bg-white border-[#999999] rounded-md"><CardContent className="p-4">
          <p className="text-[9px] font-black text-[#999999] uppercase tracking-widest">الاستحقاق</p>
          <p className="text-sm font-bold font-mono mt-1">{new Date(bill.dueDate).toLocaleDateString('ar-IQ')}</p>
        </CardContent></Card>
        <Card className="bg-white border-[#999999] rounded-md"><CardContent className="p-4">
          <p className="text-[9px] font-black text-[#999999] uppercase tracking-widest">المبلغ الفرعي</p>
          <p className="text-sm font-bold font-mono mt-1">{fmt(bill.subtotal)}</p>
        </CardContent></Card>
        <Card className="bg-white border-[#999999] rounded-md"><CardContent className="p-4">
          <p className="text-[9px] font-black text-[#999999] uppercase tracking-widest">الإجمالي</p>
          <p className="text-sm font-black font-mono mt-1 text-[#6264A7]">{fmt(bill.totalAmount)}</p>
        </CardContent></Card>
      </div>
    </div>
  );
}
