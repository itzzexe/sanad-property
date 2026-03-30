"use client";

import { useState, useEffect } from "react";
import { 
  Calculator, Plus, Search, UserPlus, Users, 
  ArrowUpRight, ArrowDownRight, TrendingUp, Coins,
  ShieldCheck, Loader2, DollarSign, Calendar, Info,
  CheckCircle, AlertTriangle, FileBarChart, Pencil, Trash2, History, X
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useCurrency } from "@/context/currency-context";
import { cn } from "@/lib/utils";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";


export default function SharingPage() {
  const { format } = useCurrency();
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProp, setSelectedProp] = useState("");
  const [shareholders, setShareholders] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isAddShareholderOpen, setIsAddShareholderOpen] = useState(false);
  const [isEditShareholderOpen, setIsEditShareholderOpen] = useState(false);
  const [isDistributeOpen, setIsDistributeOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [dates, setDates] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [form, setForm] = useState({ id: "", name: "", email: "", sharePercent: 0, phone: "" });
  const [distributions, setDistributions] = useState<any[]>([]);

  useEffect(() => { loadProperties(); }, []);

  async function loadProperties() {
    try {
      const res = await api.get("/properties");
      const pData = res.data || res || [];
      setProperties(pData);
      if (pData.length > 0) setSelectedProp(pData[0].id);
    } catch (err) { console.error(err); }
  }

  useEffect(() => {
    if (selectedProp) loadSharingData();
  }, [selectedProp, dates]);

  async function loadSharingData() {
    setLoading(true);
    try {
      const [shRes, anRes] = await Promise.all([
        api.get(`/financial/properties/${selectedProp}/shareholders`),
        api.get(`/financial/properties/${selectedProp}/profit-analysis?startDate=${dates.start}&endDate=${dates.end}`)
      ]);
      setShareholders(shRes || []);
      setAnalysis(anRes);
      
      // Flatten distributions for history
      const allDist = shRes.flatMap((sh: any) => 
        sh.distributions.map((d: any) => ({ ...d, shareholderName: sh.name }))
      ).sort((a:any, b:any) => new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime());
      setDistributions(allDist);
      
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleAddShareholder(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/financial/shareholders", { ...form, propertyId: selectedProp });
      setIsAddShareholderOpen(false);
      resetForm();
      loadSharingData();
    } catch (err) { console.error(err); }
  }

  async function handleEditShareholder(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.put(`/financial/shareholders/${form.id}`, form);
      setIsEditShareholderOpen(false);
      resetForm();
      loadSharingData();
    } catch (err) { console.error(err); }
  }

  async function handleDeleteShareholder(id: string) {
    if(!confirm("هل أنت متأكد من حذف هذا المساهم؟ سيتم حذف جميع سجلات توزيعاته المرتبطة أيضاً.")) return;
    try {
      await api.delete(`/financial/shareholders/${id}`);
      loadSharingData();
    } catch (err) { console.error(err); }
  }

  async function handleDeleteDistribution(id: string) {
    if(!confirm("هل أنت متأكد من حذف هذا السجل المالي للتوزيع؟")) return;
    try {
      await api.delete(`/financial/distributions/${id}`);
      loadSharingData();
    } catch (err) { console.error(err); }
  }

  function resetForm() {
    setForm({ id: "", name: "", email: "", sharePercent: 0, phone: "" });
  }

  async function handleDistribute() {
    try {
      await api.post("/financial/distribute-profit", {
        propertyId: selectedProp,
        amount: analysis.netProfit,
        periodStart: dates.start,
        periodEnd: dates.end
      });
      setIsDistributeOpen(false);
      alert("تم توزيع الأرباح بنجاح على كافة المساهمين!");
      loadSharingData();
    } catch (err) { console.error(err); }
  }

  return (
    <div className="space-y-8 page-enter p-2 md:p-1" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#242424] mb-1">توزيع <span className="text-[#6264A7]">الأرباح</span></h1>
          <p className="text-[#222222] text-sm font-semibold flex items-center gap-2 italic">
            <Coins className="w-4 h-4 text-[#6264A7]" />
            تقسيم العوائد الصافية على الشركاء والمساهمين بعد اقتطاع المصاريف والإهلاك
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <Select value={selectedProp} onValueChange={setSelectedProp}>
             <SelectTrigger className="w-64 bg-white border-[#999999] h-11 font-bold">
               <SelectValue placeholder="اختر العقار" />
             </SelectTrigger>
             <SelectContent className="bg-white" dir="rtl">
                {properties.map(p => (
                  <SelectItem key={p.id} value={p.id} className="font-bold">{p.name}</SelectItem>
                ))}
             </SelectContent>
           </Select>
           <Button onClick={() => { resetForm(); setIsAddShareholderOpen(true); }} className="bg-[#6264A7] hover:bg-[#464775] text-white font-bold h-11 px-6 rounded-md shadow-sm gap-2">
              <UserPlus className="w-4 h-4" />
              إضافة مساهم
           </Button>
           <Button variant="outline" onClick={() => setIsHistoryOpen(true)} className="border-[#6264A7] text-[#6264A7] hover:bg-[#6264A7]/5 font-bold h-11 gap-2">
              <History className="w-4 h-4" />
              سجل التوزيعات
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="md:col-span-1 space-y-4">
            <Card className="bg-white border-[#999999] p-6 shadow-sm">
               <Label className="font-black text-[#222222] text-[10px] uppercase tracking-widest mb-4 block text-right">فترة التحليل</Label>
               <div className="space-y-4">
                  <div className="space-y-2 text-right">
                     <Label className="text-xs font-bold text-slate-700">من تاريخ</Label>
                     <Input type="date" value={dates.start} onChange={e => setDates({...dates, start: e.target.value})} className="bg-slate-50 text-slate-900 font-bold h-10 text-xs" />
                  </div>
                  <div className="space-y-2 text-right">
                     <Label className="text-xs font-bold text-slate-700">إلى تاريخ</Label>
                     <Input type="date" value={dates.end} onChange={e => setDates({...dates, end: e.target.value})} className="bg-slate-50 text-slate-900 font-bold h-10 text-xs" />
                  </div>
               </div>
            </Card>

            <Card className="bg-[#6264A7] text-white p-6 shadow-xl border-none text-right">
               <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">الصافي القابل للتوزيع</p>
               <p className="text-3xl font-black">{loading ? "..." : format(analysis?.netProfit || 0)}</p>
               <div className="h-2 w-full bg-white/10 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-white w-2/3" />
               </div>
               <Button onClick={() => setIsDistributeOpen(true)} disabled={!analysis || analysis.netProfit <= 0} className="w-full mt-6 bg-white text-[#6264A7] hover:bg-white/90 font-black h-11 gap-2 shadow-lg shadow-[#464775]/20">
                  <Calculator className="w-4 h-4" />
                  توزيع الآن
               </Button>
            </Card>
         </div>

         <div className="md:col-span-3 space-y-6">
            <div className="grid grid-cols-3 gap-6">
               <Card className="bg-white border-[#999999] p-6 shadow-sm flex flex-col gap-1 transition-all hover:border-[#6264A7]/30 group text-right">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                       <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="text-[9px] border-emerald-200 text-emerald-600">إيرادات كلية</Badge>
                  </div>
                  <p className="text-2xl font-black text-[#242424]">{format(analysis?.revenue || 0)}</p>
               </Card>

               <Card className="bg-white border-[#999999] p-6 shadow-sm flex flex-col gap-1 transition-all hover:border-rose-300 group text-right">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                       <ArrowDownRight className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="text-[9px] border-rose-200 text-rose-600">مصروفات تشغيلية</Badge>
                  </div>
                  <p className="text-2xl font-black text-[#242424]">{format(analysis?.expenses || 0)}</p>
               </Card>

               <Card className="bg-white border-[#999999] p-6 shadow-sm flex flex-col gap-1 transition-all hover:border-amber-300 group text-right">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                       <TrendingUp className="w-5 h-5 rotate-180" />
                    </div>
                    <Badge variant="outline" className="text-[9px] border-amber-200 text-amber-600">إهلاك الأصول</Badge>
                  </div>
                  <p className="text-2xl font-black text-[#242424]">{format(analysis?.depreciation || 0)}</p>
               </Card>
            </div>

            <Card className="bg-white border-[#999999] shadow-sm rounded-lg overflow-hidden">
               <CardHeader className="bg-[#F0F0F0]/50 border-b border-[#999999]">
                  <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                     <Users className="w-5 h-5 text-[#6264A7]" />
                     حصص المساهمين والشركاء
                  </CardTitle>
               </CardHeader>
               <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-[#F0F0F0]">
                       <TableHead className="text-right py-4 font-black">المساهم</TableHead>
                       <TableHead className="text-center py-4 font-black">النسبة (%)</TableHead>
                       <TableHead className="text-right py-4 font-black">الحصة التقديرية</TableHead>
                       <TableHead className="text-right py-4 font-black">إجمالي المستلم</TableHead>
                       <TableHead className="text-left py-4 font-black">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={5} className="h-16 animate-pulse bg-slate-50/50" />
                          </TableRow>
                        ))
                     ) : shareholders.length === 0 ? (
                        <TableRow>
                           <TableCell colSpan={5} className="h-40 text-center text-slate-600 font-bold italic">لا يوجد مساهمين لهذا العقار حالياً</TableCell>
                        </TableRow>
                     ) : (
                       shareholders.map(sh => (
                         <TableRow key={sh.id} className="hover:bg-slate-50 text-slate-900 font-bold transition-colors border-[#F0F0F0]">
                            <TableCell className="py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#6264A7] flex items-center justify-center font-black">
                                     {sh.name[0]}
                                  </div>
                                  <div>
                                     <p className="font-bold text-slate-800 text-sm leading-tight">{sh.name}</p>
                                     <p className="text-[10px] text-slate-500 font-bold">{sh.email || sh.phone}</p>
                                  </div>
                               </div>
                            </TableCell>
                            <TableCell className="text-center">
                               <Badge className="bg-[#EBEBEB] text-[#6264A7] border border-[#999999] shadow-none font-black px-4 py-1.5 rounded-md">
                                  {sh.sharePercent}%
                               </Badge>
                            </TableCell>
                            <TableCell className="font-black text-emerald-600">
                               {format((analysis?.netProfit || 0) * (sh.sharePercent / 100))}
                            </TableCell>
                            <TableCell className="font-black text-slate-700">
                               {format(sh.distributions?.reduce((acc:any, curr:any) => acc + curr.amount, 0) || 0)}
                            </TableCell>
                            <TableCell className="text-left">
                               <div className="flex items-center gap-1 justify-end">
                                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-slate-200" onClick={() => {
                                    setForm({ id: sh.id, name: sh.name, email: sh.email || "", phone: sh.phone || "", sharePercent: sh.sharePercent });
                                    setIsEditShareholderOpen(true);
                                  }}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-rose-50 text-rose-600" onClick={() => handleDeleteShareholder(sh.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                               </div>
                            </TableCell>
                         </TableRow>
                       ))
                     )}
                  </TableBody>
               </Table>
            </Card>
         </div>
      </div>

      {/* Add Shareholder Dialog */}
      <Dialog open={isAddShareholderOpen} onOpenChange={setIsAddShareholderOpen}>
         <DialogContent className="sm:max-w-md bg-white rounded-xl shadow-2xl p-0 overflow-hidden" dir="rtl">
            <form onSubmit={handleAddShareholder}>
               <div className="p-8 space-y-6">
                  <DialogHeader className="text-right">
                     <DialogTitle className="text-2xl font-black text-[#242424]">إضافة شريك جديد</DialogTitle>
                     <DialogDescription className="font-bold text-[#222222]">توزيع حصص الملكية ضمن هذا العقار</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                     <div className="space-y-2 text-right">
                        <Label className="font-bold">اسم الشريك</Label>
                        <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-11 bg-slate-50 text-slate-900 font-bold rounded-md" />
                     </div>
                     <div className="grid grid-cols-2 gap-4 text-right">
                        <div className="space-y-2">
                           <Label className="font-bold">نسبة الملكية (%)</Label>
                           <Input type="number" step="0.01" required value={form.sharePercent} onChange={e => setForm({...form, sharePercent: parseFloat(e.target.value)})} className="h-11 bg-slate-50 text-slate-900 font-bold text-left font-black" dir="ltr" />
                        </div>
                        <div className="space-y-2">
                           <Label className="font-bold">رقم الهاتف</Label>
                           <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-11 bg-slate-50 text-slate-900 font-bold text-left" dir="ltr" />
                        </div>
                     </div>
                     <div className="space-y-2 text-right">
                        <Label className="font-bold">البريد الإلكتروني</Label>
                        <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-11 bg-slate-50 text-slate-900 font-bold text-left" dir="ltr" />
                     </div>
                  </div>
               </div>
               <DialogFooter className="p-8 bg-[#F0F0F0] border-t border-[#999999] flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsAddShareholderOpen(false)} className="flex-1 font-bold">إلغاء</Button>
                  <Button type="submit" className="flex-1 bg-[#6264A7] text-white hover:bg-[#464775] h-11 font-black">تأكيد الإضافة</Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* Edit Shareholder Dialog */}
      <Dialog open={isEditShareholderOpen} onOpenChange={setIsEditShareholderOpen}>
         <DialogContent className="sm:max-w-md bg-white rounded-xl shadow-2xl p-0 overflow-hidden" dir="rtl">
            <form onSubmit={handleEditShareholder}>
               <div className="p-8 space-y-6">
                  <DialogHeader className="text-right">
                     <DialogTitle className="text-2xl font-black text-[#242424]">تعديل بيانات المساهم</DialogTitle>
                     <DialogDescription className="font-bold text-[#222222]">تعديل معلومات الشريك أو نسبة ملكيته</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                     <div className="space-y-2 text-right">
                        <Label className="font-bold">اسم الشريك</Label>
                        <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-11 bg-slate-50 text-slate-900 font-bold rounded-md" />
                     </div>
                     <div className="grid grid-cols-2 gap-4 text-right">
                        <div className="space-y-2">
                           <Label className="font-bold">نسبة الملكية (%)</Label>
                           <Input type="number" step="0.01" required value={form.sharePercent} onChange={e => setForm({...form, sharePercent: parseFloat(e.target.value)})} className="h-11 bg-slate-50 text-slate-900 font-bold text-left font-black" dir="ltr" />
                        </div>
                        <div className="space-y-2">
                           <Label className="font-bold">رقم الهاتف</Label>
                           <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-11 bg-slate-50 text-slate-900 font-bold text-left" dir="ltr" />
                        </div>
                     </div>
                     <div className="space-y-2 text-right">
                        <Label className="font-bold">البريد الإلكتروني</Label>
                        <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-11 bg-slate-50 text-slate-900 font-bold text-left" dir="ltr" />
                     </div>
                  </div>
               </div>
               <DialogFooter className="p-8 bg-[#F0F0F0] border-t border-[#999999] flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsEditShareholderOpen(false)} className="flex-1 font-bold">إلغاء</Button>
                  <Button type="submit" className="flex-1 bg-[#6264A7] text-white hover:bg-[#464775] h-11 font-black">حفظ التغييرات</Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
         <DialogContent className="sm:max-w-3xl bg-white rounded-3xl shadow-2xl p-0 overflow-hidden" dir="rtl">
            <div className="p-8 space-y-6">
               <DialogHeader className="text-right flex flex-row items-center justify-between">
                  <div>
                    <DialogTitle className="text-2xl font-black text-slate-900 leading-tight">سجل توزيع الأرباح التاريخي</DialogTitle>
                    <DialogDescription className="font-bold text-slate-600">قائمة بكافة المبالغ التي تم صرفها للمساهمين</DialogDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(false)}><X className="w-5 h-5"/></Button>
               </DialogHeader>

               <div className="max-h-[400px] overflow-y-auto rounded-xl border border-slate-100">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0">
                       <TableRow>
                          <TableHead className="text-right font-black">المساهم</TableHead>
                          <TableHead className="text-right font-black">المبلغ المسلم</TableHead>
                          <TableHead className="text-right font-black">الفترة الزمنية</TableHead>
                          <TableHead className="text-right font-black">تاريخ الصرف</TableHead>
                          <TableHead className="text-left font-black">الإجراءات</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {distributions.length === 0 ? (
                         <TableRow>
                            <TableCell colSpan={5} className="py-20 text-center text-slate-400 font-bold italic">لا توجد سجلات توزيع سابقة</TableCell>
                         </TableRow>
                       ) : (
                         distributions.map(d => (
                           <TableRow key={d.id} className="font-bold text-slate-700">
                              <TableCell className="font-black text-slate-900">{d.shareholderName}</TableCell>
                              <TableCell className="text-emerald-600 font-black">{format(d.amount)}</TableCell>
                              <TableCell className="text-[10px] text-slate-500">
                                 {new Date(d.periodStart).toLocaleDateString('ar-EG')} - {new Date(d.periodEnd).toLocaleDateString('ar-EG')}
                              </TableCell>
                              <TableCell className="text-[11px]">{new Date(d.distributedAt).toLocaleDateString('ar-EG')}</TableCell>
                              <TableCell className="text-left">
                                 <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-rose-600 hover:bg-rose-50" onClick={() => handleDeleteDistribution(d.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                 </Button>
                              </TableCell>
                           </TableRow>
                         ))
                       )}
                    </TableBody>
                  </Table>
               </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 text-left">
               <Button onClick={() => setIsHistoryOpen(false)} className="bg-slate-900 text-white font-bold h-11 px-8 rounded-xl">إغلاق</Button>
            </div>
         </DialogContent>
      </Dialog>

      {/* Distribute Confirmation Dialog */}
      <Dialog open={isDistributeOpen} onOpenChange={setIsDistributeOpen}>
         <DialogContent className="sm:max-w-md bg-white rounded-xl shadow-2xl p-0 overflow-hidden" dir="rtl">
            <div className="p-10 space-y-6 text-center">
               <div className="w-20 h-20 rounded-full bg-[#6264A7]/10 flex items-center justify-center mx-auto text-[#6264A7]">
                  <Coins className="w-10 h-10" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-black text-[#242424]">تأكيد توزيع الأرباح</h3>
                  <p className="text-slate-700 font-bold leading-relaxed px-4">أنت على وشك توزيع مبلغ <span className="text-emerald-600 font-black">{format(analysis?.netProfit || 0)}</span> على <span className="text-[#6264A7] font-black">{shareholders.length}</span> مساهمين حسب حصصهم الموضحة.</p>
               </div>
               <div className="bg-slate-50 text-slate-900 font-bold p-5 rounded-xl space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                     <span>إجمالي العوائد:</span>
                     <span className="text-slate-900">{format(analysis?.revenue || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                     <span>إجمالي التكاليف (المصروفات + الإهلاك):</span>
                     <span className="text-rose-600">{format((analysis?.expenses || 0) + (analysis?.depreciation || 0))}</span>
                  </div>
               </div>
            </div>
            <DialogFooter className="p-8 bg-[#F0F0F0] border-t border-[#999999] flex gap-3">
               <Button variant="ghost" onClick={() => setIsDistributeOpen(false)} className="flex-1 font-bold">تراجع</Button>
               <Button onClick={handleDistribute} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-black">توزيع الآن</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
