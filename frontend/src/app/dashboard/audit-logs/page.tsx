"use client";

import { useState, useEffect } from "react";
import { 
  History, User as UserIcon, Clock, Activity, Search, 
  Filter, ArrowLeftRight, FileCode, CheckCircle2, XCircle, AlertCircle, ShieldCheck, Terminal
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      const res = await api.get("/settings/audit?limit=50");
      setLogs(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => 
    log.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    log.entity?.toLowerCase().includes(search.toLowerCase()) ||
    log.action?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 page-enter p-2 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2 leading-tight">
            سجل <span className="text-gradient-indigo">التدقيق</span>
          </h1>
          <p className="text-slate-700 text-lg font-medium flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            مراقبة العمليات الحساسة وتوثيق التفاعلات التقنية لضمان شفافية النظام
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative group w-64 md:w-80">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                placeholder="بحث في السجلات..." 
                className="w-full pr-11 h-12 bg-white border border-slate-100 shadow-premium rounded-xl text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <Button onClick={loadLogs} variant="outline" className="h-12 px-6 rounded-xl gap-2 border-slate-100 bg-white font-bold hover:bg-slate-50 transition-all">
             <Activity className={cn("w-4 h-4 text-indigo-500", loading && "animate-spin")} />
             تحديث
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="p-6 bg-white border-none shadow-premium rounded-2xl flex items-center gap-5 transition-transform hover:scale-[1.02] duration-300">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
               <Terminal className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
               <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">إجمالي العمليات</p>
               <p className="text-2xl font-black text-slate-900 leading-none mt-1">{logs.length}</p>
            </div>
         </div>
         <div className="p-6 bg-white border-none shadow-premium rounded-2xl flex items-center gap-5 transition-transform hover:scale-[1.02] duration-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
               <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
               <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">إضافة جديدة</p>
               <p className="text-2xl font-black text-emerald-600 leading-none mt-1">{logs.filter(l => l.action === 'CREATE').length}</p>
            </div>
         </div>
         <div className="p-6 bg-white border-none shadow-premium rounded-2xl flex items-center gap-5 transition-transform hover:scale-[1.02] duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
               <ArrowLeftRight className="w-6 h-6 text-blue-600" />
            </div>
            <div>
               <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">عمليات التعديل</p>
               <p className="text-2xl font-black text-blue-600 leading-none mt-1">{logs.filter(l => l.action === 'UPDATE').length}</p>
            </div>
         </div>
         <div className="p-6 bg-white border-none shadow-premium rounded-2xl flex items-center gap-5 transition-transform hover:scale-[1.02] duration-300">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
               <XCircle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
               <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">حذف سجلات</p>
               <p className="text-2xl font-black text-rose-600 leading-none mt-1">{logs.filter(l => l.action === 'DELETE').length}</p>
            </div>
         </div>
      </div>

      <Card className="border-none shadow-premium bg-white rounded-[32px] overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="text-right py-6 text-slate-900 font-black">المستخدم</TableHead>
              <TableHead className="text-center py-6 text-slate-900 font-black">النوع</TableHead>
              <TableHead className="text-right py-6 text-slate-900 font-black">الكيان المتأثر</TableHead>
              <TableHead className="text-right py-6 text-slate-900 font-black">المعرف</TableHead>
              <TableHead className="text-right py-6 text-slate-900 font-black">التوقيت</TableHead>
              <TableHead className="text-left py-6 text-slate-900 font-black pl-8">التفاصيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-20 animate-pulse bg-slate-50/20" />
                </TableRow>
              ))
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center text-slate-600 italic">
                  لا توجد سجلات تطابق البحث حالياً
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/40 transition-colors border-slate-50 group">
                  <TableCell className="py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{log.user?.firstName} {log.user?.lastName}</p>
                        <p className="text-[10px] text-slate-600 font-mono font-bold tracking-tight">{log.user?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "rounded-lg px-3 py-1 font-black text-[9px] uppercase border-none shadow-none",
                      log.action === 'CREATE' && "bg-emerald-100 text-emerald-700",
                      log.action === 'UPDATE' && "bg-blue-100 text-blue-700",
                      log.action === 'DELETE' && "bg-rose-100 text-rose-700",
                      !['CREATE', 'UPDATE', 'DELETE'].includes(log.action) && "bg-slate-900 text-white"
                    )}>
                      {log.action === 'CREATE' ? 'CREATE' : 
                       log.action === 'UPDATE' ? 'UPDATE' : 
                       log.action === 'DELETE' ? 'DELETE' : log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-slate-600" />
                        <span className="font-bold text-slate-600 text-sm tracking-tight">{log.entity}</span>
                     </div>
                  </TableCell>
                  <TableCell>
                     <code className="text-[10px] bg-slate-50 px-2 py-1 rounded text-slate-600 font-mono border border-slate-100">
                       {log.entityId.split('-')[0]}...
                     </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ar })}</span>
                      <span className="text-[9px] text-slate-600 font-mono">{format(new Date(log.createdAt), 'HH:mm:ss')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="pl-8 text-left">
                     <Button variant="ghost" size="sm" className="h-8 rounded-lg px-3 text-[10px] font-black hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                       مشاهدة
                     </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
