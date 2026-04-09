"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { financeApi } from "@/lib/api/finance";
import { Plus, Loader2 } from "lucide-react";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getVendors().then(d => setVendors(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[40vh]"><Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#242424]">الموردين</h1>
        <Link href="/dashboard/finance/accounts-payable/vendors/new">
          <Button className="bg-[#6264A7] hover:bg-[#5254A0] text-white text-xs font-bold gap-1.5"><Plus className="w-3.5 h-3.5" /> مورّد جديد</Button>
        </Link>
      </div>
      <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الاسم</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">البريد</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الهاتف</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px]">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                  <td className="p-3 font-bold text-[#242424]">{v.name}</td>
                  <td className="p-3 text-[#666666]">{v.contactEmail || "–"}</td>
                  <td className="p-3 text-[#666666]">{v.phone || "–"}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={v.isActive ? "bg-emerald-50 text-emerald-700 text-[9px] font-bold" : "bg-gray-100 text-gray-500 text-[9px] font-bold"}>
                      {v.isActive ? "نشط" : "متوقف"}
                    </Badge>
                  </td>
                </tr>
              ))}
              {vendors.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-[#999999] font-bold">لا يوجد موردون</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
