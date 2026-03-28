import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "رينت فلو – نظام متطور لإدارة الإيجارات",
  description: "إدارة العقارات، المستأجرين، العقود، والمدفوعات بسهولة وبساطة.",
};

import { CurrencyProvider } from "@/context/currency-context";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body>
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
      </body>
    </html>
  );
}
