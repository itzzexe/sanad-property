"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { Building2, Eye, EyeOff, Loader2, ShieldCheck, Lock, ArrowLeft, ArrowRight, CheckCircle2, Globe, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    // Attempt to fetch public settings for branding
    fetch("http://localhost:4000/api/settings")
      .then(res => res.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("user", JSON.stringify(res.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message === "Login failed" ? "خطأ في بيانات الدخول. يرجى التأكد من البريد وكلمة المرور." : err.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white font-['Inter',_sans-serif]" dir="rtl">
      
      {/* Right Side: Visual/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex relative bg-[#6264A7] overflow-hidden items-center justify-center p-12">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-400/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-right space-y-8 max-w-lg">
          <div className="w-20 h-20 bg-white shadow-2xl rounded-[28px] flex items-center justify-center mb-10 rotate-3 hover:rotate-0 transition-transform duration-500">
             {settings?.logo ? (
                <img src={settings.logo} alt="Logo" className="w-14 h-14 object-contain" />
             ) : (
                <Building2 className="w-10 h-10 text-[#6264A7]" />
             )}
          </div>
          
          <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tight">
            نظام <span className="text-indigo-200">سـند</span><br />
            لإدارة العقارات
          </h1>
          
          <p className="text-xl text-indigo-100 font-medium leading-relaxed opacity-90">
            الحل المتكامل للأرشفة القانونية، التحصيل المالي الذكي، ومتابعة المحفظة العقارية بدقة متناهية.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-10">
             <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <ShieldCheck className="w-6 h-6 text-indigo-200 mb-2" />
                <p className="text-white font-bold text-sm">أمان معتمد</p>
                <p className="text-indigo-100/60 text-[10px]">تشفير بيانات بمستوى بنكي</p>
             </div>
             <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <CheckCircle2 className="w-6 h-6 text-indigo-200 mb-2" />
                <p className="text-white font-bold text-sm">تقارير فورية</p>
                <p className="text-indigo-100/60 text-[10px]">ذكاء مالي في متناول يدك</p>
             </div>
          </div>
        </div>
        
        {/* Decorative element */}
        <div className="absolute bottom-10 right-10 text-white/20 font-black text-8xl pointer-events-none select-none">
          SAND
        </div>
      </div>

      {/* Left Side: Login Form */}
      <div className="flex items-center justify-center p-8 lg:p-24 bg-slate-50/50">
        <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-left-4 duration-1000">
          
          <div className="space-y-3">
             <div className="lg:hidden flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#6264A7] rounded-xl flex items-center justify-center text-white">
                  <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-[#6264A7]">سـند للعقارات</h2>
             </div>
             <h2 className="text-4xl font-black text-slate-900 tracking-tight">مرحباً بك مجدداً</h2>
             <p className="text-slate-500 font-bold">يرجى إدخال بيانات الهوية للوصول إلى لوحة التحكم</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-3 animate-in shake duration-300">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-700 font-black text-sm px-1">البريد الإلكتروني</Label>
              <div className="relative group">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="h-14 bg-white border-slate-200 rounded-2xl px-12 text-left font-mono font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-[#6264A7] transition-all"
                  dir="ltr"
                />
                <Globe className="absolute right-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-[#6264A7] transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <Label className="text-slate-700 font-black text-sm">كلمة المرور</Label>
                <button type="button" className="text-[11px] font-black text-[#6264A7] hover:underline">نسيت كلمة المرور؟</button>
              </div>
              <div className="relative group">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-14 bg-white border-slate-200 rounded-2xl px-12 text-left font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-[#6264A7] transition-all"
                  dir="ltr"
                />
                <Lock className="absolute right-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-[#6264A7] transition-colors" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-4 text-slate-400 hover:text-[#6264A7] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 px-1 py-2">
               <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-[#6264A7] focus:ring-[#6264A7]" />
               <label htmlFor="remember" className="text-xs font-bold text-slate-600 cursor-pointer">تذكر بياناتي في هذا المتصفح</label>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-[#6264A7] hover:bg-[#515392] text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                <>
                  تسجيل الدخول
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-10 flex flex-col items-center gap-6 border-t border-slate-100">
             <div className="flex items-center gap-8 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                <Shield className="w-10 h-10" />
                <Globe className="w-10 h-10" />
             </div>
             <p className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">
               Sand Property Management System © {new Date().getFullYear()}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
