"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Plus, Search, CreditCard, Loader2, Receipt, Wallet, Banknote, ShieldCheck, Paperclip, Eye, FileText, Calendar, User, Building } from "lucide-react";
import { AttachmentManager } from "@/components/shared/attachment-manager";
import { useCurrency } from "@/context/currency-context";
import { cn } from "@/lib/utils";

export default function PaymentsPage() {
  const { format } = useCurrency();
  const [payments, setPayments] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>({
    leaseId: "", amount: "", method: "CASH", notes: "", transactionRef: "",
  });
  const [saving, setSaving] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  useEffect(() => { load(); loadLeases(); }, [search]);
  
  async function load() {
    try {
      const res = await api.get(`/payments?search=${search}&limit=50`);
      setPayments(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function loadLeases() {
    try {
      const res = await api.get("/leases?status=ACTIVE&limit=100");
      setLeases(res.data || []);
    } catch (err) { console.error(err); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/payments", { ...form, amount: parseFloat(form.amount) });
      setShowCreate(false);
      load();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function generateReceipt(paymentId: string) {
    try {
      await api.post(`/receipts/generate/${paymentId}`);
      load();
      alert("تم إصدار الوصل بنجاح!");
    } catch (err: any) { alert(err.message); }
  }

  const translateMethod = (method: string) => {
    const methods: any = {
      CASH: "نقدي",
      BANK_TRANSFER: "تحويل بنكي",
      DIGITAL_WALLET: "محفظة رقمية",
      CHECK: "صك بنكي",
    };
    return methods[method] || method;
  };

  const translateStatus = (status: string) => {
    const statuses: any = {
      PENDING: "معلق",
      COMPLETED: "مكتمل",
      CANCELLED: "ملغى",
    };
    return statuses[status] || status;
  };

  return (
    <div className="space-y-10 page-enter p-2 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2 leading-tight">
            العمليات <span className="text-gradient-indigo">المالية</span>
          </h1>
          <p className="text-slate-700 text-lg font-medium flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            توثيق التدفقات النقدية المركزية وإدارة السندات المالية المحاسبية
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold h-14 px-8 rounded-2xl shadow-lg shadow-indigo-600/20 gap-3 border-none hover:scale-105 transition-all">
          <Plus className="w-5 h-5" /> تسجيل دفعة نقدية
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-end">
        <div className="relative flex-1 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            placeholder="بحث في السجلات بالرقم، المستأجر، أو طريقة الدفع..." 
            className="w-full pr-12 h-14 bg-white border border-slate-100 shadow-premium rounded-2xl text-lg font-bold placeholder:text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          <p className="font-bold text-slate-600 animate-pulse">جاري فحص السجلات المالية...</p>
        </div>
      ) : payments.length === 0 ? (
        <Card className="py-24 text-center border-none shadow-premium bg-white rounded-[40px]">
          <Banknote className="w-20 h-20 mx-auto text-slate-600 mb-6" />
          <h3 className="text-2xl font-black text-slate-900">سجل المدفوعات خالي</h3>
          <p className="text-slate-600 mt-2 font-medium">لم يتم توثيق أي معاملات مالية في الفترة المحددة.</p>
        </Card>
      ) : (
        <Card className="border-none shadow-premium bg-white rounded-[32px] overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-right py-6 text-slate-900 font-black">رقم القيد</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black">المستأجر</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black">تفصيل الوحدة</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black">المبلغ</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black text-center">الحالة</TableHead>
                <TableHead className="text-left py-6 text-slate-900 font-black pl-8">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: any) => (
                <TableRow key={payment.id} className="hover:bg-slate-50/40 transition-colors border-slate-50 group">
                  <TableCell className="py-5">
                    <div className="bg-slate-100/80 text-slate-600 px-3 py-1.5 rounded-lg font-mono font-black text-[10px] w-fit">
                      {payment.paymentNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                     <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{payment.lease?.tenant?.firstName} {payment.lease?.tenant?.lastName}</p>
                     <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{formatDate(payment.paidDate)}</p>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-600 text-sm">{payment.lease?.unit?.unitNumber}</p>
                      <p className="text-[9px] text-indigo-500 font-black uppercase tracking-wider">{payment.lease?.unit?.property?.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="space-y-0.5">
                        <p className="font-black text-emerald-600 text-base">{format(payment.amount, payment.currency)}</p>
                        <span className="text-[8px] font-bold text-slate-500 px-1.5 py-0.5 rounded-full bg-slate-100">{translateMethod(payment.method)}</span>
                     </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "font-black px-4 h-8 rounded-xl border-none shadow-none",
                      payment.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600" :
                      payment.status === 'PENDING' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {translateStatus(payment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="pl-8 text-left">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-600" onClick={() => {
                          setSelectedPayment(payment);
                          setShowPaymentDetails(true);
                        }}>
                        <Eye className="w-4.5 h-4.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-indigo-50 text-slate-600 hover:text-indigo-600" onClick={() => {
                          setSelectedPayment(payment);
                          setShowAttachments(true);
                        }}>
                        <Paperclip className="w-4.5 h-4.5" />
                      </Button>
                      {payment.receipt ? (
                        <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] bg-indigo-50 h-9 px-4 rounded-xl border border-indigo-100/50 cursor-pointer" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/receipts/pdf/${payment.receipt.id}`)}>
                           <Receipt className="w-3.5 h-3.5" /> سند مالي
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="h-9 rounded-xl px-4 text-[10px] font-black gap-2 border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-bold" onClick={() => generateReceipt(payment.id)}>
                          <Plus className="w-3.5 h-3.5" /> إصدار سند
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[550px] border-none shadow-2xl bg-white rounded-[32px] overflow-hidden p-0" dir="rtl">
          <form onSubmit={handleCreate}>
            <div className="p-8 space-y-6">
              <DialogHeader className="text-right">
                <DialogTitle className="text-3xl font-black text-slate-900 leading-tight">قيد تحصيل مالي</DialogTitle>
                <DialogDescription className="text-slate-700 font-bold">توثيق استلام المبالغ النقدية وإدراجها في الميزانية التشغيلية</DialogDescription>
              </DialogHeader>

              <div className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold px-1">العقد المرتبط</Label>
                  <Select value={form.leaseId} onValueChange={v => setForm({ ...form, leaseId: v })}>
                    <SelectTrigger className="h-14 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10">
                      <SelectValue placeholder="اختر العقد المصدر للدفعة" />
                    </SelectTrigger>
                    <SelectContent dir="rtl" className="bg-white border-slate-100 rounded-xl shadow-xl">
                      {leases.map((l: any) => (
                        <SelectItem key={l.id} value={l.id} className="py-3 font-bold">
                          {l.leaseNumber} – {l.tenant?.firstName} {l.tenant?.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold px-1">المبلغ المحصل</Label>
                    <Input required type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-black text-lg text-emerald-600 focus:ring-indigo-500/10" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Label className="text-slate-700 font-bold px-1">طريقة السداد</Label>
                    <Select value={form.method} onValueChange={v => setForm({ ...form, method: v })}>
                      <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl" className="bg-white border-slate-100 rounded-xl">
                        <SelectItem value="CASH">نقدي</SelectItem>
                        <SelectItem value="BANK_TRANSFER">تحويل بنكي</SelectItem>
                        <SelectItem value="DIGITAL_WALLET">محفظة ذكية</SelectItem>
                        <SelectItem value="CHECK">صك بنكي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold px-1">الملاحظات ومرجع المعاملة</Label>
                    <textarea 
                      value={form.notes} 
                      onChange={e => setForm({ ...form, notes: e.target.value })} 
                      placeholder="رقم العملية أو ملاحظات إضافية..." 
                      className="w-full h-24 p-4 bg-slate-50/50 border border-slate-100 rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all text-sm text-slate-900"
                    />
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex gap-4 mt-4">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">إلغاء</Button>
              <Button type="submit" disabled={saving} className="flex-1 h-12 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-black shadow-lg shadow-indigo-600/20">
                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                اعتماد العملية
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
        <DialogContent className="sm:max-w-[600px] border-none shadow-2xl bg-white rounded-[32px] overflow-hidden p-0" dir="rtl">
           <div className="p-8 space-y-8">
              <DialogHeader className="text-right">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-3xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                     <Banknote className="w-8 h-8" />
                   </div>
                   <div>
                     <DialogTitle className="text-3xl font-black text-slate-900 leading-tight">تفاصيل القيد المالي</DialogTitle>
                     <p className="text-slate-500 font-bold font-mono text-sm uppercase tracking-widest">{selectedPayment?.paymentNumber}</p>
                   </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1 flex items-center gap-1">
                      <User className="w-3 h-3" /> المستأجر
                    </p>
                    <p className="font-black text-slate-900">{selectedPayment?.lease?.tenant?.firstName} {selectedPayment?.lease?.tenant?.lastName}</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1 flex items-center gap-1">
                      <Building className="w-3 h-3" /> العقار / الوحدة
                    </p>
                    <p className="font-black text-slate-900">{selectedPayment?.lease?.unit?.unitNumber} – {selectedPayment?.lease?.unit?.property?.name}</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1">المبلغ المحصل</p>
                    <p className="text-2xl font-black text-emerald-600">{format(selectedPayment?.amount, selectedPayment?.currency)}</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1">تاريخ العملية</p>
                    <p className="text-base font-black text-slate-900">{selectedPayment?.paidDate ? formatDate(selectedPayment.paidDate) : '—'}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-600">طريقة السداد:</span>
                    <span className="font-black text-slate-900">{translateMethod(selectedPayment?.method)}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-600">حالة القيد:</span>
                    <Badge className={cn(
                      "font-black px-4 rounded-lg",
                      selectedPayment?.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>{translateStatus(selectedPayment?.status)}</Badge>
                 </div>
                 {selectedPayment?.notes && (
                   <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                      <p className="text-[10px] text-indigo-600 font-black uppercase mb-1">ملاحظات إضافية</p>
                      <p className="text-sm font-bold text-slate-800 leading-relaxed">{selectedPayment.notes}</p>
                   </div>
                 )}
              </div>
           </div>
           
           <div className="p-8 bg-slate-50 flex gap-4">
              <Button variant="ghost" onClick={() => setShowPaymentDetails(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-600 hover:bg-slate-200">إغلاق</Button>
              {selectedPayment?.receipt && (
                <Button onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/receipts/pdf/${selectedPayment.receipt.id}`)} className="flex-2 h-12 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-black gap-2 shadow-lg shadow-indigo-600/20">
                  <FileText className="w-5 h-5" /> تحميل السند المالي
                </Button>
              )}
           </div>
        </DialogContent>
      </Dialog>

      {/* Attachments Dialog */}
      <Dialog open={showAttachments} onOpenChange={setShowAttachments}>
        <DialogContent className="sm:max-w-[700px] border-none shadow-2xl bg-white rounded-[32px] p-8" dir="rtl">
          <DialogHeader className="text-right mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 leading-tight flex items-center gap-3">
              <Paperclip className="w-6 h-6 text-indigo-600" />
              مرفقات الدفعة: {selectedPayment?.paymentNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <AttachmentManager 
              entityType="PAYMENT" 
              entityId={selectedPayment.id} 
              title="إيصالات الدفع والتحويلات"
            />
          )}

          <div className="mt-8 flex justify-end">
            <Button 
              type="button"
              onClick={() => setShowAttachments(false)} 
              className="bg-slate-100 text-slate-900 hover:bg-slate-200 font-bold px-8 rounded-xl"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
