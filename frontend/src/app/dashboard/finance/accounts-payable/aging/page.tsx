"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function ApAgingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#242424]">أعمار ديون <span className="text-[#6264A7]">الموردين</span></h1>
      <Card className="bg-white border-[#999999] shadow-sm rounded-md">
        <CardContent className="p-12 text-center">
          <Clock className="w-12 h-12 text-[#999999] mx-auto mb-4" />
          <p className="text-sm font-bold text-[#242424]">تقرير أعمار ديون الموردين</p>
          <p className="text-xs text-[#666666] mt-1">سيتم حساب التقرير من بيانات الفواتير المعلقة</p>
        </CardContent>
      </Card>
    </div>
  );
}
