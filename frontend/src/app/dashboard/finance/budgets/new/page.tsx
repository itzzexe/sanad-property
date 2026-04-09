"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { financeApi } from "@/lib/api/finance";
import { Loader2, Save } from "lucide-react";

export default function NewBudgetPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await financeApi.createBudget({ name, fiscalYearId });
      router.push('/dashboard/finance/budgets');
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-black text-[#242424]">ميزانية <span className="text-[#6264A7]">جديدة</span></h1>
      <Card className="bg-white border-[#999999] shadow-sm rounded-md">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label className="text-xs font-bold text-[#222222]">اسم الميزانية</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ميزانية 2025" className="mt-1 border-[#999999] text-sm" />
          </div>
          <div>
            <Label className="text-xs font-bold text-[#222222]">معرّف السنة المالية</Label>
            <Input value={fiscalYearId} onChange={(e) => setFiscalYearId(e.target.value)} placeholder="FY-2025" className="mt-1 border-[#999999] text-sm" />
          </div>
          <Button onClick={handleSubmit} disabled={submitting || !name} className="bg-[#6264A7] hover:bg-[#5254A0] text-white text-xs font-bold gap-1.5 w-full">
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} إنشاء
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
