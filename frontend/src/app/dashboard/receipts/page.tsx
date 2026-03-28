"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/context/currency-context";
import { Search, Receipt, Loader2, Download, FileText, Printer, ShieldCheck, Eye } from "lucide-react";

export default function ReceiptsPage() {
  const { format } = useCurrency();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, [search]);

  async function load() {
    try {
      const res = await api.get(`/receipts?search=${search}&limit=50`);
      setReceipts(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function downloadPdf(receiptId: string, receiptNumber: string, mode: 'view' | 'download' = 'download') {
    try {
      const token = localStorage.getItem("accessToken");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${API_URL}/receipts/${receiptId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("فشل تحميل ملف PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      if (mode === 'view') {
        window.open(url, '_blank');
        return;
      }
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `وصل-${receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 2000);
    } catch (err: any) { 
      console.error(err);
      alert("خطأ: " + err.message); 
    }
  }

  return (
    <div className="space-y-10 page-enter p-2 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2 leading-tight">
            سندات <span className="text-gradient-indigo">القبض</span>
          </h1>
          <p className="text-slate-700 text-lg font-medium flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-500" />
            الأرشيف المالي للوصولات الرسمية الموثقة بنظام التشفير (QR)
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-end">
        <div className="relative flex-1 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            placeholder="بحث عن وصل برقم السند أو اسم المستأجر..." 
            className="w-full pr-12 h-14 bg-white border border-slate-100 shadow-premium rounded-2xl text-lg font-bold placeholder:text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          <p className="font-bold text-slate-600 animate-pulse">جاري سحب الأرشيف المالي...</p>
        </div>
      ) : receipts.length === 0 ? (
        <Card className="py-24 text-center border-none shadow-premium bg-white rounded-[40px]">
          <Receipt className="w-20 h-20 mx-auto text-slate-600 mb-6" />
          <h3 className="text-2xl font-black text-slate-900">لا توجد وصولات حالياً</h3>
          <p className="text-slate-600 mt-2 font-medium">سيتم إدراج الوصولات هنا تلقائياً عند تأكيد المدفوعات.</p>
        </Card>
      ) : (
        <Card className="border-none shadow-premium bg-white rounded-[32px] overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-right py-6 text-slate-900 font-black">رقم السند</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black">المستأجر</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black">بيان العقار</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black">المبلغ</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black">التاريخ</TableHead>
                <TableHead className="text-center py-6 text-slate-900 font-black">التوثيق</TableHead>
                <TableHead className="text-left py-6 text-slate-900 font-black pl-8">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt: any) => (
                <TableRow key={receipt.id} className="hover:bg-slate-50/40 transition-colors border-slate-50 group">
                  <TableCell className="py-5">
                    <div className="bg-slate-100/80 text-slate-600 px-3 py-1.5 rounded-lg font-mono font-black text-[10px] w-fit">
                      {receipt.receiptNumber}
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                     {receipt.payment?.lease?.tenant?.firstName} {receipt.payment?.lease?.tenant?.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-600 text-sm">{receipt.payment?.lease?.unit?.property?.name}</p>
                      <p className="text-[9px] text-indigo-500 font-black uppercase tracking-wider">{receipt.payment?.lease?.unit?.unitNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-emerald-600 text-base">{format(receipt.payment?.amount || 0, receipt.payment?.currency)}</TableCell>
                  <TableCell className="text-xs font-bold text-slate-600">{formatDate(receipt.issuedAt)}</TableCell>
                  <TableCell className="text-center">
                    {receipt.qrCode ? (
                      <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1 rounded-lg text-[9px] font-black items-center gap-1.5 shadow-none">
                        <ShieldCheck className="w-3.5 h-3.5" /> مؤمن QR
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="pl-8 text-left">
                    <div className="flex gap-2 justify-end">
                       <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-all" onClick={() => downloadPdf(receipt.id, receipt.receiptNumber, 'view')}>
                         <Eye className="w-4.5 h-4.5" />
                       </Button>
                       <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all border border-slate-50" onClick={() => downloadPdf(receipt.id, receipt.receiptNumber)}>
                         <Download className="w-4.5 h-4.5" />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
