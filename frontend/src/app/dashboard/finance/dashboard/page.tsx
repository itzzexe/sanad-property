"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { financeApi, FinanceDashboardStats } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, Target,
  ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Zap
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FinanceDashboardPage() {
  const [stats, setStats] = useState<FinanceDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await financeApi.getFinanceStats();
      setStats(data);
    } catch (e: any) {
      setError(e.message || "فشل تحميل البيانات المالية");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-[#F0F0F0] rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-white border border-[#999999] rounded-md animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-white border border-[#999999] rounded-md animate-pulse" />
          <div className="h-80 bg-white border border-[#999999] rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-sm font-bold text-[#242424]">{error}</p>
        <Button onClick={load} variant="outline" className="gap-2 font-bold border-[#999999]">
          <RefreshCw className="w-4 h-4" /> إعادة المحاولة
        </Button>
      </div>
    );
  }

  const kpis = [
    {
      title: "الإيرادات الشهرية",
      value: fmt(stats?.revenue.mtd || 0),
      icon: TrendingUp,
      change: stats?.revenue.mtdGrowthPct ? `${stats.revenue.mtdGrowthPct > 0 ? '+' : ''}${stats.revenue.mtdGrowthPct.toFixed(1)}%` : null,
      positive: (stats?.revenue.mtdGrowthPct || 0) >= 0,
      sub: "مقارنة بالشهر السابق"
    },
    {
      title: "صافي الدخل الشهري",
      value: fmt(stats?.netIncome.mtd || 0),
      icon: DollarSign,
      positive: (stats?.netIncome.mtd || 0) >= 0,
      sub: "الإيرادات - المصروفات"
    },
    {
      title: "الوضع النقدي",
      value: fmt(stats?.cashPosition || 0),
      icon: Wallet,
      positive: true,
      sub: "إجمالي النقد المتاح"
    },
    {
      title: "مديونيات المستأجرين",
      value: fmt(stats?.ar.totalOutstanding || 0),
      icon: CreditCard,
      positive: false,
      sub: "حسابات القبض المعلقة"
    },
    {
      title: "مديونيات الموردين",
      value: fmt(stats?.ap.totalOutstanding || 0),
      icon: CreditCard,
      positive: false,
      sub: "حسابات الدفع المعلقة"
    },
    {
      title: "استخدام الميزانية",
      value: stats?.budget ? `${stats.budget.utilizationPct.toFixed(1)}%` : "–",
      icon: Target,
      positive: stats?.budget ? !stats.budget.isOverBudget : true,
      sub: stats?.budget ? "فعلي / مخطط" : "لا توجد ميزانية معتمدة"
    },
  ];

  const arPieData = [
    { name: "حالي", value: stats?.ar.current || 0, color: "#999999" },
    { name: "30-60 يوم", value: stats?.ar.overdue30 || 0, color: "#f59e0b" },
    { name: "61-90 يوم", value: stats?.ar.overdue60 || 0, color: "#f97316" },
    { name: "90+ يوم", value: stats?.ar.overdue90plus || 0, color: "#ef4444" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#242424] mb-1">لوحة <span className="text-[#6264A7]">المالية</span></h1>
          <p className="text-xs font-bold text-[#222222] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#6264A7]" />
            {stats?.currentPeriod.name} — بيانات حتى {new Date().toLocaleDateString('ar-IQ')}
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="kpi-grid">
        {kpis.map((kpi, i) => (
          <Card key={i} className="bg-white border-[#999999] shadow-sm hover:border-[#6264A7] transition-colors rounded-md group" data-testid={`kpi-card-${i}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] group-hover:bg-[#6264A7] group-hover:text-white transition-all flex items-center justify-center text-[#222222]">
                  <kpi.icon className="w-4 h-4" />
                </div>
                {kpi.change && (
                  <Badge variant="outline" className={cn(
                    "font-bold text-[10px] border-none gap-0.5",
                    kpi.positive ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                  )}>
                    {kpi.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {kpi.change}
                  </Badge>
                )}
              </div>
              <p className="text-xl font-black text-[#242424] leading-none font-mono">{kpi.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#222222] mt-1.5">{kpi.title}</p>
              <div className="h-[1px] w-full bg-[#F5F5F5] my-2.5" />
              <p className="text-[9px] font-bold text-slate-500">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2 bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
          <CardHeader className="bg-[#F0F0F0]/50 border-b border-[#999999] p-5 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-black text-[#242424]">اتجاه الإيرادات والمصروفات</CardTitle>
              <CardDescription className="text-[10px] font-bold text-[#222222]">آخر 12 فترة مالية</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.revenueTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBEB" />
                  <XAxis dataKey="periodName" axisLine={false} tickLine={false} tick={{ fill: '#222222', fontSize: 9, fontWeight: '700' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#222222', fontSize: 9, fontWeight: '700' }} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #999", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }} />
                  <Line type="monotone" dataKey="revenue" stroke="#6264A7" strokeWidth={2.5} dot={false} name="إيرادات" />
                  <Line type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} dot={false} name="مصروفات" />
                  <Line type="monotone" dataKey="netIncome" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="صافي" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AR Aging Donut */}
        <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
          <CardHeader className="bg-[#F0F0F0]/50 border-b border-[#999999] p-5">
            <CardTitle className="text-sm font-black text-[#242424]">توزيع أعمار الديون</CardTitle>
            <CardDescription className="text-[10px] font-bold text-[#222222]">حسابات القبض</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={arPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={4}>
                    {arPieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-lg font-black text-[#242424]">{fmt(stats?.ar.totalOutstanding || 0)}</p>
                <p className="text-[8px] text-[#222222] font-bold uppercase tracking-widest">إجمالي</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold">
              {arPieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Properties Table */}
      {stats?.topProperties && stats.topProperties.length > 0 && (
        <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
          <CardHeader className="bg-[#F0F0F0]/50 border-b border-[#999999] p-5">
            <CardTitle className="text-sm font-black text-[#242424]">أعلى 5 عقارات بالإيرادات</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">العقار</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">الإيرادات</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">صافي الربح</th>
                  <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">الإشغال</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProperties.map((p) => (
                  <tr key={p.propertyId} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] transition-colors">
                    <td className="p-3 font-bold text-[#242424]">{p.propertyName}</td>
                    <td className="p-3 font-mono font-semibold text-[#242424]">{fmt(p.revenue)}</td>
                    <td className={cn("p-3 font-mono font-semibold", p.netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {fmt(p.netProfit)}
                    </td>
                    <td className="p-3 font-bold">{(p.occupancyRate * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
