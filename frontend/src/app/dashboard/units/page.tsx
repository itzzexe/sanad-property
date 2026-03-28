"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatCurrency, getStatusColor, cn } from "@/lib/utils";
import { Plus, Search, DoorOpen, Loader2, Trash2, Building2, Layers } from "lucide-react";
import { useCurrency } from "@/context/currency-context";

export default function UnitsPage() {
  const { format } = useCurrency();
  const [units, setUnits] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>({
    unitNumber: "", type: "APARTMENT", monthlyRent: "", propertyId: "",
    floor: "", area: "", bedrooms: "", bathrooms: "", currency: "IQD",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); loadProperties(); }, [search]);

  async function load() {
    try {
      const res = await api.get(`/units?search=${search}&limit=50`);
      setUnits(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function loadProperties() {
    try {
      const res = await api.get("/properties?limit=100");
      setProperties(res.data || []);
    } catch (err) { console.error(err); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/units", {
        ...form,
        monthlyRent: parseFloat(form.monthlyRent),
        floor: form.floor ? parseInt(form.floor) : undefined,
        area: form.area ? parseFloat(form.area) : undefined,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
      });
      setShowCreate(false);
      load();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذه الوحدة؟")) return;
    try { await api.delete(`/units/${id}`); load(); }
    catch (err: any) { alert(err.message); }
  }

  const translateType = (type: string) => {
    const types: any = {
      APARTMENT: "شقة سكنية",
      SHOP: "محل تجاري",
      OFFICE: "مكتب إداري",
      VILLA: "فيلا ملكية",
      WAREHOUSE: "مخزن لوجستي",
    };
    return types[type] || type;
  };

  const translateStatus = (status: string) => {
    const statuses: any = {
      AVAILABLE: "شاغرة",
      RENTED: "مؤجرة",
      MAINTENANCE: "صيانة",
    };
    return statuses[status] || status;
  };

  return (
    <div className="space-y-10 page-enter p-2 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2 leading-tight">
            إدارة <span className="text-gradient-indigo">الوحدات</span>
          </h1>
          <p className="text-slate-700 text-lg font-medium flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-indigo-500" />
            تصنيف وتنظيم الوحدات العقارية ضمن الصروح السكنية والتجارية
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold h-14 px-8 rounded-2xl shadow-lg shadow-indigo-600/20 gap-3 border-none hover:scale-105 transition-all">
          <Plus className="w-5 h-5" /> إضافة وحدة جديدة
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-end">
        <div className="relative flex-1 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            placeholder="بحث عن وحدة برقمها أو نوعها..." 
            className="w-full pr-12 h-14 bg-white border border-slate-100 shadow-premium rounded-2xl text-lg font-bold placeholder:text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          <p className="font-bold text-slate-600 animate-pulse">جاري جلب الوحدات المتاحة...</p>
        </div>
      ) : units.length === 0 ? (
        <Card className="py-24 text-center border-none shadow-premium bg-white rounded-[40px]">
          <DoorOpen className="w-20 h-20 mx-auto text-slate-600 mb-6" />
          <h3 className="text-2xl font-black text-slate-900">لا توجد وحدات مسجلة</h3>
          <p className="text-slate-600 mt-2 font-medium">ابدأ بربط الوحدات العقارية بمشاريعك الكبرى.</p>
        </Card>
      ) : (
        <Card className="border-none shadow-premium bg-white rounded-[32px] overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-right py-6 text-slate-900 font-black">رقم الوحدة</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black">العقار التابع</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black">النوع</TableHead>
                <TableHead className="text-center py-6 text-slate-900 font-black">الحالة</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black">الإيجار الشهري</TableHead>
                <TableHead className="text-left py-6 text-slate-900 font-black pl-8">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit: any) => (
                <TableRow key={unit.id} className="hover:bg-slate-50/40 transition-colors border-slate-50 group">
                  <TableCell className="py-5">
                    <div className="flex items-center gap-3 font-black text-slate-900 text-lg">
                       <div className="w-1.5 h-7 bg-indigo-500 rounded-full" />
                       {unit.unitNumber}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-600" />
                      {unit.property?.name || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold px-3 py-1 rounded-lg">
                      {translateType(unit.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "font-black px-4 h-8 rounded-xl border-none shadow-none",
                      unit.status === 'AVAILABLE' ? "bg-emerald-50 text-emerald-600" :
                      unit.status === 'RENTED' ? "bg-indigo-600 text-white" : "bg-amber-50 text-amber-600"
                    )}>
                      {translateStatus(unit.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-black text-slate-900 text-base">{format(unit.monthlyRent, unit.currency)}</TableCell>
                  <TableCell className="pl-8 text-left">
                    <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors" onClick={() => handleDelete(unit.id)}>
                      <Trash2 className="w-4.5 h-4.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[600px] border-none shadow-2xl bg-white rounded-[32px] overflow-hidden p-0" dir="rtl">
          <form onSubmit={handleCreate}>
            <div className="p-8 space-y-6">
              <DialogHeader className="text-right">
                <DialogTitle className="text-3xl font-black text-slate-900 leading-tight">إضافة وحدة جديدة</DialogTitle>
                <DialogDescription className="text-slate-700 font-bold">تحديد تفاصيل الوحدة لربطها بالمنظومة العقارية</DialogDescription>
              </DialogHeader>

              <div className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold px-1">العقار التابع له</Label>
                  <Select value={form.propertyId} onValueChange={v => setForm({ ...form, propertyId: v })}>
                    <SelectTrigger className="h-14 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10 transition-all">
                      <SelectValue placeholder="اختر العقار المستهدف" />
                    </SelectTrigger>
                    <SelectContent dir="rtl" className="bg-white border-slate-100 rounded-xl overflow-hidden shadow-xl">
                      {properties.map((p: any) => (
                        <SelectItem key={p.id} value={p.id} className="font-bold py-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-600" />
                            {p.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold px-1">رقم الوحدة/الاسم</Label>
                    <Input required value={form.unitNumber} onChange={e => setForm({ ...form, unitNumber: e.target.value })} placeholder="مثال: شقة 104" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Label className="text-slate-700 font-bold px-1">نوع الوحدة</Label>
                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                      <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl" className="bg-white border-slate-100 rounded-xl">
                        <SelectItem value="APARTMENT">شقة سكنية</SelectItem>
                        <SelectItem value="SHOP">محل تجاري</SelectItem>
                        <SelectItem value="OFFICE">مكتب إداري</SelectItem>
                        <SelectItem value="VILLA">فيلا ملكية</SelectItem>
                        <SelectItem value="WAREHOUSE">مخزن لوجستي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold px-1">الإيجار الشهري</Label>
                    <div className="relative">
                       <Input required type="number" value={form.monthlyRent} onChange={e => setForm({ ...form, monthlyRent: e.target.value })} className="h-12 bg-slate-50/50 border-slate-100 rounded-xl pl-14 font-black text-lg focus:ring-indigo-500/10" />
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] bg-white px-2 py-0.5 rounded-lg border text-indigo-600 font-black uppercase tracking-widest">{form.currency}</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Label className="text-slate-700 font-bold px-1">الطابق</Label>
                    <Input type="number" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} placeholder="الطابق" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold text-center focus:ring-indigo-500/10" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <Label className="text-[10px] text-slate-600 font-black mb-1 block">المساحة</Label>
                      <input type="number" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="w-full bg-transparent border-none focus:outline-none font-bold text-slate-700" placeholder="م²" />
                   </div>
                   <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <Label className="text-[10px] text-slate-600 font-black mb-1 block">الغرف</Label>
                      <input type="number" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} className="w-full bg-transparent border-none focus:outline-none font-bold text-slate-700" />
                   </div>
                   <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <Label className="text-[10px] text-slate-600 font-black mb-1 block">الحمامات</Label>
                      <input type="number" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} className="w-full bg-transparent border-none focus:outline-none font-bold text-slate-700" />
                   </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex gap-4 mt-4">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">إلغاء</Button>
              <Button type="submit" disabled={saving} className="flex-1 h-12 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-black shadow-lg shadow-indigo-600/20">
                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                إنشاء الوحدة
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
