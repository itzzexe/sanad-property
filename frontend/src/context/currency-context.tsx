"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";

type Currency = "IQD" | "USD";

interface CurrencyContextType {
  displayCurrency: Currency;
  exchangeRate: number; // 1 USD = X IQD
  setDisplayCurrency: (currency: Currency) => void;
  convert: (amount: number, from: Currency, to: Currency) => number;
  format: (amount: number, currency?: Currency) => string;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("IQD");
  const [exchangeRate, setExchangeRate] = useState(1460);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      if (typeof window === 'undefined' || window.location.pathname.includes('/login')) {
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/settings");
        if (res?.data) {
          setExchangeRate(res.data.exchangeRateUSD || 1460);
          setDisplayCurrency(res.data.defaultCurrency || "IQD");
        }
      } catch (err) {
        // Silently fail for currency settings to avoid console noise if unauthorized
        console.debug("Currency settings not available (might be logged out)");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const convert = (amount: number, from: Currency, to: Currency) => {
    if (from === to) return amount;
    if (from === "USD" && to === "IQD") return amount * exchangeRate;
    if (from === "IQD" && to === "USD") return amount / exchangeRate;
    return amount;
  };

  const format = (amount: number, currency?: Currency) => {
    const targetCurrency = currency || displayCurrency;
    const locale = targetCurrency === "IQD" ? "ar-IQ" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: targetCurrency,
      minimumFractionDigits: targetCurrency === "IQD" ? 0 : 2,
    }).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{ displayCurrency, exchangeRate, setDisplayCurrency, convert, format, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
