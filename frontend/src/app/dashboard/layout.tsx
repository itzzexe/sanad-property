"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Building2, LayoutDashboard, Home, DoorOpen, Users, FileText,
  CreditCard, Receipt, LogOut, Menu, X, ChevronRight, Settings, User,
  ShieldCheck, History as HistoryIcon, UserPlus, Wallet, BarChart3, Calculator,
  Zap, FileBadge, ArrowDownRight, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { useCurrency } from "@/context/currency-context";

const BASE_NAVIGATION = [
  { name: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
  { name: "العقارات", href: "/dashboard/properties", icon: Home },
  { name: "المستأجرين", href: "/dashboard/tenants", icon: Users },
  { name: "العقود", href: "/dashboard/contracts", icon: FileText },
  { name: "المدفوعات", href: "/dashboard/payments", icon: CreditCard },
];

const FINANCIAL_NAVIGATION = [
  { name: "المصروفات والفواتير", href: "/dashboard/expenses", icon: Zap },
  { name: "تقسيم الأرباح", href: "/dashboard/sharing", icon: Calculator },
  { name: "الأصول والإهلاك", href: "/dashboard/assets", icon: FileBadge },
  { name: "التقارير المالية", href: "/dashboard/reports", icon: BarChart3 },
];

const ADMIN_NAVIGATION = [
  { name: "المستخدمين", href: "/dashboard/users", icon: UserPlus },
  { name: "سجل التدقيق", href: "/dashboard/audit-logs", icon: HistoryIcon },
];

const SETTINGS_NAVIGATION = [
  { name: "الإعدادات", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));

    // Fetch global settings for logo and org name
    api.get("/settings").then(setSettings).catch(console.error);
  }, [router]);

  const navigation = [
    ...BASE_NAVIGATION,
    ...FINANCIAL_NAVIGATION,
    ...(user?.role === 'ADMIN' ? ADMIN_NAVIGATION : []),
    ...SETTINGS_NAVIGATION
  ];

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#242424]" dir="rtl">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Teams-Style Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-64 bg-[#EBEBEB] border-l border-[#999999] transform transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Teams Header */}
          <div className="flex items-center gap-3 px-6 py-6 bg-[#6264A7] text-white">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
              {settings?.logo ? (
                 <img src={settings.logo} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                 <Building2 className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-tight">{settings?.organizationName || "سـند"}</h1>
              <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Enterprise ERP</p>
            </div>
            <button className="mr-auto lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-semibold transition-all group",
                    isActive
                      ? "bg-white text-[#6264A7] shadow-sm ring-1 ring-[#999999]"
                      : "text-[#111111] hover:bg-white/50 hover:text-[#6264A7]"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-[#6264A7]" : "text-[#222222] group-hover:text-[#6264A7]"
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer User */}
          <div className="p-4 bg-[#F0F0F0] border-t border-[#999999]">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 cursor-pointer transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-[#6264A7] flex items-center justify-center text-white font-black text-sm">
                {user?.firstName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-[#242424]">{user?.firstName} {user?.lastName}</p>
                <p className="text-[9px] font-bold text-[#222222] uppercase tracking-tighter">
                  {user?.role === 'ADMIN' ? 'مدير عام' : 'محاسب مالي'}
                </p>
              </div>
              <button onClick={handleLogout} className="text-[#222222] hover:text-rose-600">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pr-64 transition-all duration-300 min-h-screen flex flex-col">
        {/* Teams Header Navbar */}
        <header className="sticky top-0 z-[40] flex items-center justify-between bg-white px-8 h-16 border-b border-[#999999] shadow-sm">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-1.5 rounded-md bg-[#F0F0F0] text-[#6264A7]" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-[#222222] font-bold text-xs uppercase tracking-widest hidden md:block">
              {pathname === '/dashboard' ? 'Overview' : pathname.split('/').pop()?.toUpperCase()}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Currency Switcher */}
            <div className="flex items-center bg-[#F0F0F0] p-1 rounded-md border border-[#999999]">
              <button 
                onClick={() => setDisplayCurrency("IQD")}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold rounded-sm transition-all",
                  displayCurrency === "IQD" ? "bg-white text-[#6264A7] shadow-sm" : "text-[#222222]"
                )}
              >
                IQD
              </button>
              <button 
                onClick={() => setDisplayCurrency("USD")}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold rounded-sm transition-all",
                  displayCurrency === "USD" ? "bg-white text-[#6264A7] shadow-sm" : "text-[#222222]"
                )}
              >
                USD
              </button>
            </div>
            
            <div className="h-4 w-[1px] bg-[#999999]" />
            <NotificationDropdown />
          </div>
        </header>

        {/* Dynamic content */}
        <main className="flex-1 p-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
        
        <footer className="px-8 py-4 bg-white border-t border-[#999999] flex items-center justify-between text-[10px] font-bold text-[#222222] uppercase tracking-widest">
           <div>سـند للعقارات © {new Date().getFullYear()}</div>
           <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[8px] border-[#999999] text-[#222222]">Enterprise v4.2</Badge>
              <div className="flex items-center gap-1">
                 <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                 SERVER ONLINE
              </div>
           </div>
        </footer>
      </div>
    </div>
  );
}
