"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function ArAgingRedirectPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/finance/reports/ar-aging"); }, [router]);
  return null;
}
