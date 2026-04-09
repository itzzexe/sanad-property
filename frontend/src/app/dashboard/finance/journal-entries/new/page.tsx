"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { financeApi, Account } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Save, Send, Loader2, AlertTriangle } from "lucide-react";

interface JournalLineForm {
  accountId: string; debit: string; credit: string; description: string;
}

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<JournalLineForm[]>([
    { accountId: '', debit: '', credit: '', description: '' },
    { accountId: '', debit: '', credit: '', description: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerms, setSearchTerms] = useState<string[]>(['', '']);

  useEffect(() => {
    financeApi.getAccounts().then(setAccounts).catch(console.error);
  }, []);

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const addLine = () => {
    setLines([...lines, { accountId: '', debit: '', credit: '', description: '' }]);
    setSearchTerms([...searchTerms, '']);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
    setSearchTerms(searchTerms.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: string, value: string) => {
    const next = [...lines];
    (next[idx] as any)[field] = value;
    setLines(next);
  };

  const submit = async (andPost: boolean) => {
    setSubmitting(true);
    try {
      const entry = await financeApi.createJournalEntry({
        date, description, notes, sourceType: 'MANUAL',
        lines: lines
          .filter(l => l.accountId && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0))
          .map(l => ({
            accountId: l.accountId,
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
            description: l.description,
          })),
      });
      if (andPost) await financeApi.postJournalEntry(entry.id);
      router.push('/dashboard/finance/journal-entries');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-black text-[#242424]">قيد <span className="text-[#6264A7]">جديد</span></h1>

      <Card className="bg-white border-[#999999] shadow-sm rounded-md">
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-[#222222]">التاريخ</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 border-[#999999] text-sm" />
            </div>
            <div>
              <Label className="text-xs font-bold text-[#222222]">الوصف</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف القيد" className="mt-1 border-[#999999] text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold text-[#222222]">ملاحظات (اختياري)</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full border border-[#999999] rounded-md px-3 py-2 text-sm resize-none" />
          </div>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
        <CardHeader className="bg-[#F0F0F0]/50 border-b border-[#999999] p-4 flex-row items-center justify-between">
          <CardTitle className="text-sm font-black text-[#242424]">بنود القيد</CardTitle>
          <Button variant="outline" size="sm" onClick={addLine} className="gap-1 text-xs font-bold border-[#999999]">
            <Plus className="w-3 h-3" /> إضافة سطر
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">الحساب</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider w-28">مدين</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider w-28">دائن</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">وصف</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="border-b border-[#F5F5F5]">
                  <td className="p-2">
                    <select
                      value={line.accountId}
                      onChange={(e) => updateLine(idx, 'accountId', e.target.value)}
                      className="w-full border border-[#999999] rounded px-2 py-1.5 text-xs bg-white"
                    >
                      <option value="">اختر حساب...</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number" step="0.01" min="0" value={line.debit}
                      onChange={(e) => updateLine(idx, 'debit', e.target.value)}
                      className="border-[#999999] text-xs font-mono text-left" dir="ltr"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number" step="0.01" min="0" value={line.credit}
                      onChange={(e) => updateLine(idx, 'credit', e.target.value)}
                      className="border-[#999999] text-xs font-mono text-left" dir="ltr"
                    />
                  </td>
                  <td className="p-2">
                    <Input value={line.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} className="border-[#999999] text-xs" placeholder="وصف..." />
                  </td>
                  <td className="p-2">
                    <button onClick={() => removeLine(idx)} className="text-[#999999] hover:text-red-500 transition-colors" disabled={lines.length <= 2}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {/* Totals */}
              <tr className="bg-[#FAFAFA] border-t-2 border-[#EBEBEB]">
                <td className="p-3 text-xs font-black text-[#242424]">المجموع</td>
                <td className="p-3 font-mono font-black text-[#242424] text-xs">{fmt(totalDebit)}</td>
                <td className="p-3 font-mono font-black text-[#242424] text-xs">{fmt(totalCredit)}</td>
                <td colSpan={2} className="p-3">
                  {!isBalanced && totalDebit + totalCredit > 0 && (
                    <div className="flex items-center gap-1.5 text-red-600 text-[11px] font-bold" data-testid="balance-warning">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      غير متوازن: المدين {fmt(totalDebit)} ≠ الدائن {fmt(totalCredit)}
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => submit(false)} disabled={submitting || !description} className="gap-1.5 text-xs font-bold border-[#999999]">
          <Save className="w-3.5 h-3.5" /> حفظ كمسودة
        </Button>
        <Button onClick={() => submit(true)} disabled={submitting || !isBalanced || !description}
          className="bg-[#6264A7] hover:bg-[#5254A0] text-white text-xs font-bold gap-1.5" data-testid="submit-btn">
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          حفظ وترحيل
        </Button>
      </div>
    </div>
  );
}
