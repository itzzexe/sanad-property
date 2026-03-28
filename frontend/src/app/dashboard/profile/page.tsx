"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Shield, Camera, Save, MapPin, CheckCircle2, Lock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await api.get("/auth/profile");
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-slate-600 animate-pulse">جاري جلب الملف التعريفي...</p>
    </div>
  );

  return (
    <div className="space-y-10 page-enter p-2 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2 leading-tight">
            ملف <span className="text-gradient-indigo">المستخدم</span>
          </h1>
          <p className="text-slate-700 text-lg font-medium flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            إدارة البيانات الشخصية، تفضيلات الحساب، وإعدادات الأمان المتقدمة
          </p>
        </div>
        <Button className="bg-indigo-600 text-white font-black h-14 px-10 rounded-2xl shadow-lg shadow-indigo-600/20 gap-3 border-none hover:scale-105 transition-all" disabled={updating}>
          {updating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          حفظ التغييرات
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Hero Avatar */}
        <Card className="lg:col-span-1 border-none shadow-premium bg-white rounded-[32px] overflow-hidden group">
          <div className="h-40 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          <CardContent className="relative pt-0 pb-10 text-center px-8">
            <div className="relative -mt-20 mb-6 inline-block">
              <div className="w-40 h-40 rounded-[40px] border-8 border-white bg-slate-50 flex items-center justify-center overflow-hidden shadow-2xl mx-auto transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2">
                <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-5xl font-black">
                   {profile?.firstName?.[0]}
                </div>
              </div>
              <Button size="icon" variant="secondary" className="absolute -bottom-2 -right-2 rounded-2xl w-12 h-12 shadow-xl bg-white border border-slate-100 hover:bg-slate-50 hover:scale-110 transition-all text-indigo-600">
                <Camera className="w-5 h-5" />
              </Button>
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 leading-tight">{profile?.firstName} {profile?.lastName}</h2>
            <div className="flex items-center justify-center gap-2 mt-2 text-slate-600 font-bold text-sm">
               <Mail className="w-4 h-4 text-indigo-400" />
               {profile?.email}
            </div>
            
            <Badge className="mt-6 px-6 py-2 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white rounded-xl border-none shadow-lg shadow-slate-900/10">
              {profile?.role === 'ADMIN' ? 'مدير نظام عالي الصلاحية' : profile?.role === 'OWNER' ? 'مالك الصروح العقارية' : 'محاسب مالي'}
            </Badge>

            <div className="mt-10 pt-8 border-t border-slate-50 grid grid-cols-2 gap-8 text-sm">
              <div className="text-right">
                <p className="text-slate-600 text-[10px] uppercase font-black tracking-widest leading-none">رقم الهاتف</p>
                <p className="font-black text-slate-900 mt-2 font-mono">{profile?.phone || "07XXXXXXXX"}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-600 text-[10px] uppercase font-black tracking-widest leading-none">موقع العمل</p>
                <p className="font-black text-slate-900 mt-2 flex items-center gap-1 justify-end">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  بغداد، العراق
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Comprehensive Forms */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-premium bg-white rounded-[32px] overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900">المعلومات الشخصية</CardTitle>
                  <CardDescription className="font-medium text-slate-600 mt-1">تحديث بيانات الهوية والاتصال المسجلة في النظام</CardDescription>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold px-1">الاسم الأول</Label>
                  <Input defaultValue={profile?.firstName} className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10 transition-all text-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold px-1">اسم العائلة</Label>
                  <Input defaultValue={profile?.lastName} className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10 transition-all text-slate-700" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                <div className="space-y-2 text-right">
                  <Label className="text-slate-700 font-bold px-1 flex items-center gap-2 justify-end">البريد الإلكتروني <Shield className="w-3 h-3 text-indigo-400" /></Label>
                  <Input defaultValue={profile?.email} className="h-12 bg-slate-100/50 border-slate-100 rounded-xl text-left font-mono font-bold text-slate-600 cursor-not-allowed" disabled dir="ltr" />
                  <p className="text-[10px] text-slate-600 font-bold mt-1 pr-1">لا يمكن تعديل البريد الإلكتروني لدواعي أمنية وتقنية</p>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="text-slate-700 font-bold px-1">رقم الهاتف الفعال</Label>
                  <Input defaultValue={profile?.phone} className="h-12 bg-slate-50/50 border-slate-100 rounded-xl text-left font-mono font-bold text-slate-700 focus:ring-indigo-500/10" dir="ltr" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-premium bg-white rounded-[32px] overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900">الأمان والوصول</CardTitle>
                  <CardDescription className="font-medium text-slate-600 mt-1">تغيير كلمة المرور وتوثيق مستوى حماية الحساب</CardDescription>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-rose-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold px-1">كلمة المرور الحالية</Label>
                  <Input type="password" placeholder="••••••••" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl text-left font-mono" dir="ltr" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold px-1">كلمة المرور الجديدة</Label>
                    <Input type="password" placeholder="••••••••" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl text-left font-mono" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold px-1">تأكيد كلمة المرور</Label>
                    <Input type="password" placeholder="••••••••" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl text-left font-mono" dir="ltr" />
                  </div>
                </div>
              </div>
              <div className="pt-6">
                <Button variant="outline" className="border-rose-100 text-rose-600 font-black h-12 px-8 rounded-xl hover:bg-rose-50 hover:text-rose-700 transition-all">
                  تحديث كلمة المرور
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
