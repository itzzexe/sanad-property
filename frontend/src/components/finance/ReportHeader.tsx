"use client";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { financeApi } from "@/lib/api/finance";

export function ReportHeader({ title, dateRange, reportType, children }: {
  title: string; dateRange?: string; reportType: string; children?: React.ReactNode;
}) {
  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const result = await financeApi.exportReport(reportType, format);
      window.open(result.url, '_blank');
    } catch (e) { console.error('Export failed', e); }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-black text-[#242424]">{title}</h1>
        {dateRange && <p className="text-xs font-bold text-[#222222] mt-1">{dateRange}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} className="gap-1.5 text-xs font-bold border-[#999999]">
          <Download className="w-3.5 h-3.5" /> PDF
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExport('excel')} className="gap-1.5 text-xs font-bold border-[#999999]">
          <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
        </Button>
      </div>
    </div>
  );
}
