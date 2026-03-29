"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { Plus, Search, Building2, MapPin, Loader2, Edit, Trash2, Eye, ChevronRight, LayoutGrid, Paperclip, FileText, Upload, Map, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttachmentManager } from "@/components/shared/attachment-manager";
import { useRef } from "react";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "بغداد", state: "", country: "العراق", zipCode: "", description: "", mapUrl: "" });
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState<any>({});
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post("/properties/import", formData);
      alert(`تم استيراد ${res.successCount || 0} سجل بنجاح.\n\n${res.errorsCount > 0 ? `أخطاء (${res.errorsCount}):\n` + res.errors.join('\n') : ''}`);
      load();
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء رفع الملف");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  useEffect(() => { load(); }, [search]);

  async function load() {
    try {
      const res = await api.get(`/properties?search=${search}&include=units&limit=20`);
      setProperties(res.data || []);
      setMeta(res.meta || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/properties", form);
      setShowCreate(false);
      setForm({ name: "", address: "", city: "بغداد", state: "", country: "العراق", zipCode: "", description: "", mapUrl: "" });
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا العقار؟")) return;
    try {
      await api.delete(`/properties/${id}`);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function exportPropertyReport(property: any) {
    alert("جاري تحضير ملف تقرير العقار (PDF)... سيظهر في التنزيلات قريباً.");
  }

  return (
    <div className="space-y-10 page-enter p-2 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2 leading-tight">
            المحفظة <span className="text-gradient-indigo">العقارية</span>
          </h1>
          <p className="text-slate-700 text-lg font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            إدارة كافة الأصول العقارية المركزية بذكاء وكفاءة
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImport} />
          <Button disabled={importing} onClick={() => fileInputRef.current?.click()} variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold h-14 px-6 rounded-2xl gap-2 transition-all">
            {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />} رفع إكسل
          </Button>
          <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold h-14 px-8 rounded-2xl shadow-lg shadow-indigo-600/20 gap-3 border-none hover:scale-105 transition-all">
            <Plus className="w-5 h-5" /> إضافة عقار جديد
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-end">
        <div className="relative flex-1 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
          <Input 
            placeholder="بحث عن عقار بالاسم أو العنوان..." 
            className="pr-12 h-14 bg-white border-slate-100 shadow-premium rounded-2xl text-lg font-bold placeholder:text-slate-600 focus:ring-indigo-500/10 focus:border-indigo-500/30" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-premium flex flex-col justify-center min-w-[140px]">
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">إجمالي العقارات</span>
              <span className="text-2xl font-black text-slate-900">{meta.total || properties.length}</span>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          <p className="font-bold text-slate-600 animate-pulse">جاري جلب المحفظة العقارية...</p>
        </div>
      ) : properties.length === 0 ? (
        <Card className="py-24 text-center border-none shadow-premium bg-white rounded-[40px]">
          <Building2 className="w-20 h-20 mx-auto text-slate-600 mb-6" />
          <h3 className="text-2xl font-black text-slate-900">المحفظة خالية حالياً</h3>
          <p className="text-slate-600 mt-2 max-w-sm mx-auto font-medium">ابدأ بتوثيق عقاراتك لبناء نظام إدارة متكامل ومحترف.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property: any) => (
            <Card key={property.id} className="group relative overflow-hidden transition-all duration-500 hover:-translate-y-2 border-none bg-white shadow-premium rounded-[32px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-8 relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-500 shadow-sm">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors" onClick={() => handleDelete(property.id)}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{property.name}</h3>
                   <p className="text-slate-700 font-bold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    {property.address}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 my-8 p-4 rounded-3xl bg-slate-50/50 border border-slate-100/50">
                   <div className="text-right">
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">الوحدات</p>
                      <p className="text-lg font-black text-slate-900">{property._count?.units || 0}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">الشركاء</p>
                      <p className="text-lg font-black text-slate-900">{property._count?.shareholders || 0}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">الحالة</p>
                      <Badge className="bg-emerald-50 text-emerald-600 border-none shadow-none font-black text-[9px] rounded-lg p-0 h-auto">نشط</Badge>
                   </div>
                </div>

                <Button 
                   onClick={() => {
                     setSelectedProperty(property);
                     setShowPropertyDetails(true);
                   }}
                   className="w-full h-12 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-bold rounded-xl gap-2 transition-all border-none shadow-sm"
                >
                  عرض التفاصيل
                  <ChevronRight className="w-4 h-4" />
                </Button>

                <Button 
                  variant="outline"
                  className="w-full h-11 border-slate-200 text-slate-600 font-bold rounded-xl gap-2 mt-3 hover:bg-slate-50 transition-all shadow-sm"
                  onClick={() => {
                    setSelectedProperty(property);
                    setShowAttachments(true);
                  }}
                >
                  <Paperclip className="w-4 h-4 text-indigo-500" />
                  المرفقات (صور/PDF)
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[550px] border-none shadow-2xl bg-white rounded-[32px] overflow-hidden p-0" dir="rtl">
          <form onSubmit={handleCreate}>
            <div className="p-8 space-y-6">
              <DialogHeader className="text-right">
                <DialogTitle className="text-3xl font-black text-slate-900 leading-tight">إضافة صرح جديد</DialogTitle>
                <DialogDescription className="text-slate-700 font-bold">أدخل المعلومات الأساسية للعقار الجديد لتوثيقه في النظام</DialogDescription>
              </DialogHeader>

              <div className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold px-1">اسم العقار</Label>
                  <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: مجمع الياقوت السكني" className="h-14 bg-slate-50/50 border-slate-100 rounded-2xl font-bold text-lg focus:ring-indigo-500/10 focus:border-indigo-500/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold px-1">العنوان بالتفصيل</Label>
                  <Input required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="المدينة، المنطقة، الشارع" className="h-14 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-indigo-500/10 focus:border-indigo-500/30 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-right">
                    <Label className="text-slate-700 font-bold px-1">المدينة</Label>
                    <Input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="بغداد" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Label className="text-slate-700 font-bold px-1">نوع العقار</Label>
                    <Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="سكني / تجاري" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold px-1 flex items-center gap-2">
                    <Map className="w-4 h-4 text-indigo-500" /> رابط Google Maps
                  </Label>
                  <Input value={form.mapUrl} onChange={e => setForm({ ...form, mapUrl: e.target.value })} placeholder="https://maps.app.goo.gl/..." className="h-14 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-indigo-500/10 focus:border-indigo-500/30 font-bold" />
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex gap-4">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">إلغاء</Button>
              <Button type="submit" disabled={saving} className="flex-1 h-12 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-black shadow-lg shadow-indigo-600/20 transition-all">
                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                اعتماد العقار
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPropertyDetails} onOpenChange={setShowPropertyDetails}>
        <DialogContent className="sm:max-w-[700px] border-none shadow-2xl bg-white rounded-[32px] overflow-hidden p-0" dir="rtl">
           <div className="p-8 space-y-8">
              <DialogHeader className="text-right">
                <div className="flex items-center gap-4 mb-2">
                   <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                     <Building2 className="w-8 h-8" />
                   </div>
                   <div>
                     <DialogTitle className="text-3xl font-black text-slate-900 leading-tight">{selectedProperty?.name}</DialogTitle>
                     <DialogDescription className="text-indigo-600 font-black flex items-center gap-1 mt-1">
                       <MapPin className="w-4 h-4" /> {selectedProperty?.address}, {selectedProperty?.city}
                     </DialogDescription>
                   </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-600 font-black uppercase mb-1">إجمالي الوحدات</p>
                    <p className="text-xl font-black text-slate-900">{selectedProperty?._count?.units || 0}</p>
                 </div>
                 <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-600 font-black uppercase mb-1">الحالة التشغيلية</p>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-xs">نشط</Badge>
                 </div>
                 <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-600 font-black uppercase mb-1">المنطقة</p>
                    <p className="text-xl font-black text-slate-900">{selectedProperty?.city}</p>
                 </div>
                 <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-600 font-black uppercase mb-1">تاريخ التسجيل</p>
                    <p className="text-xs font-black text-slate-900">{selectedProperty?.createdAt ? new Date(selectedProperty.createdAt).toLocaleDateString('ar-IQ') : '—'}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                   <Users className="w-5 h-5 text-indigo-600" />
                   الشركاء والمالكين (توزيع النسب)
                 </h4>
                 <div className="max-h-[200px] overflow-y-auto rounded-3xl border border-slate-50 bg-slate-50/30 p-2 custom-scrollbar">
                    {selectedProperty?.shareholders?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedProperty.shareholders.map((sh: any) => (
                          <div key={sh.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-indigo-200">
                             <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{sh.name}</span>
                                <span className="text-[10px] text-slate-500">{sh.phone || 'بدون هاتف'}</span>
                             </div>
                             <Badge className="bg-indigo-600 text-white font-black rounded-lg">%{sh.sharePercent}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-500 font-bold italic">لا يوجد شركاء مسجلين لهذا العقار.</div>
                    )}
                 </div>
                 
                 <div className="flex gap-4 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex-1 space-y-1">
                       <Label className="text-[10px] font-black mr-1">اسم الشريك</Label>
                       <Input id="newShName" placeholder="الاسم الكامل" className="h-10 text-sm font-bold bg-white" />
                    </div>
                    <div className="w-24 space-y-1">
                       <Label className="text-[10px] font-black mr-1">النسبة %</Label>
                       <Input id="newShPercent" type="number" placeholder="25" className="h-10 text-sm font-bold bg-white" />
                    </div>
                    <Button 
                      onClick={async () => {
                        const name = (document.getElementById('newShName') as HTMLInputElement).value;
                        const percent = parseFloat((document.getElementById('newShPercent') as HTMLInputElement).value);
                        if (!name || isNaN(percent)) return alert("يرجى إكمال البيانات");
                        try {
                          await api.post(`/financial/shareholders`, { name, sharePercent: percent, propertyId: selectedProperty.id });
                          // Refresh data
                          const res = await api.get(`/properties/${selectedProperty.id}`);
                          setSelectedProperty(res);
                          (document.getElementById('newShName') as HTMLInputElement).value = '';
                          (document.getElementById('newShPercent') as HTMLInputElement).value = '';
                        } catch (err: any) { alert(err.message); }
                      }}
                      className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg px-4"
                    >
                      إضافة
                    </Button>
                 </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                   <LayoutGrid className="w-5 h-5 text-indigo-600" />
                   قائمة الوحدات المرتبطة
                 </h4>
                 <div className="max-h-[250px] overflow-y-auto rounded-3xl border border-slate-50 bg-slate-50/30 p-2 custom-scrollbar">
                    {selectedProperty?.units?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedProperty.units.map((unit: any) => (
                           <div key={unit.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 font-black text-sm">{unit.unitNumber}</div>
                                <div>
                                   <p className="font-bold text-slate-900">{unit.unitNumber}</p>
                                   <p className="text-[10px] text-slate-600 font-bold uppercase">{unit.type}</p>
                                </div>
                              </div>
                              <Badge className={cn(
                                "font-black text-[10px]",
                                unit.status === 'AVAILABLE' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                              )}>{unit.status}</Badge>
                           </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-500 font-bold italic">لا توجد وحدات مضافة بعد لهذا العقار.</div>
                    )}
                 </div>
              </div>
           </div>
           
            <div className="p-8 bg-slate-50 flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex gap-4">
               <Button variant="ghost" onClick={() => setShowPropertyDetails(false)} className="flex-1 h-12 items-center rounded-xl font-bold text-slate-600 transition-all hover:bg-slate-200">إغلاق</Button>
               {selectedProperty?.mapUrl && (
                  <Button asChild className="flex-1 h-12 bg-emerald-600 text-white hover:bg-emerald-700 items-center justify-center rounded-xl font-black gap-2 shadow-lg shadow-emerald-600/20 transition-all">
                    <a href={selectedProperty.mapUrl} target="_blank" rel="noopener noreferrer">
                      <Map className="w-5 h-5" /> موقع العقار
                    </a>
                  </Button>
               )}
              </div>
              <Button onClick={() => exportPropertyReport(selectedProperty)} className="flex-1 h-12 bg-indigo-600 text-white hover:bg-indigo-700 items-center justify-center rounded-xl font-black gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                <FileText className="w-5 h-5" /> استخراج تقرير العقار
              </Button>
            </div>
         </DialogContent>
       </Dialog>

      <Dialog open={showAttachments} onOpenChange={setShowAttachments}>
        <DialogContent className="sm:max-w-[700px] border-none shadow-2xl bg-white rounded-[32px] p-8" dir="rtl">
          <DialogHeader className="text-right mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 leading-tight flex items-center gap-3">
              <Paperclip className="w-6 h-6 text-indigo-600" />
              مرفقات: {selectedProperty?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProperty && (
            <AttachmentManager 
              entityType="PROPERTY" 
              entityId={selectedProperty.id} 
              title="وثائق العقار وصوره"
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
