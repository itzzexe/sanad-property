"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, FileText, Download, Filter, Calendar, 
  Building2, Users, CreditCard, ChevronRight, CheckCircle2,
  FileSpreadsheet, FilePieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const REPORT_TYPES = [
  {
    id: "financial",
    title: "التقرير المالي العام",
    description: "ملخص شامل للإيرادات، المصروفات، وصافي الأرباح للفترة المحددة.",
    icon: BarChart3,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    id: "occupancy",
    title: "تقرير نسبة الإشغال",
    description: "تحليل للوحدات المشغولة والشاغرة ونسبة العائد لكل عقار.",
    icon: Building2,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    id: "expenses",
    title: "سجل المصروفات التشغيلية",
    description: "تقرير تفصيلي بكافة المصاريف، الصيانة، والرسوم للفترة المحددة.",
    icon: FileText,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50"
  },
  {
    id: "tenants",
    title: "بيانات المستأجرين النشطين",
    description: "تقرير شامل بحالة المستأجرين الحاليين، أرقام التواصل، ومواعيد انتهاء العقود.",
    icon: Users,
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  }
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState("financial");
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    property: "all"
  });

  useEffect(() => {
    api.get("/reports/properties").then(setProperties).catch(console.error);
  }, []);

  const handleDownload = async (format: "excel" | "pdf") => {
    setLoading(true);
    try {
      let endpoint = "";
      if (selectedReport === "financial") {
        endpoint = format === "excel" ? "/reports/financial/excel" : "/reports/financial/pdf";
      } else if (selectedReport === "occupancy") {
        endpoint = "/reports/occupancy/excel";
      } else if (selectedReport === "expenses") {
        endpoint = "/reports/expenses/excel";
      } else if (selectedReport === "tenants") {
        endpoint = "/reports/tenants/excel";
      }

      if (!endpoint) {
        alert("هذا النوع من التقارير غير متوفر حالياً بهذا الصيغة.");
        return;
      }

      // Add filters
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.property && filters.property !== 'all') queryParams.append("property", filters.property);
      
      const blob = await api.download(`${endpoint}?${queryParams.toString()}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedReport}-report-${new Date().getTime()}.${format === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "فشل تحميل التقرير. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#6264A7] font-bold text-sm mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>مركز التقارير والذكاء المالي</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">استخراج التقارير</h1>
          <p className="text-slate-500 font-bold max-w-xl">قم ببناء تقريرك المخصص وتحميله بصيغ احترافية للطباعة أو الأرشفة.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Types List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest px-2">اختر نوع التقرير</h3>
          <div className="space-y-3">
            {REPORT_TYPES.map((report) => (
              <div 
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
                  selectedReport === report.id 
                    ? "bg-white border-[#6264A7] shadow-md scale-[1.02]" 
                    : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-300 grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("p-2 rounded-lg", report.bgColor)}>
                    <report.icon className={cn("w-6 h-6", report.color)} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 leading-none mb-1">{report.title}</h4>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed">{report.description}</p>
                  </div>
                  {selectedReport === report.id && (
                    <CheckCircle2 className="w-5 h-5 text-[#6264A7] shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Area */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
              <Filter className="w-5 h-5 text-[#6264A7]" />
              <h3 className="font-black text-slate-900">تخصيص بيانات التقرير</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">تاريخ البداية</label>
                <div className="relative group">
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#6264A7] transition-colors" />
                  <input 
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="w-full h-12 bg-slate-50 border-slate-200 border-2 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:border-[#6264A7] focus:ring-4 focus:ring-[#6264A7]/5 transition-all outline-none pr-11 pl-4"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">تاريخ النهاية</label>
                <div className="relative group">
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#6264A7] transition-colors" />
                  <input 
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="w-full h-12 bg-slate-50 border-slate-200 border-2 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:border-[#6264A7] focus:ring-4 focus:ring-[#6264A7]/5 transition-all outline-none pr-11 pl-4"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">نطاق البحث</label>
                <select 
                  value={filters.property}
                  onChange={(e) => setFilters({...filters, property: e.target.value})}
                  className="w-full h-12 bg-slate-50 border-slate-200 border-2 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:border-[#6264A7] focus:ring-4 focus:ring-[#6264A7]/5 transition-all outline-none px-4"
                >
                  <option value="all">كافة العقارات والمحفظة المالية</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
              <Button 
                onClick={() => handleDownload("excel")}
                disabled={loading}
                className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-base shadow-lg shadow-emerald-200 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-6 h-6" />
                )}
                تصدير بصيغة EXCEL
              </Button>

              <Button 
                onClick={() => handleDownload("pdf")}
                disabled={loading}
                className="flex-1 h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-base shadow-lg shadow-rose-200 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FilePieChart className="w-6 h-6" />
                )}
                تصدير بصيغة PDF
              </Button>
            </div>
          </Card>

          {/* Quick Stats Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                   <Download className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase">التقارير المستخرجة</p>
                   <p className="text-xl font-black text-slate-900">0 تقرير</p>
                </div>
             </div>

             <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                   <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase">حجم البيانات الموثقة</p>
                   <p className="text-xl font-black text-slate-900">0.0 MB</p>
                </div>
             </div>

             <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4 group cursor-help">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                   <Badge className="bg-emerald-600 shadow-sm">نشط</Badge>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase">الأتمتة الذكية</p>
                   <p className="text-base font-black text-slate-900">جاهز للتوليد التلقائي</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
