"use client";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function VatReturnPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#242424]">إقرار <span className="text-[#6264A7]">ضريبة القيمة المضافة</span></h1>
      <Card className="bg-white border-[#999999] shadow-sm rounded-md">
        <CardContent className="p-12 text-center">
          <FileText className="w-12 h-12 text-[#999999] mx-auto mb-4" />
          <p className="text-sm font-bold text-[#242424]">سيتم إضافة هذه الخاصية في تحديث قادم</p>
          <p className="text-xs text-[#666666] mt-1">إقرارات الضريبة تعتمد على بيانات الفواتير والتحصيل المسجلة في النظام</p>
        </CardContent>
      </Card>
    </div>
  );
}
