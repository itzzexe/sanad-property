"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, FileEdit, Scale, TrendingUp, PieChart, DollarSign,
  BarChart3, Wallet, Users, Building2, Landmark, Receipt, CalendarDays, ChevronLeft
} from "lucide-react";

const SECTIONS = [
  {
    label: "نظرة عامة",
    items: [
      { name: "لوحة المالية", href: "/dashboard/finance/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "الدفاتر",
    items: [
      { name: "شجرة الحسابات", href: "/dashboard/finance/chart-of-accounts", icon: BookOpen },
      { name: "القيود اليومية", href: "/dashboard/finance/journal-entries", icon: FileEdit },
      { name: "ميزان المراجعة", href: "/dashboard/finance/trial-balance", icon: Scale },
    ],
  },
  {
    label: "التقارير",
    items: [
      { name: "قائمة الدخل", href: "/dashboard/finance/reports/income-statement", icon: TrendingUp },
      { name: "الميزانية العمومية", href: "/dashboard/finance/reports/balance-sheet", icon: PieChart },
      { name: "التدفقات النقدية", href: "/dashboard/finance/reports/cash-flow", icon: DollarSign },
      { name: "أعمار الديون", href: "/dashboard/finance/reports/ar-aging", icon: BarChart3 },
      { name: "ربحية العقارات", href: "/dashboard/finance/reports/property-profitability", icon: Building2 },
    ],
  },
  {
    label: "التخطيط",
    items: [
      { name: "الميزانيات", href: "/dashboard/finance/budgets", icon: Wallet },
    ],
  },
  {
    label: "الذمم",
    items: [
      { name: "حسابات القبض", href: "/dashboard/finance/accounts-receivable", icon: Users },
      { name: "حسابات الدفع", href: "/dashboard/finance/accounts-payable/vendors", icon: Receipt },
    ],
  },
  {
    label: "الخزينة",
    items: [
      { name: "التسويات البنكية", href: "/dashboard/finance/reconciliation", icon: Landmark },
    ],
  },
  {
    label: "الإعدادات",
    items: [
      { name: "الفترات المالية", href: "/dashboard/finance/fiscal-periods", icon: CalendarDays },
    ],
  },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-6 -m-8">
      {/* Finance Sub-nav */}
      <aside className="w-60 min-h-[calc(100vh-8rem)] bg-white border-l border-[#999999] py-6 px-3 flex-shrink-0 overflow-y-auto">
        <Link href="/dashboard" className="flex items-center gap-2 px-3 mb-6 text-xs font-black text-[#6264A7] hover:underline">
          <ChevronLeft className="w-4 h-4 rotate-180" /> العودة للرئيسية
        </Link>

        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-3 mb-2 text-[9px] font-black uppercase tracking-widest text-[#999999]">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard/finance/dashboard");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-all",
                      isActive
                        ? "bg-[#6264A7]/10 text-[#6264A7] font-bold"
                        : "text-[#242424] hover:bg-[#F5F5F5]"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isActive ? "text-[#6264A7]" : "text-[#666666]")} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </aside>

      {/* Main Content */}
      <main className="flex-1 py-8 pr-8 pl-2 min-w-0">
        {children}
      </main>
    </div>
  );
}
