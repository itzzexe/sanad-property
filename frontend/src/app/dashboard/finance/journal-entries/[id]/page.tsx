"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { financeApi } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { Loader2, Send, ArrowRight } from "lucide-react";

export default function JournalEntryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { financeApi.getJournalEntry(id as string).then(setEntry).catch(console.error).finally(() => setLoading(false)); }, [id]);

  const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="flex items-center justify-center h-[40vh]"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>;
  if (!entry) return <p className="text-center text-[#999999] font-bold py-12">لم يتم العثور على القيد</p>;

  const handlePost = async () => {
    await financeApi.postJournalEntry(entry.id);
    setEntry({ ...entry, status: 'POSTED' });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#242424]">قيد <span className="text-[#6264A7]">#{entry.entryNumber}</span></h1>
          <p className="text-xs font-bold text-[#666666] mt-1">{entry.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("font-bold", entry.status === 'POSTED' ? "bg-emerald-50 text-emerald-700" : "bg-yellow-50 text-yellow-700")}>
            {entry.status === 'POSTED' ? 'مرحّل' : 'مسودة'}
          </Badge>
          {entry.status === 'DRAFT' && (
            <Button onClick={handlePost} className="bg-[#6264A7] hover:bg-[#5254A0] text-white text-xs font-bold gap-1.5"><Send className="w-3.5 h-3.5" /> ترحيل</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white border-[#999999] rounded-md"><CardContent className="p-4">
          <p className="text-[9px] font-black text-[#999999] uppercase tracking-widest">التاريخ</p>
          <p className="text-sm font-bold font-mono mt-1">{new Date(entry.date).toLocaleDateString('ar-IQ')}</p>
        </CardContent></Card>
        <Card className="bg-white border-[#999999] rounded-md"><CardContent className="p-4">
          <p className="text-[9px] font-black text-[#999999] uppercase tracking-widest">المصدر</p>
          <p className="text-sm font-bold mt-1">{entry.sourceType}</p>
        </CardContent></Card>
        <Card className="bg-white border-[#999999] rounded-md"><CardContent className="p-4">
          <p className="text-[9px] font-black text-[#999999] uppercase tracking-widest">المرجع</p>
          <p className="text-sm font-bold mt-1">{entry.reference || '–'}</p>
        </CardContent></Card>
      </div>

      <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
        <CardHeader className="bg-[#F0F0F0]/50 border-b border-[#999999] p-4">
          <CardTitle className="text-sm font-black text-[#242424]">البنود</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الحساب</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الوصف</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">مدين</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">دائن</th>
              </tr>
            </thead>
            <tbody>
              {(entry.lines || []).map((l: any, i: number) => (
                <tr key={i} className="border-b border-[#F5F5F5]">
                  <td className="p-3 font-bold">{l.account?.code} — {l.account?.name}</td>
                  <td className="p-3 text-[#666666]">{l.description || '–'}</td>
                  <td className="p-3 font-mono">{fmt(Number(l.debit))}</td>
                  <td className="p-3 font-mono text-[#666666]">{fmt(Number(l.credit))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
