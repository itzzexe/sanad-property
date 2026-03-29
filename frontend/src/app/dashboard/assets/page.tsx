"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Search, FileBadge, TrendingDown, Clock, 
  History as HistoryIcon, Calendar, Info, Loader2, DollarSign,
  Building2, Trash2, ShieldCheck, FileText, ArrowDown, Paperclip
} from "lucide-react";
import { AttachmentManager } from "@/components/shared/attachment-manager";
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

export default function AssetsPage() {
  const { format } = useCurrency();
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProp, setSelectedProp] = useState("");
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [showAttachments, setShowAttachments] = useState(false);
  
  const [newAsset, setNewAsset] = useState({
    name: "",
    value: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    depreciationRate: 10,
    usefulLifeYears: 10,
    description: ""
  });

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    const res = await api.get("/properties");
    const pData = res.data || res || [];
    setProperties(pData);
    if (pData.length > 0) setSelectedProp(pData[0].id);
  }

  useEffect(() => {
    if (selectedProp) loadAssets();
  }, [selectedProp]);

  async function loadAssets() {
    setLoading(true);
    try {
      const res = await api.get(`/financial/properties/${selectedProp}/assets`);
      setAssets(res || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/financial/assets", { ...newAsset, propertyId: selectedProp });
      setIsAddOpen(false);
      loadAssets();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  const stats = {
     totalValue: assets.reduce((acc, curr) => acc + curr.value, 0),
     bookValue: assets.reduce((acc, curr) => acc + (curr.bookValue || 0), 0),
     totalDep: assets.reduce((acc, curr) => acc + (curr.accumulatedDepreciation || 0), 0)
  };

  return (
    <div className="space-y-8 page-enter p-2 md:p-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#242424] mb-1">الأصول و<span className="text-[#6264A7]">الإهلاك</span></h1>
          <p className="text-[#222222] text-sm font-semibold flex items-center gap-2 italic">
            <FileBadge className="w-4 h-4 text-[#6264A7]" />
            تتبع قيمة الأصول المادية وحساب الإهلاك السنوي لتعظيم الكفاءة المحاسبية
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <Select value={selectedProp} onValueChange={setSelectedProp}>
             <SelectTrigger className="w-64 bg-white border-[#D1D1D1] h-11 font-bold">
               <SelectValue />
             </SelectTrigger>
             <SelectContent className="bg-white" dir="rtl">
                {properties.map(p => (
                  <SelectItem key={p.id} value={p.id} className="font-bold">{p.name}</SelectItem>
                ))}
             </SelectContent>
           </Select>
           <Button onClick={() => setIsAddOpen(true)} className="bg-[#6264A7] hover:bg-[#464775] text-white font-bold h-11 px-6 rounded-md shadow-sm gap-2">
              <Plus className="w-4 h-4" />
              إضافة أصل جديد
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-[#D1D1D1] shadow-sm flex items-center gap-5 transition-all hover:border-[#6264A7]/30">
           <div className="w-12 h-12 rounded-lg bg-[#EBEBEB] flex items-center justify-center text-[#222222]">
              <FileBadge className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] text-[#222222] font-black uppercase tracking-widest leading-none mb-2">القيمة الشرائية الكلية</p>
              <p className="text-2xl font-black text-[#242424]">{format(stats.totalValue)}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D1D1D1] shadow-sm flex items-center gap-5 transition-all hover:border-emerald-300">
           <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] text-[#222222] font-black uppercase tracking-widest leading-none mb-2">صافي القيمة الدفترية</p>
              <p className="text-2xl font-black text-emerald-600">{format(stats.bookValue)}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D1D1D1] shadow-sm flex items-center gap-5 transition-all hover:border-amber-300">
           <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <TrendingDown className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] text-[#222222] font-black uppercase tracking-widest leading-none mb-2">إجمالي الإهلاك المتراكم</p>
              <p className="text-2xl font-black text-amber-600">-{format(stats.totalDep)}</p>
           </div>
        </div>
      </div>

      <Card className="bg-white border border-[#D1D1D1] shadow-sm rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-[#F0F0F0]/50 border-b border-[#D1D1D1]">
            <TableRow className="hover:bg-transparent border-[#D1D1D1]">
              <TableHead className="py-4 text-[#242424] font-black text-right">الأصل / المعدة</TableHead>
              <TableHead className="py-4 text-[#242424] font-black text-center">التاريخ</TableHead>
              <TableHead className="py-4 text-[#242424] font-black text-center">الإهلاك (%)</TableHead>
              <TableHead className="py-4 text-[#242424] font-black text-right">القيمة الأصلية</TableHead>
              <TableHead className="py-4 text-[#242424] font-black text-right">القيمة الحالية (صافية)</TableHead>
              <TableHead className="py-4 text-[#242424] font-black text-right pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-16 animate-pulse bg-slate-50/50" />
                </TableRow>
              ))
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-slate-600 font-bold italic">لا توجد أصول مسجلة لهذا العقار</TableCell>
              </TableRow>
            ) : (
              assets.map(asset => (
                <TableRow key={asset.id} className="hover:bg-slate-50 text-slate-900 font-bold transition-colors group">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-[#EBEBEB] text-[#222222] flex items-center justify-center font-black group-hover:bg-[#6264A7] group-hover:text-white transition-all">
                          <Building2 className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="font-bold text-[#242424]">{asset.name}</p>
                          <p className="text-[10px] text-slate-600 font-bold">{asset.description || "أصل عقاري ثابت"}</p>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-xs text-slate-600">
                     {new Date(asset.purchaseDate).toLocaleDateString('ar-IQ')}
                  </TableCell>
                  <TableCell className="text-center">
                     <Badge className="bg-amber-50 text-amber-600 border border-amber-200 shadow-none font-black px-3 py-1 rounded-sm">
                        {asset.depreciationRate}% سنوي
                     </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-slate-800">
                     {format(asset.value)}
                  </TableCell>
                  <TableCell className="font-black text-emerald-600">
                     {format(asset.bookValue)}
                     <div className="text-[9px] text-slate-600 font-bold mt-1 tracking-tighter">
                        إهلاك: -{format(asset.accumulatedDepreciation)}
                     </div>
                  </TableCell>
                  <TableCell className="text-left pr-6">
                     <Button variant="ghost" size="icon" onClick={() => {
                          setSelectedAsset(asset);
                          setShowAttachments(true);
                        }} className="h-9 w-9 text-slate-600 hover:text-[#6264A7] transition-all opacity-0 group-hover:opacity-100">
                        <Paperclip className="w-4 h-4" />
                     </Button>
                     <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                     </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Asset Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
         <DialogContent className="sm:max-w-md bg-white rounded-xl shadow-2xl p-0 overflow-hidden" dir="rtl">
            <form onSubmit={handleAdd}>
               <div className="p-8 space-y-6">
                  <DialogHeader className="text-right">
                     <DialogTitle className="text-2xl font-black text-[#242424]">إدراج أصل مادي</DialogTitle>
                     <DialogDescription className="font-bold text-[#222222]">توثيق الممتلكات والمعدات العقارية ضمن النظام المحاسبي</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                     <div className="space-y-2 text-right">
                        <Label className="font-bold">اسم الأصل / المعدة</Label>
                        <Input required value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} placeholder="مثال: مصاعد الطابق الأول" className="h-11 bg-slate-50 text-slate-900 font-bold rounded-md" />
                     </div>
                     <div className="grid grid-cols-2 gap-4 text-right">
                        <div className="space-y-2">
                           <Label className="font-bold">القيمة الشرائية الأصلية</Label>
                           <Input type="number" required value={newAsset.value} onChange={e => setNewAsset({...newAsset, value: parseFloat(e.target.value)})} className="h-11 bg-slate-50 text-slate-900 font-bold text-left font-black" dir="ltr" />
                        </div>
                        <div className="space-y-2">
                           <Label className="font-bold">تاريخ الشراء / التركيب</Label>
                           <Input type="date" value={newAsset.purchaseDate} onChange={e => setNewAsset({...newAsset, purchaseDate: e.target.value})} className="h-11 bg-slate-50 text-slate-900 font-bold" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 text-right">
                        <div className="space-y-2">
                           <Label className="font-bold">معدل الإهلاك (%)</Label>
                           <Input type="number" step="0.1" required value={newAsset.depreciationRate} onChange={e => setNewAsset({...newAsset, depreciationRate: parseFloat(e.target.value)})} className="h-11 bg-slate-50 text-slate-900 font-bold text-left font-black" dir="ltr" />
                        </div>
                        <div className="space-y-2">
                           <Label className="font-bold">العمر الإنتاجي (سنوات)</Label>
                           <Input type="number" required value={newAsset.usefulLifeYears} onChange={e => setNewAsset({...newAsset, usefulLifeYears: parseInt(e.target.value)})} className="h-11 bg-slate-50 text-slate-900 font-bold text-left font-bold" dir="ltr" />
                        </div>
                     </div>
                  </div>
               </div>
               <DialogFooter className="p-8 bg-[#F0F0F0] border-t border-[#D1D1D1] flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="flex-1 font-bold">إلغاء</Button>
                  <Button type="submit" disabled={saving} className="flex-1 bg-[#6264A7] text-white hover:bg-[#464775] h-11 font-black">
                     {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "إدراج الأصل"}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* Attachments Dialog */}
      <Dialog open={showAttachments} onOpenChange={setShowAttachments}>
        <DialogContent className="sm:max-w-[700px] border-none shadow-2xl bg-white rounded-xl p-8" dir="rtl">
          <div className="h-1 bg-[#6264A7] absolute top-0 left-0 right-0" />
          <DialogHeader className="text-right mb-4">
            <DialogTitle className="text-2xl font-black text-[#242424] leading-tight flex items-center gap-3">
              <Paperclip className="w-6 h-6 text-[#6264A7]" />
              مرفقات الأصل: {selectedAsset?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAsset && (
            <AttachmentManager 
              entityType="ASSET" 
              entityId={selectedAsset.id} 
              title="وثائق الملكية والصور"
            />
          )}

          <div className="mt-8 flex justify-end">
            <Button 
              type="button"
              onClick={() => setShowAttachments(false)} 
              className="bg-slate-100 text-slate-900 hover:bg-slate-200 font-bold px-8 rounded-md"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
