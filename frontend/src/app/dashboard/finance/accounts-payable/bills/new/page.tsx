"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { financeApi, Account, Vendor } from "@/lib/api/finance";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";

interface BillLineForm { accountId: string; description: string; quantity: string; unitPrice: string; }

export default function NewBillPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vendorId, setVendorId] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [lines, setLines] = useState<BillLineForm[]>([{ accountId: '', description: '', quantity: '1', unitPrice: '' }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    financeApi.getVendors().then(d => setVendors(Array.isArray(d) ? d : [])).catch(console.error);
    financeApi.getAccounts().then(d => setAccounts(Array.isArray(d) ? d : [])).catch(console.error);
  }, []);

  const subtotal = lines.reduce((s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0), 0);
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const addLine = () => setLines([...lines, { accountId: '', description: '', quantity: '1', unitPrice: '' }]);
  const removeLine = (i: number) => { if (lines.length > 1) setLines(lines.filter((_, idx) => idx !== i)); };
  const updateLine = (i: number, field: string, value: string) => {
    const next = [...lines]; (next[i] as any)[field] = value; setLines(next);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await financeApi.createBill({
        vendorId, billNumber, date, dueDate,
        lines: lines.filter(l => l.accountId).map(l => ({
          accountId: l.accountId, description: l.description,
          quantity: parseFloat(l.quantity) || 1, unitPrice: parseFloat(l.unitPrice) || 0,
        })),
      });
      router.push('/dashboard/finance/accounts-payable/bills');
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-black text-[#242424]">فاتورة <span className="text-[#6264A7]">جديدة</span></h1>

      <Card className="bg-white border-[#999999] shadow-sm rounded-md">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-xs font-bold text-[#222222]">المورّد</Label>
              <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="mt-1 w-full border border-[#999999] rounded-md px-3 py-2 text-xs bg-white">
                <option value="">اختر مورّد...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div><Label className="text-xs font-bold text-[#222222]">رقم الفاتورة</Label>
              <Input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} className="mt-1 border-[#999999] text-sm" /></div>
            <div><Label className="text-xs font-bold text-[#222222]">التاريخ</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 border-[#999999] text-sm" /></div>
            <div><Label className="text-xs font-bold text-[#222222]">تاريخ الاستحقاق</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 border-[#999999] text-sm" /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
        <CardHeader className="bg-[#F0F0F0]/50 border-b border-[#999999] p-4 flex-row items-center justify-between">
          <CardTitle className="text-sm font-black text-[#242424]">بنود الفاتورة</CardTitle>
          <Button variant="outline" size="sm" onClick={addLine} className="gap-1 text-xs font-bold border-[#999999]"><Plus className="w-3 h-3" /> إضافة</Button>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
              <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الحساب</th>
              <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الوصف</th>
              <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] w-20">الكمية</th>
              <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] w-28">السعر</th>
              <th className="p-3 w-10"></th>
            </tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-b border-[#F5F5F5]">
                  <td className="p-2"><select value={l.accountId} onChange={(e) => updateLine(i, 'accountId', e.target.value)} className="w-full border border-[#999999] rounded px-2 py-1.5 text-xs bg-white">
                    <option value="">اختر...</option>
                    {accounts.filter(a => a.type === 'EXPENSE').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                  </select></td>
                  <td className="p-2"><Input value={l.description} onChange={(e) => updateLine(i, 'description', e.target.value)} className="border-[#999999] text-xs" /></td>
                  <td className="p-2"><Input type="number" value={l.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)} className="border-[#999999] text-xs font-mono" dir="ltr" /></td>
                  <td className="p-2"><Input type="number" step="0.01" value={l.unitPrice} onChange={(e) => updateLine(i, 'unitPrice', e.target.value)} className="border-[#999999] text-xs font-mono" dir="ltr" /></td>
                  <td className="p-2"><button onClick={() => removeLine(i)} className="text-[#999999] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
              <tr className="bg-[#FAFAFA] border-t-2 border-[#EBEBEB]">
                <td colSpan={3} className="p-3 text-xs font-black text-[#242424]">الإجمالي</td>
                <td className="p-3 font-mono font-black text-[#242424] text-xs">{fmt(subtotal)}</td>
                <td /></tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting || !vendorId || !billNumber} className="bg-[#6264A7] hover:bg-[#5254A0] text-white text-xs font-bold gap-1.5">
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} حفظ الفاتورة
        </Button>
      </div>
    </div>
  );
}
