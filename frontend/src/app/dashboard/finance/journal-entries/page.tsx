"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { financeApi } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { Plus, Loader2, Search, FileEdit } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-yellow-50 text-yellow-700 border-yellow-200",
  POSTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  VOIDED: "bg-red-50 text-red-600 border-red-200",
};

const SOURCE_COLORS: Record<string, string> = {
  MANUAL: "bg-blue-50 text-blue-700",
  PAYMENT: "bg-emerald-50 text-emerald-700",
  INVOICE: "bg-purple-50 text-purple-700",
  CLOSING: "bg-amber-50 text-amber-700",
};

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', sourceType: '' });

  useEffect(() => {
    financeApi.getJournalEntries(filter).then((res) => {
      setEntries(Array.isArray(res) ? res : res.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  if (loading) return (
    <div className="flex items-center justify-center h-[40vh]">
      <Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#242424]">القيود <span className="text-[#6264A7]">اليومية</span></h1>
        <Link href="/dashboard/finance/journal-entries/new">
          <Button className="bg-[#6264A7] hover:bg-[#5254A0] text-white text-xs font-bold gap-1.5">
            <Plus className="w-3.5 h-3.5" /> قيد جديد
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          className="text-xs border border-[#999999] rounded-md px-3 py-2 bg-white font-bold text-[#242424]"
          value={filter.status}
          onChange={(e) => setFilter(p => ({ ...p, status: e.target.value }))}
        >
          <option value="">كل الحالات</option>
          <option value="DRAFT">مسودة</option>
          <option value="POSTED">مرحّل</option>
          <option value="VOIDED">ملغي</option>
        </select>
        <select
          className="text-xs border border-[#999999] rounded-md px-3 py-2 bg-white font-bold text-[#242424]"
          value={filter.sourceType}
          onChange={(e) => setFilter(p => ({ ...p, sourceType: e.target.value }))}
        >
          <option value="">كل المصادر</option>
          <option value="MANUAL">يدوي</option>
          <option value="PAYMENT">دفعة</option>
          <option value="INVOICE">فاتورة</option>
        </select>
      </div>

      <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">رقم القيد</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">التاريخ</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">الوصف</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">المصدر</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e: any) => (
                <tr key={e.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] cursor-pointer transition-colors">
                  <td className="p-3">
                    <Link href={`/dashboard/finance/journal-entries/${e.id}`} className="font-mono font-bold text-[#6264A7] hover:underline">
                      {e.entryNumber}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-[#666666]">{new Date(e.date).toLocaleDateString('ar-IQ')}</td>
                  <td className="p-3 font-bold text-[#242424] max-w-[300px] truncate">{e.description}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={cn("text-[9px] font-bold border-none", SOURCE_COLORS[e.sourceType] || "bg-gray-50 text-gray-600")}>
                      {e.sourceType}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className={cn("text-[9px] font-bold", STATUS_COLORS[e.status] || "bg-gray-100 text-gray-500")}>
                      {e.status === 'DRAFT' ? 'مسودة' : e.status === 'POSTED' ? 'مرحّل' : e.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-[#999999] font-bold text-sm">لا توجد قيود</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
