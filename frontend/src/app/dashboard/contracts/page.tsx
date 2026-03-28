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
import { Plus, Search, FileText, Loader2, Trash2, Calendar, FileCheck, Landmark } from "lucide-react";
import { useCurrency } from "@/context/currency-context";
import { cn } from "@/lib/utils";

export default function ContractsPage() {
  const { format } = useCurrency();
  const [leases, setLeases] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>({
    tenantId: "", unitId: "", startDate: "", endDate: "", rentAmount: "",
    paymentFrequency: "MONTHLY", securityDeposit: "", lateFeePercent: "5"
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); loadDeps(); }, [search]);

  async function load() {
    try {
      const res = await api.get(`/leases?search=${search}&limit=50`);
      setLeases(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function loadDeps() {
    try {
      const [t, u] = await Promise.all([
        api.get("/tenants?limit=100"),
        api.get("/units?limit=100"),
      ]);
      setTenants(t.data || []);
      setUnits((u.data || []).filter((u: any) => u.status === 'AVAILABLE'));
    } catch (err) { console.error(err); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/leases", {
        ...form,
        rentAmount: parseFloat(form.rentAmount),
        securityDeposit: form.securityDeposit ? parseFloat(form.securityDeposit) : undefined,
        lateFeePercent: form.lateFeePercent ? parseFloat(form.lateFeePercent) : 5,
      });
      setShowCreate(false);
      load();
      loadDeps();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function handleTerminate(id: string) {
    if (!confirm("هل أنت متأكد من إنهاء هذا العقد؟")) return;
    try { await api.delete(`/leases/${id}`); load(); loadDeps(); }
    catch (err: any) { alert(err.message); }
  }

  const translateStatus = (status: string) => {
    const statuses: any = {
      ACTIVE: "ساري",
      TERMINATED: "ملغى",
      EXPIRED: "منتهي",
    };
    return statuses[status] || status;
  };

  return (
    <div className="space-y-10 page-enter p-2 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2 leading-tight">
            عقود <span className="text-gradient-indigo">الإيجار</span>
          </h1>
          <p className="text-slate-700 text-lg font-medium flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            إدارة وتوثيق الالتزامات التعاقدية والأرشفة الرقمية للاتفاقيات
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold h-14 px-8 rounded-2xl shadow-lg shadow-indigo-600/20 gap-3 border-none hover:scale-105 transition-all">
          <Plus className="w-5 h-5" /> إبرام عقد جديد
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-end">
        <div className="relative flex-1 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            placeholder="بحث في العقود بالأطراف أو أرقام العقود..." 
            className="w-full pr-12 h-14 bg-white border border-slate-100 shadow-premium rounded-2xl text-lg font-bold placeholder:text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          <p className="font-bold text-slate-600 animate-pulse">جاري فحص قاعدة البيانات...</p>
        </div>
      ) : leases.length === 0 ? (
        <Card className="py-24 text-center border-none shadow-premium bg-white rounded-[40px]">
          <FileCheck className="w-20 h-20 mx-auto text-slate-600 mb-6" />
          <h3 className="text-2xl font-black text-slate-900">أرشيف العقود فارغ</h3>
          <p className="text-slate-600 mt-2 font-medium">ابدأ بتفعيل العقود لربط المستأجرين بوحداتهم.</p>
        </Card>
      ) : (
        <Card className="border-none shadow-premium bg-white rounded-[32px] overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-right py-6 text-slate-900 font-black">رقم المرجع</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black">المستأجر</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black">الوحدة</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black">القيمة والتحصيل</TableHead>
                <TableHead className="text-center py-6 text-slate-900 font-black">الحالة</TableHead>
                <TableHead className="text-left py-6 text-slate-900 font-black pl-8">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leases.map((lease: any) => {
                 const totalInst = lease.installments?.length || 0;
                 const paidInst = lease.installments?.filter((i: any) => i.status === 'PAID').length || 0;
                 const progress = totalInst > 0 ? (paidInst / totalInst) * 100 : 0;
                 
                 return (
                  <TableRow key={lease.id} className="hover:bg-slate-50/40 transition-colors border-slate-50 group">
                    <TableCell className="py-5">
                      <div className="bg-slate-100/80 text-slate-600 px-3 py-1.5 rounded-lg font-mono font-black text-[10px] w-fit">
                        {lease.leaseNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                       <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{lease.tenant?.firstName} {lease.tenant?.lastName}</p>
                       <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{lease.tenant?.phone}</p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-600 text-sm">{lease.unit?.unitNumber}</p>
                        <p className="text-[9px] text-indigo-500 font-black uppercase tracking-wider">{lease.unit?.property?.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="space-y-2">
                          <p className="font-black text-slate-900">{format(lease.rentAmount, lease.currency)}</p>
                          <div className="flex items-center gap-2">
                             <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-24 border border-slate-200/50">
                               <div className={cn(
                                 "h-full rounded-full transition-all duration-1000",
                                 progress === 100 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                               )} style={{ width: `${progress}%` }} />
                             </div>
                             <span className="text-[9px] text-slate-600 font-black">{paidInst}/{totalInst}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "font-black px-4 h-8 rounded-xl border-none shadow-none",
                        lease.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600" :
                        lease.status === 'TERMINATED' ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-700"
                      )}>
                        {translateStatus(lease.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="pl-8 text-left">
                       {lease.status === 'ACTIVE' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-9 h-9 rounded-xl hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors" 
                          onClick={() => handleTerminate(lease.id)}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                 );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[600px] border-none shadow-2xl bg-white rounded-[32px] overflow-hidden p-0" dir="rtl">
          <form onSubmit={handleCreate}>
            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <DialogHeader className="text-right">
                <DialogTitle className="text-3xl font-black text-slate-900 leading-tight">إبرام عقد إيجار</DialogTitle>
                <DialogDescription className="text-slate-700 font-bold">ربط الأطراف وتحديد الالتزامات المالية والجدول الزمني</DialogDescription>
              </DialogHeader>

              <div className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold px-1">الطرف الثاني (المستأجر)</Label>
                  <Select value={form.tenantId} onValueChange={v => setForm({ ...form, tenantId: v })}>
                    <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10">
                      <SelectValue placeholder="اختر من قائمة المستأجرين" />
                    </SelectTrigger>
                    <SelectContent dir="rtl" className="bg-white border-slate-100 rounded-xl shadow-xl">
                      {tenants.map((t: any) => (
                        <SelectItem key={t.id} value={t.id} className="py-3 font-bold">{t.firstName} {t.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold px-1">الوحدة العقارية المعروضة</Label>
                  <Select value={form.unitId} onValueChange={v => setForm({ ...form, unitId: v })}>
                    <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10">
                      <SelectValue placeholder="اختر من الوحدات الشاغرة" />
                    </SelectTrigger>
                    <SelectContent dir="rtl" className="bg-white border-slate-100 rounded-xl shadow-xl">
                      {units.map((u: any) => (
                        <SelectItem key={u.id} value={u.id} className="py-3 font-bold">{u.property?.name} – {u.unitNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold px-1 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" /> نفوذ العقد
                    </Label>
                    <Input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold px-1 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-rose-500" /> انتهاء الصلاحية
                    </Label>
                    <Input required type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold px-1">القيمة الإيجارية المتفق عليها</Label>
                    <Input required type="number" value={form.rentAmount} onChange={e => setForm({ ...form, rentAmount: e.target.value })} className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-black text-lg focus:ring-indigo-500/10" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Label className="text-slate-700 font-bold px-1">وتيرة السداد</Label>
                    <Select value={form.paymentFrequency} onValueChange={v => setForm({ ...form, paymentFrequency: v })}>
                      <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl" className="bg-white border-slate-100 rounded-xl">
                        <SelectItem value="MONTHLY">شهري</SelectItem>
                        <SelectItem value="QUARTERLY">ربع سنوي</SelectItem>
                        <SelectItem value="SEMI_ANNUAL">نصف سنوي</SelectItem>
                        <SelectItem value="ANNUAL">سنوي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 mt-2">
                   <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <Label className="text-[10px] text-slate-600 font-black mb-1 block uppercase tracking-widest">مبلغ التأمين</Label>
                      <input type="number" value={form.securityDeposit} onChange={e => setForm({ ...form, securityDeposit: e.target.value })} className="w-full bg-transparent border-none focus:outline-none font-bold text-slate-700 text-lg" placeholder="0.00" />
                   </div>
                   <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <Label className="text-[10px] text-slate-600 font-black mb-1 block uppercase tracking-widest">غرامة التأخير %</Label>
                      <input type="number" value={form.lateFeePercent} onChange={e => setForm({ ...form, lateFeePercent: e.target.value })} className="w-full bg-transparent border-none focus:outline-none font-bold text-rose-600 text-lg" />
                   </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex gap-4 mt-4">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-600">إلغاء</Button>
              <Button type="submit" disabled={saving} className="flex-1 h-12 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-black shadow-lg shadow-indigo-600/20">
                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                اعتماد العقد
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
