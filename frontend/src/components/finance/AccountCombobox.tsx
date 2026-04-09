"use client";
import { useState, useEffect, useMemo } from "react";
import { financeApi, Account } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";

interface AccountComboboxProps {
  value: string;
  onChange: (accountId: string) => void;
  placeholder?: string;
  className?: string;
  filterType?: string;
}

export function AccountCombobox({ value, onChange, placeholder = "بحث عن حساب...", className, filterType }: AccountComboboxProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    financeApi.getAccounts().then(d => setAccounts(Array.isArray(d) ? d : [])).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    let list = accounts;
    if (filterType) list = list.filter(a => a.type === filterType);
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(a => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
  }, [accounts, search, filterType]);

  const selected = accounts.find(a => a.id === value);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border border-[#999999] rounded-md px-3 py-2 text-xs bg-white hover:border-[#6264A7] transition-colors"
      >
        <span className={cn(selected ? "text-[#242424] font-bold" : "text-[#999999]")}>
          {selected ? `${selected.code} — ${selected.name}` : placeholder}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#999999]" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#999999] rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-[#EBEBEB]">
            <div className="relative">
              <Search className="absolute right-2.5 top-2 w-3.5 h-3.5 text-[#999999]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالرمز أو الاسم..."
                className="w-full pr-8 pl-3 py-1.5 text-xs border border-[#EBEBEB] rounded focus:outline-none focus:border-[#6264A7]"
                autoFocus
                data-testid="account-search-input"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => { onChange(a.id); setOpen(false); setSearch(''); }}
                className={cn(
                  "w-full text-right px-3 py-2 text-xs hover:bg-[#F5F5F5] transition-colors flex items-center gap-2",
                  a.id === value && "bg-[#6264A7]/5 text-[#6264A7]"
                )}
              >
                <span className="font-mono text-[#666666] min-w-[40px]">{a.code}</span>
                <span className="font-bold">{a.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="p-4 text-center text-[#999999] text-xs">لا توجد نتائج</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
