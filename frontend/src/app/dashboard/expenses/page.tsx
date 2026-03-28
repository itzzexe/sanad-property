"use client";

import { useState, useEffect } from "react";
import { 
  Zap, Plus, Search, Filter, ArrowDownRight, ArrowUpRight, 
  Trash2, Receipt, Home, Calendar, CreditCard, Loader2,
  CheckCircle2, AlertCircle, FileText, DollarSign, Coins
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

const CATEGORIES_AR: any = {
  MAINTENANCE: "صيانة",
  UTILITY: "فواتير وخدمات",
  TAX: "ضرائب ورسوم",
  MANAGEMENT: "إدارة",
  INSURANCE: "تأمين",
  SALARY: "رواتب",
  MARKETING: "تسويق",
  OTHER: "أخرى"
};

export default function ExpensesPage() {
  const { format } = useCurrency();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: 0,
    category: "MAINTENANCE",
    propertyId: "",
    description: "",
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [expRes, propRes] = await Promise.all([
        api.get("/financial/expenses"),
        api.get("/properties")
      ]);
      setExpenses(expRes.data || expRes || []);
      const pData = propRes.data || propRes || [];
      setProperties(pData);
      if (pData.length > 0 && !newExpense.propertyId) {
        setNewExpense(prev => ({ ...prev, propertyId: pData[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/financial/expenses", newExpense);
      setIsAddOpen(false);
      loadData();
      setNewExpense({ title: "", amount: 0, category: "MAINTENANCE", propertyId: "", description: "", date: new Date().toISOString().split('T')[0] });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذه النفقة؟")) return;
    try {
      await api.delete(`/financial/expenses/${id}`);
      loadData();
    } catch (err) { console.error(err); }
  }

  const stats = {
    total: expenses.reduce((acc, curr) => acc + curr.amount, 0),
    utilities: expenses.filter(e => e.category === 'UTILITY').reduce((acc, curr) => acc + curr.amount, 0),
    maintenance: expenses.filter(e => e.category === 'MAINTENANCE').reduce((acc, curr) => acc + curr.amount, 0),
  };

  return (
    <div className="space-y-8 page-enter p-2 md:p-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#242424] mb-1">المصروفات و<span className="text-[#6264A7]">الفواتير</span></h1>
          <p className="text-[#222222] text-sm font-semibold flex items-center gap-2 italic">
            <Zap className="w-4 h-4 text-[#6264A7]" />
            إدارة النفقات التشغيلية وفواتير الخدمات بكافة الفئات
          </p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#6264A7] hover:bg-[#464775] text-white font-bold h-11 px-6 rounded-md shadow-sm gap-2">
              <Plus className="w-4 h-4" />
              تسجيل نفقة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-white border-none shadow-2xl rounded-xl p-0 overflow-hidden" dir="rtl">
             <div className="h-1 bg-[#6264A7]" />
             <form onSubmit={handleAdd}>
               <div className="p-8 space-y-6">
                 <DialogHeader className="text-right">
                   <DialogTitle className="text-2xl font-black text-[#242424]">إضافة فاتورة / نفقة</DialogTitle>
                   <DialogDescription className="font-bold text-[#222222]">أدخل تفاصيل النفقة المالية لتخصيمها من الأرباح العامة</DialogDescription>
                 </DialogHeader>

                 <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4 text-right">
                      <div className="space-y-2">
                        <Label className="font-bold">موضوع النفقة</Label>
                        <Input required value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} placeholder="مثال: فاتورة كهرباء ماراثون" className="bg-[#F5F5F5] border-[#999999] h-11 rounded-md" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">المبلغ المستحق</Label>
                        <Input type="number" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} className="bg-[#F5F5F5] border-[#999999] h-11 rounded-md text-left font-black" dir="ltr" />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 text-right">
                      <div className="space-y-2">
                        <Label className="font-bold">التصنيف</Label>
                        <Select value={newExpense.category} onValueChange={v => setNewExpense({...newExpense, category: v})}>
                          <SelectTrigger className="bg-[#F5F5F5] border-[#999999] h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#999999]">
                            {Object.entries(CATEGORIES_AR).map(([k, v]: any) => (
                              <SelectItem key={k} value={k} className="font-bold">{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">العقار المرتبط</Label>
                        <Select value={newExpense.propertyId} onValueChange={v => setNewExpense({...newExpense, propertyId: v})}>
                          <SelectTrigger className="bg-[#F5F5F5] border-[#999999] h-11">
                            <SelectValue placeholder="اختر العقار" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#999999]">
                            {properties.map(p => (
                              <SelectItem key={p.id} value={p.id} className="font-bold">{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                   </div>

                   <div className="space-y-2 text-right">
                      <Label className="font-bold px-1">التاريخ</Label>
                      <Input type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="bg-[#F5F5F5] border-[#999999] h-11 rounded-md" />
                   </div>

                   <div className="space-y-2 text-right">
                      <Label className="font-bold px-1">ملاحظات إضافية</Label>
                      <textarea 
                        className="w-full h-24 p-4 bg-[#F5F5F5] border-[#999999] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6264A7] font-medium text-slate-900"
                        value={newExpense.description}
                        onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                      />
                   </div>
                 </div>
               </div>
               <DialogFooter className="p-8 bg-[#F0F0F0] border-t border-[#999999] flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="flex-1 font-bold text-[#222222]">إلغاء</Button>
                  <Button type="submit" disabled={saving} className="flex-1 bg-[#6264A7] text-white hover:bg-[#464775] font-black h-11 rounded-md">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "حفظ الفاتورة"}
                  </Button>
               </DialogFooter>
             </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-[#999999] shadow-sm flex items-center gap-5 transition-all hover:border-[#6264A7]/30">
           <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <ArrowDownRight className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] text-[#222222] font-black uppercase tracking-widest leading-none mb-2">إجمالي النفقات</p>
              <p className="text-2xl font-black text-[#242424]">{format(stats.total)}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#999999] shadow-sm flex items-center gap-5 transition-all hover:border-[#6264A7]/30">
           <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Zap className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] text-[#222222] font-black uppercase tracking-widest leading-none mb-2">فواتير الخدمات</p>
              <p className="text-2xl font-black text-[#242424]">{format(stats.utilities)}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#999999] shadow-sm flex items-center gap-5 transition-all hover:border-[#6264A7]/30">
           <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Home className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] text-[#222222] font-black uppercase tracking-widest leading-none mb-2">مصاريف الصيانة</p>
              <p className="text-2xl font-black text-[#242424]">{format(stats.maintenance)}</p>
           </div>
        </div>
      </div>

      <Card className="bg-white border border-[#999999] shadow-sm rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-[#F0F0F0]/50">
            <TableRow className="hover:bg-transparent border-[#999999]">
              <TableHead className="py-4 text-[#242424] font-black text-right">النفقة</TableHead>
              <TableHead className="py-4 text-[#242424] font-black text-center">التصنيف</TableHead>
              <TableHead className="py-4 text-[#242424] font-black text-right">العقار</TableHead>
              <TableHead className="py-4 text-[#242424] font-black text-right">المبلغ</TableHead>
              <TableHead className="py-4 text-[#242424] font-black text-right">التاريخ</TableHead>
              <TableHead className="py-4 text-[#242424] font-black text-left pl-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-16 animate-pulse bg-slate-50/50" />
                </TableRow>
              ))
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                   <Receipt className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                   <p className="text-slate-600 font-bold italic">لا توجد نفقات مسجلة حالياً</p>
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((exp: any) => (
                <TableRow key={exp.id} className="hover:bg-[#F5F5F5] transition-colors group border-[#F0F0F0]">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#EBEBEB] flex items-center justify-center text-[#222222] group-hover:bg-[#6264A7] group-hover:text-white transition-all">
                         <FileText className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-[#242424]">{exp.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                     <Badge variant="secondary" className="bg-[#EBEBEB] text-[#111111] font-black text-[9px] px-3 py-1 rounded-sm border-[#999999]">
                        {CATEGORIES_AR[exp.category] || exp.category}
                     </Badge>
                  </TableCell>
                  <TableCell>
                     <p className="font-bold text-slate-600 text-xs">{exp.property?.name || "عام"}</p>
                  </TableCell>
                  <TableCell className="font-black text-rose-600">
                     {format(exp.amount)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-bold">
                     {new Date(exp.date).toLocaleDateString('ar-IQ')}
                  </TableCell>
                  <TableCell className="pl-8 text-left">
                     <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)} className="h-9 w-9 text-slate-600 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                     </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
