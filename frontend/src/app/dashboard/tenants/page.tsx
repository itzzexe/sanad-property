"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { Plus, Search, Users, Loader2, Trash2, Mail, Phone, MapPin, UserCheck } from "lucide-react";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", idType: "بطاقة وطنية", idNumber: "", nationality: "عراقي", address: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [search]);

  async function load() {
    try {
      const res = await api.get(`/tenants?search=${search}&limit=50`);
      setTenants(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/tenants", form);
      setShowCreate(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", idType: "بطاقة وطنية", idNumber: "", nationality: "عراقي", address: "" });
      load();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المستأجر؟")) return;
    try { await api.delete(`/tenants/${id}`); load(); }
    catch (err: any) { alert(err.message); }
  }

  return (
    <div className="space-y-10 page-enter p-2 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2 leading-tight">
            سجل <span className="text-gradient-indigo">المستأجرين</span>
          </h1>
          <p className="text-slate-700 text-lg font-medium flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            إدارة بيانات المستأجرين والتوثيق القانوني المركزي
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold h-14 px-8 rounded-2xl shadow-lg shadow-indigo-600/20 gap-3 border-none hover:scale-105 transition-all">
          <Plus className="w-5 h-5" /> تسجيل مستأجر جديد
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-end">
        <div className="relative flex-1 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            placeholder="بحث عن مستأجر بالاسم، البريد، أو رقم الهاتف..." 
            className="w-full pr-12 h-14 bg-white border border-slate-100 shadow-premium rounded-2xl text-lg font-bold placeholder:text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          <p className="font-bold text-slate-600 animate-pulse">جاري جلب قائمة المستأجرين...</p>
        </div>
      ) : tenants.length === 0 ? (
        <Card className="py-24 text-center border-none shadow-premium bg-white rounded-[40px]">
          <Users className="w-20 h-20 mx-auto text-slate-600 mb-6" />
          <h3 className="text-2xl font-black text-slate-900">لا توجد بيانات حالياً</h3>
          <p className="text-slate-600 mt-2 font-medium">ابدأ بتوثيق المستأجر الأول لبدء التنظيم القانوني.</p>
        </Card>
      ) : (
        <Card className="border-none shadow-premium bg-white rounded-[32px] overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-right py-6 text-slate-900 font-black">المستأجر</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black">الاتصال</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black">التوثيق</TableHead>
                <TableHead className="text-right py-6 text-slate-900 font-black text-center">العقود</TableHead>
                <TableHead className="text-left py-6 text-slate-900 font-black pl-8">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant: any) => (
                <TableRow key={tenant.id} className="hover:bg-slate-50/40 transition-colors border-slate-50 group">
                  <TableCell className="py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg font-black group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        {tenant.firstName[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-base group-hover:text-indigo-600 transition-colors">{tenant.firstName} {tenant.lastName}</p>
                        <p className="text-xs text-slate-600 font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {tenant.address || "العنوان غير متوفر"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 font-bold">
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" /> {tenant.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-700 font-mono">
                        <Phone className="w-3.5 h-3.5 text-indigo-400" /> {tenant.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {tenant.idType ? (
                       <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 inline-flex flex-col items-start gap-1">
                         <span className="text-[9px] text-slate-600 font-black uppercase">{tenant.idType}</span>
                         <span className="font-mono font-black text-slate-900 text-xs">{tenant.idNumber}</span>
                       </div>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                       <UserCheck className="w-4 h-4 text-emerald-500" />
                       <span className="font-black text-slate-900">{tenant.leases?.length || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="pl-8 text-left">
                    <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors" onClick={() => handleDelete(tenant.id)}>
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
        <DialogContent className="sm:max-w-[550px] border-none shadow-2xl bg-white rounded-[32px] overflow-hidden p-0" dir="rtl">
          <form onSubmit={handleCreate}>
            <div className="p-8 space-y-6">
              <DialogHeader className="text-right">
                <DialogTitle className="text-3xl font-black text-slate-900 leading-tight">تسجيل مستأجر</DialogTitle>
                <DialogDescription className="text-slate-700 font-bold">أدخل البيانات الشخصية والقانونية للمستأجر الجديد</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-5 pt-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold px-1">الاسم الأول</Label>
                  <Input required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="أحمد" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold px-1">اسم العائلة</Label>
                  <Input required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="علي" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-bold px-1">البريد الإلكتروني</Label>
                <Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="example@mail.com" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl text-left font-mono font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-bold px-1">رقم الهاتف</Label>
                <Input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="07XXXXXXXXX" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl text-left font-mono font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2 text-right">
                  <Label className="text-slate-700 font-bold px-1">نوع الهوية</Label>
                  <Input value={form.idType} onChange={e => setForm({ ...form, idType: e.target.value })} placeholder="البطاقة الموحدة" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold" />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="text-slate-700 font-bold px-1">رقم الهوية</Label>
                  <Input value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-mono font-bold" />
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex gap-4 mt-4">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-600">إلغاء</Button>
              <Button type="submit" disabled={saving} className="flex-1 h-12 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-black shadow-lg shadow-indigo-600/20">
                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                توثيق البيانات
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
