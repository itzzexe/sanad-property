"use client";
import { useState, useEffect } from "react";

export type UserRole = 'ADMIN' | 'ACCOUNTANT' | 'OWNER';

export function useRole(): { role: UserRole; isAdmin: boolean; isAccountant: boolean; isOwner: boolean; canWrite: boolean; canClose: boolean } {
  const [role, setRole] = useState<UserRole>('OWNER');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setRole(user.role || 'OWNER');
        } catch { /* ignore */ }
      }
    }
  }, []);

  return {
    role,
    isAdmin: role === 'ADMIN',
    isAccountant: role === 'ACCOUNTANT',
    isOwner: role === 'OWNER',
    canWrite: role === 'ADMIN' || role === 'ACCOUNTANT',
    canClose: role === 'ADMIN',
  };
}
