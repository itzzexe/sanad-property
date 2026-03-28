"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Building2, Eye, EyeOff, Loader2, ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-screen flex items-center justify-center bg-[#001f3f] relative overflow-hidden font-['Cairo']" dir="rtl">
      {/* Premium Background Aura */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-md relative z-10 p-4 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-3xl bg-primary/10 border border-primary/20 mb-4 shadow-2xl shadow-primary/10">
            <Building2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">سند للعقارات</h1>
          <p className="text-blue-100/60 text-sm">نظام الإدارة المتطور للعقارات والتحصيل</p>
        </div>

        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-900/40 backdrop-blur-xl border-white/5 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-white text-center">دخول النظام</CardTitle>
            <CardDescription className="text-center text-slate-700">أدخل بياناتك للمتابعة</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-shake text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-600 mr-1">اسم المستخدم / البريد</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="البريد الإلكتروني للهوية"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50 transition-all text-left"
                    dir="ltr"
                  />
                  <ShieldCheck className="absolute left-3 top-3.5 w-5 h-5 text-slate-600" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="password" className="text-slate-600 mr-1">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="رمز الدخول الخاص بك"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50 transition-all pl-12 text-left"
                    dir="ltr"
                  />
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-600" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-10 top-3.5 text-slate-600 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/20 rounded-xl transition-all active:scale-95" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>جاري التحقق...</span>
                  </div>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>

              <div className="pt-4 text-center">
                <p className="text-[10px] text-slate-800 uppercase tracking-widest">Sanad Property Management v2.0</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
