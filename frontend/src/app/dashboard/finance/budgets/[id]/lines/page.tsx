"use client";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { FileEdit } from "lucide-react";

export default function BudgetLinesEditorPage() {
  const { id } = useParams();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#242424]">تعديل <span className="text-[#6264A7]">بنود الميزانية</span></h1>
      <Card className="bg-white border-[#999999] shadow-sm rounded-md">
        <CardContent className="p-12 text-center">
          <FileEdit className="w-12 h-12 text-[#999999] mx-auto mb-4" />
          <p className="text-sm font-bold text-[#242424]">محرر بنود الميزانية للميزانية #{String(id).slice(0, 8)}</p>
          <p className="text-xs text-[#666666] mt-1">يتم تعديل بنود الميزانية حسب الفترة المالية والحساب</p>
        </CardContent>
      </Card>
    </div>
  );
}
