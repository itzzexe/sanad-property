"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Info, AlertTriangle, CreditCard, CalendarClock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      const res = await api.get("/notifications?limit=5");
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  }

  async function markAsRead(id: string) {
    try {
      await api.post(`/notifications/${id}/read`);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  async function markAllAsRead() {
    try {
      await api.post("/notifications/read-all");
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "PAYMENT_DUE": return <CreditCard className="w-4 h-4 text-blue-500" />;
      case "PAYMENT_OVERDUE": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "LEASE_EXPIRING": return <CalendarClock className="w-4 h-4 text-amber-500" />;
      case "MAINTENANCE": return <Info className="w-4 h-4 text-violet-500" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold shadow-sm animate-pulse">
              {unreadCount > 9 ? "+9" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-0 overflow-hidden border shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
          <DropdownMenuLabel className="font-bold text-base p-0 text-foreground">الإشعارات</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-[10px] px-2 hover:bg-background text-primary font-bold">
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">لا توجد إشعارات حالياً</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className={cn(
                  "p-4 cursor-pointer focus:bg-muted/50 flex flex-col items-start gap-1 border-b last:border-0",
                  !notif.isRead && "bg-primary/[0.03]"
                )}
                onClick={() => !notif.isRead && markAsRead(notif.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-0.5 shrink-0 bg-muted/30 p-2 rounded-lg">{getIcon(notif.type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                       <p className={cn("text-sm font-bold leading-tight", !notif.isRead ? "text-primary" : "text-foreground")}>
                         {notif.title}
                       </p>
                       <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                         {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ar })}
                       </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <div className="p-2 bg-muted/30">
            <Button variant="ghost" className="w-full h-9 text-xs font-bold hover:bg-background transition-all">
              عرض كافة الإشعارات
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
