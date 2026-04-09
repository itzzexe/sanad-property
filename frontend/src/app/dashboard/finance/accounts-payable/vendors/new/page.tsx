"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { financeApi } from "@/lib/api/finance";
import { Loader2, Save } from "lucide-react";

export default function NewVendorPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', contactEmail: '', phone: '', address: '', taxId: '' });
  const [submitting, setSubmitting] = useState(false);

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await financeApi.createVendor(form);
      router.push('/dashboard/finance/accounts-payable/vendors');
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-black text-[#242424]">مورّد <span className="text-[#6264A7]">جديد</span></h1>
      <Card className="bg-white border-[#999999] shadow-sm rounded-md">
        <CardContent className="p-6 space-y-4">
          <div><Label className="text-xs font-bold text-[#222222]">الاسم</Label>
            <Input value={form.name} onChange={(e) => update('name', e.target.value)} className="mt-1 border-[#999999] text-sm" /></div>
          <div><Label className="text-xs font-bold text-[#222222]">البريد الإلكتروني</Label>
            <Input value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} className="mt-1 border-[#999999] text-sm" /></div>
          <div><Label className="text-xs font-bold text-[#222222]">الهاتف</Label>
            <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="mt-1 border-[#999999] text-sm" /></div>
          <div><Label className="text-xs font-bold text-[#222222]">العنوان</Label>
            <Input value={form.address} onChange={(e) => update('address', e.target.value)} className="mt-1 border-[#999999] text-sm" /></div>
          <div><Label className="text-xs font-bold text-[#222222]">الرقم الضريبي</Label>
            <Input value={form.taxId} onChange={(e) => update('taxId', e.target.value)} className="mt-1 border-[#999999] text-sm" /></div>
          <Button onClick={handleSubmit} disabled={submitting || !form.name} className="bg-[#6264A7] hover:bg-[#5254A0] text-white text-xs font-bold gap-1.5 w-full">
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} حفظ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
