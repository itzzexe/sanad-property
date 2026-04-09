"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { financeApi, Account } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronLeft, Plus, MoreHorizontal, Loader2 } from "lucide-react";
import { AccountDialog } from "@/components/finance/AccountDialog";

const TYPE_COLORS: Record<string, string> = {
  ASSET: "bg-blue-50 text-blue-700",
  LIABILITY: "bg-amber-50 text-amber-700",
  EQUITY: "bg-purple-50 text-purple-700",
  REVENUE: "bg-emerald-50 text-emerald-700",
  EXPENSE: "bg-rose-50 text-rose-700",
};

function AccountRow({ account, level = 0, onAddChild }: { account: Account; level?: number; onAddChild: (acc: Account) => void }) {
  const [open, setOpen] = useState(false);
  const hasChildren = account.children && account.children.length > 0;

  return (
    <>
      <tr className={cn("border-b border-[#F5F5F5] hover:bg-[#FAFAFA] group transition-colors", !account.isActive && "opacity-50")}>
        <td className="p-3" style={{ paddingRight: `${12 + level * 20}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button onClick={() => setOpen(!open)} className="text-[#666666] hover:text-[#6264A7] transition-colors">
                {open ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            ) : <div className="w-4" />}
            <span className="font-mono text-xs text-[#666666]">{account.code}</span>
          </div>
        </td>
        <td className="p-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#242424]">{account.name}</span>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onAddChild(account)}
                >
                    <Plus className="h-3 w-3" />
                </Button>
            </div>
        </td>
        <td className="p-3">
          <Badge variant="outline" className={cn("text-[9px] font-bold border-none", TYPE_COLORS[account.type] || "bg-gray-50 text-gray-600")}>
            {account.type}
          </Badge>
        </td>
        <td className="p-3 text-xs font-mono text-[#666666]">{account.currencyCode || "USD"}</td>
        <td className="p-3">
          <Badge variant="outline" className={cn("text-[9px] font-bold", account.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-gray-100 text-gray-500")}>
            {account.isActive ? "نشط" : "متوقف"}
          </Badge>
        </td>
      </tr>
      {open && hasChildren && account.children!.map((child) => (
        <AccountRow key={child.id} account={child} level={level + 1} onAddChild={onAddChild} />
      ))}
    </>
  );
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [parentAccount, setParentAccount] = useState<Account | null>(null);

  const fetchAccounts = () => {
    setLoading(true);
    financeApi.getAccounts()
        .then(setAccounts)
        .catch(console.error)
        .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAccount = () => {
    setParentAccount(null);
    setDialogOpen(true);
  };

  const handleAddChild = (parent: Account) => {
    setParentAccount(parent);
    setDialogOpen(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[40vh]">
      <Loader2 className="w-8 h-8 text-[#6264A7] animate-spin" />
    </div>
  );

  // Build tree from flat list
  const map = new Map<string, Account & { children: Account[] }>();
  accounts.forEach(a => map.set(a.id, { ...a, children: [] }));
  const roots: Account[] = [];
  map.forEach(a => {
    if (a.parentId && map.has(a.parentId)) {
      map.get(a.parentId)!.children.push(a);
    } else {
      roots.push(a);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#242424]">شجرة <span className="text-[#6264A7]">الحسابات</span></h1>
        <Button 
            onClick={handleAddAccount}
            className="bg-[#6264A7] hover:bg-[#5254A0] text-white text-xs font-bold gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> إضافة حساب رئيسي
        </Button>
      </div>

      <Card className="bg-white border-[#999999] shadow-sm rounded-md overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider w-32">الرمز</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider">اسم الحساب</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider w-28">النوع</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider w-20">العملة</th>
                <th className="text-right p-3 font-black text-[#222222] uppercase text-[10px] tracking-wider w-20">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {roots.map((a) => <AccountRow key={a.id} account={a} onAddChild={handleAddChild} />)}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <AccountDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchAccounts}
        parentAccount={parentAccount}
      />
    </div>
  );
}
