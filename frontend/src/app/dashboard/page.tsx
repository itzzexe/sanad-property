"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatDate, getStatusColor, cn } from "@/lib/utils";
import { useCurrency } from "@/context/currency-context";
import {
  Building2, DoorOpen, Users, CreditCard, TrendingUp, AlertTriangle,
  Percent, DollarSign, CalendarClock, Loader2, Coins, Clock, ShieldCheck,
  AlertCircle, ArrowUpRight, ArrowDownRight, Zap, Target, History as HistoryIcon
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function DashboardPage() {
  const { format, convert, displayCurrency, exchangeRate, loading: currencyLoading } = useCurrency();
  const [stats, setStats] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [expiringLeases, setExpiringLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, revenueRes, paymentsRes, leasesRes] = await Promise.allSettled([
        api.get("/dashboard/stats"),
        api.get("/dashboard/revenue-chart"),
        api.get("/dashboard/recent-payments?limit=5"),
        api.get("/dashboard/expiring-leases?days=60"),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (revenueRes.status === 'fulfilled') setRevenueData(revenueRes.value || []);
      if (paymentsRes.status === 'fulfilled') setRecentPayments(paymentsRes.value || []);
      if (leasesRes.status === 'fulfilled') setExpiringLeases(leasesRes.value || []);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || currencyLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-[#6264A7] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#222222] font-bold animate-pulse">جاري جلب بيانات المؤسسة...</p>
      </div>
    );
  }

  const kpis = [
    {
      title: "إجمالي المحصلات",
      value: format(stats?.payments?.revenue || 0),
      icon: CreditCard,
      change: null,
      positive: true,
      sub: "الأرباح التشغيلية"
    },
    {
      title: "الوحدات العقارية",
      value: stats?.units?.total || 0,
      icon: Building2,
      change: null,
      positive: true,
      sub: "المحفظة الاستثمارية"
    },
    {
      title: "معدل الإشغال",
      value: `${stats?.occupancyRate || 0}%`,
      icon: Target,
      change: null,
      positive: (stats?.occupancyRate || 0) > 70,
      sub: "كفاءة التشغيل"
    },
    {
      title: "نفقات وإهلاك",
      value: format((stats?.expenses?.total || 0) + (stats?.assets?.depreciation || 0)),
      icon: TrendingUp,
      change: null,
      positive: false,
      sub: "تكاليف وخصومات"
    },
  ];

  return (
    <div className="space-y-8 page-enter p-2 md:p-1 overflow-x-hidden">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#242424] mb-1">بيانات <span className="text-[#6264A7]">النمو العام</span></h1>
          <p className="text-[#222222] text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#6264A7]" />
            ملخص الأداء المالي والتشغيلي لعام {new Date().getFullYear()}
          </p>
        </div>
        
        <div className="p-3 bg-white border border-[#999999] rounded-md shadow-sm flex items-center gap-4 text-xs font-bold text-[#222222]">
           <CalendarClock className="w-5 h-5 text-[#6264A7]" />
           {new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="bg-white border-[#999999] shadow-sm hover:border-[#6264A7] transition-colors rounded-md group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] group-hover:bg-[#6264A7] group-hover:text-white transition-all flex items-center justify-center text-[#222222]">
                  <kpi.icon className="w-5 h-5" />
                </div>
                {kpi.change && (
                  <Badge variant="outline" className={cn(
                    "font-bold text-[10px] border-none",
                    kpi.positive ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                  )}>
                    {kpi.change}
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-black text-[#242424] leading-tight-none">{kpi.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#222222] mt-1">{kpi.title}</p>
              <div className="h-[1px] w-full bg-[#F5F5F5] my-3" />
              <p className="text-[9px] font-bold text-slate-600">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
          <CardHeader className="bg-[#F0F0F0]/50 border-b border-[#999999] p-6 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black text-[#242424]">تحليل الإيرادات والنمو</CardTitle>
              <CardDescription className="text-xs font-bold text-[#222222]">تتبع التدفقات النقدية والتحصيل الشهري</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6264A7" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6264A7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBEB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#222222', fontSize: 10, fontWeight: '700'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#222222', fontSize: 10, fontWeight: '700'}} dx={-10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #999999", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#6264A7" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
          <CardHeader className="bg-[#F0F0F0]/50 border-b border-[#999999] p-6">
            <CardTitle className="text-lg font-black text-[#242424]">كفاءة الوحدات</CardTitle>
            <CardDescription className="text-xs font-bold text-[#222222]">توزيع الإشغال التشغيلي</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    { name: 'مؤجرة', value: stats?.units?.rented || 0 },
                    { name: 'شاغرة', value: stats?.units?.available || 0 },
                    { name: 'صيانة', value: stats?.units?.maintenance || 0 }
                  ]} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={5}>
                    <Cell fill="#6264A7" stroke="none" />
                    <Cell fill="#999999" stroke="none" />
                    <Cell fill="#f43f5e" stroke="none" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-xl font-black text-[#242424]">{stats?.occupancyRate || 0}%</p>
                 <p className="text-[8px] text-[#222222] font-bold uppercase tracking-widest">إشغال</p>
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-4 text-[10px] font-bold">
               <div className="flex items-center gap-2 text-[#6264A7]"><div className="w-2 h-2 rounded-full bg-[#6264A7]" /> مؤجرة</div>
               <div className="flex items-center gap-2 text-[#222222]"><div className="w-2 h-2 rounded-full bg-[#999999]" /> شاغرة</div>
               <div className="flex items-center gap-2 text-rose-600"><div className="w-2 h-2 rounded-full bg-rose-500" /> صيانة</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
           <CardHeader className="bg-[#F0F0F0]/50 border-b border-[#999999] p-4 flex-row items-center justify-between">
              <CardTitle className="text-sm font-black text-[#242424] flex items-center gap-2 px-2">
                 <HistoryIcon className="w-4 h-4 text-[#6264A7]" />
                 آخر العمليات المالية
              </CardTitle>
              <Button variant="ghost" className="text-[10px] h-8 font-black text-[#6264A7] hover:bg-white px-3">عرض الكل</Button>
           </CardHeader>
           <CardContent className="p-2">
              <div className="space-y-1">
                 {recentPayments.map((p: any) => (
                   <div key={p.id} className="flex items-center justify-between p-3 rounded-md hover:bg-[#F5F5F5] transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                         <div className="w-9 h-9 border border-[#999999] rounded-lg flex items-center justify-center text-[#6264A7] font-black group-hover:bg-white">
                            {p.lease?.tenant?.firstName[0]}
                         </div>
                         <div>
                            <p className="text-xs font-black text-[#242424]">{p.lease?.tenant?.firstName} {p.lease?.tenant?.lastName}</p>
                            <p className="text-[9px] text-[#222222] font-bold">{p.lease?.unit?.property?.name} - {p.lease?.unit?.unitNumber}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black text-[#242424]">{format(p.amount, p.currency)}</p>
                         <p className="text-[9px] text-emerald-600 font-bold uppercase">PAID</p>
                      </div>
                   </div>
                 ))}
              </div>
           </CardContent>
        </Card>

        <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
           <CardHeader className="bg-[#F0F0F0]/50 border-b border-[#999999] p-4">
              <CardTitle className="text-sm font-black text-[#242424] flex items-center gap-2 px-2 uppercase">
                 <ShieldCheck className="w-4 h-4 text-[#6264A7]" />
                 نظام سلامة وتكامل البيانات (System Health)
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#222222]">دقة المعالجة المالية</span>
                    <span className="font-black text-emerald-600">{stats?.payments?.revenue > 0 ? "100.0%" : "0.0%"}</span>
                 </div>
                 <div className="h-1.5 w-full bg-[#F5F5F5] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: stats?.payments?.revenue > 0 ? "100%" : "0%" }} />
                 </div>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#222222]">تغطية عقود الإيجار</span>
                    <span className="font-black text-[#6264A7]">{stats?.occupancyRate || 0}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-[#F5F5F5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#6264A7] transition-all duration-1000" style={{ width: `${stats?.occupancyRate || 0}%` }} />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                 <div className="p-3 bg-[#F5F5F5] rounded-md text-center">
                    <p className="text-[8px] text-[#222222] font-black uppercase tracking-widest leading-none mb-1">Last Audit</p>
                    <p className="text-[10px] font-black font-mono">{new Date().toLocaleDateString('ar-IQ', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                 </div>
                 <div className="p-3 bg-emerald-50 rounded-md text-center border border-emerald-100">
                    <p className="text-[8px] text-emerald-600 font-black uppercase tracking-widest leading-none mb-1">Status</p>
                    <p className="text-[10px] font-black text-emerald-700">{stats?.units?.total > 0 ? "STABLE" : "READY"}</p>
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
