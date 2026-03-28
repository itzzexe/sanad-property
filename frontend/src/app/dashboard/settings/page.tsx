"use client";

import { useState, useEffect } from "react";
import { 
  Settings, Globe, Coins, Building, Save, 
  Info, Bell, Shield, Languages, DollarSign,
  Palette, Database, ChevronRight, CheckCircle2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await api.get("/settings");
      setSettings(res);
    } catch (err) {
      console.error(err);
      setSettings({
        organizationName: "سند للعقارات",
        defaultCurrency: "IQD",
        exchangeRateUSD: 1460.0,
        language: "ar",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setSaving(true);
      const res = await api.post("/uploads?folder=logo", formData);
      const logoUrl = res.url.startsWith('http') ? res.url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}${res.url}`;
      
      setSettings({...settings, logo: logoUrl});
      
      // Save only the allowed fields to avoid 400 Bad Request
      const payload = {
         organizationName: settings?.organizationName || "سند للعقارات",
         address: settings?.address || "بغداد - المنصور",
         defaultCurrency: settings?.defaultCurrency || "IQD",
         exchangeRateUSD: Number(settings?.exchangeRateUSD) || 1460.0,
         language: settings?.language || "ar",
         logo: logoUrl
      };
      
      await api.put("/settings", payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("فشل رفع الشعار");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
       const payload = {
         organizationName: settings?.organizationName || "سند للعقارات",
         address: settings?.address || "بغداد - المنصور",
         defaultCurrency: settings?.defaultCurrency || "IQD",
         exchangeRateUSD: Number(settings?.exchangeRateUSD) || 1460.0,
         language: settings?.language || "ar",
         logo: settings?.logo || null,
       };
       await api.put("/settings", payload);
       setSuccess(true);
       setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("فشل في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-slate-600 animate-pulse">جاري تحضير مركز التكوين التقني...</p>
    </div>
  );

  return (
    <div className="space-y-10 page-enter p-2 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2 leading-tight">
            تكوين <span className="text-gradient-indigo">النظام</span>
          </h1>
          <p className="text-slate-700 text-lg font-medium flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            تخصيص الخصائص الجوهرية، القواعد المالية، والهوية البصرية للمنصة
          </p>
        </div>
        <Button className="bg-indigo-600 text-white font-black h-14 px-10 rounded-2xl shadow-lg shadow-indigo-600/20 gap-3 border-none hover:scale-105 transition-all" onClick={handleSave} disabled={saving}>
          {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>

      {success && (
        <Alert className="bg-emerald-50 border-emerald-100 rounded-2xl animate-in fade-in slide-in-from-top duration-500">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <AlertTitle className="font-black text-emerald-900 pr-2">تم التحديث بنجاح!</AlertTitle>
          <AlertDescription className="text-emerald-700 font-bold pr-2">سيتم تطبيق التعديلات الجديدة على كافة واجهات المستخدم فوراً.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {/* Organization Core Identity */}
          <Card className="border-none shadow-premium bg-white rounded-[32px] overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900">الهوية المؤسسية</CardTitle>
                  <CardDescription className="font-medium text-slate-600 mt-1">المعلومات القانونية والعلامة التجارية للمنظمة</CardDescription>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Building className="w-6 h-6 text-slate-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold px-1">اسم المنظمة الرسمي</Label>
                  <Input value={settings?.organizationName} onChange={(e) => setSettings({...settings, organizationName: e.target.value})} className="h-12 bg-white border-slate-200 rounded-xl font-black text-slate-900 focus:ring-indigo-500/10 transition-all" />
                </div>
                <div className="space-y-2">
                   <Label className="text-slate-700 font-bold px-1">العنوان الفعلي</Label>
                   <Input value={settings?.address} onChange={(e) => setSettings({...settings, address: e.target.value})} placeholder="بغداد - المنصور" className="h-12 bg-white border-slate-200 rounded-xl font-black text-slate-900 focus:ring-indigo-500/10 transition-all" />
                </div>
              </div>
              
              <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col md:flex-row items-center gap-8 bg-slate-50/30 group hover:border-indigo-100 transition-colors">
                <div className="w-24 h-24 rounded-3xl bg-white shadow-premium flex items-center justify-center overflow-hidden border-2 border-slate-50">
                  {settings?.logo ? (
                    <img src={settings.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building className="w-12 h-12 text-indigo-500/20" />
                  )}
                </div>
                <div className="text-center md:text-right flex-1">
                  <h4 className="font-black text-slate-900 text-lg">شعار المنصة</h4>
                  <p className="text-slate-600 text-sm font-medium mt-1">ارفع شعار المجلد الرسمي ليظهر في كافة الوصولات والتقارير المالية.</p>
                  <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  <Button 
                    variant="outline" 
                    className="mt-4 border-slate-200 rounded-xl h-10 px-6 font-bold hover:bg-white hover:text-indigo-600 transition-all"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    تغيير الشعار
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Engine Settings */}
          <Card className="border-none shadow-premium bg-white rounded-[32px] overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
               <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900">المحرك المالي</CardTitle>
                  <CardDescription className="font-medium text-slate-600 mt-1">تحديد القواعد المحاسبية وأسعار التحويل المعتمدة</CardDescription>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 w-full space-y-2">
                  <Label className="text-slate-700 font-bold px-1">العملة الافتراضية</Label>
                  <Select value={settings?.defaultCurrency} onValueChange={(v) => setSettings({...settings, defaultCurrency: v})}>
                    <SelectTrigger className="h-14 bg-slate-50 border-slate-100 rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-100 rounded-xl" dir="rtl">
                      <SelectItem value="IQD" className="font-bold py-3"><div className="flex items-center gap-2">الدينار العراقي <Badge className="bg-slate-100 text-slate-600 border-none font-mono">IQD</Badge></div></SelectItem>
                      <SelectItem value="USD" className="font-bold py-3"><div className="flex items-center gap-2">الدولار الأمريكي <Badge className="bg-indigo-50 text-indigo-600 border-none font-mono">USD</Badge></div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 w-full space-y-2">
                  <Label className="text-slate-700 font-bold px-1">سعر تحويل الدولار المركزي</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] bg-white px-2 py-0.5 rounded-lg border font-black text-emerald-600">IQD</div>
                    <Input 
                      type="number" 
                      className="h-14 bg-white border-slate-200 rounded-xl font-black text-xl text-left pl-14 text-slate-900 focus:ring-emerald-500/10" 
                      value={settings?.exchangeRateUSD}
                      onChange={(e) => setSettings({...settings, exchangeRateUSD: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                <Info className="w-5 h-5 text-amber-600 mt-1 shrink-0" />
                <p className="text-sm text-amber-800 font-bold leading-relaxed">
                  تنبيه محاسبي: تغيير سعر الصرف سيؤثر بشكل مباشر على الحسابات الظاهرية للتقارير، لكن المعاملات المسجلة سابقاً ستحافظ على قيمتها النقدية لضمان سلامة الدفاتر.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           {/* Localization & Preferences */}
           <Card className="border-none shadow-premium bg-white text-slate-900 rounded-[32px] overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
               <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">التخصيص واللغة</CardTitle>
                </div>
                <Globe className="w-6 h-6 text-indigo-500" />
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <div className="space-y-3">
                 <Label className="text-slate-700 font-bold">لغة الواجهة</Label>
                 <Select value={settings?.language} onValueChange={(v) => setSettings({...settings, language: v})}>
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-100 text-slate-900 font-bold rounded-xl focus:ring-indigo-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-100 text-slate-900 rounded-xl" dir="rtl">
                      <SelectItem value="ar" className="font-bold py-3">العربية (الأصلية)</SelectItem>
                      <SelectItem value="en" className="font-bold py-3">English (Global)</SelectItem>
                    </SelectContent>
                 </Select>
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="space-y-0.5 text-right">
                    <p className="font-bold text-slate-900 text-sm">نظام الكتابة (RTL)</p>
                    <p className="text-[10px] text-slate-600 font-bold">تفعيل دعم اليمين لليسار</p>
                 </div>
                 <Switch checked={settings?.language === 'ar'} className="data-[state=checked]:bg-indigo-500" />
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="space-y-0.5 text-right">
                    <p className="font-bold text-slate-900 text-sm">الإشعارات الذكية</p>
                    <p className="text-[10px] text-slate-600 font-bold">تنبيهات النظام في المتصفح</p>
                 </div>
                 <Switch defaultChecked className="data-[state=checked]:bg-indigo-500" />
               </div>
            </CardContent>
            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest leading-none">مظهر النظام</p>
                  <p className="text-slate-900 font-black mt-1">Modern Indigo v2.0</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </Card>

          {/* System Health / Status */}
          <Card className="border-none shadow-premium bg-white rounded-[32px] overflow-hidden border border-slate-100">
            <CardHeader className="p-8">
               <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black text-slate-900">بيئة التشغيل</CardTitle>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
               <div className="flex items-center justify-between text-sm">
                 <span className="font-medium text-slate-600 italic font-mono">API Connection</span>
                 <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">STABLE</Badge>
               </div>
               <div className="flex items-center justify-between text-sm">
                 <span className="font-medium text-slate-600 italic font-mono">Main Database</span>
                 <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold">CONNECTED</Badge>
               </div>
               <div className="flex items-center justify-between text-sm">
                 <span className="font-medium text-slate-600 italic font-mono">System Load</span>
                 <span className="font-black text-slate-900">1.2%</span>
               </div>
               <div className="pt-4 mt-4 border-t border-slate-50">
                  <Button variant="ghost" className="w-full text-rose-500 font-black hover:bg-rose-50 hover:text-rose-600 rounded-xl">
                    إعادة تشغيل المحرك
                  </Button>
               </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
