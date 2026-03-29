"use client";

import { useState, useEffect } from "react";
import { 
  Users, UserPlus, Search, Shield, ShieldCheck, Mail, Phone, 
  Trash2, ToggleRight, ToggleLeft, Loader2, AlertCircle, X, Check,
  UserCog, Filter
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const ROLE_AR = {
  ADMIN: 'مدير نظام',
  OWNER: 'شريك / مالك أسهم',
  ACCOUNTANT: 'محاسب'
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // New User Form State
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "OWNER",
    phone: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/users", newUser);
      setIsAddOpen(false);
      loadUsers();
      setNewUser({ firstName: "", lastName: "", email: "", password: "", role: "OWNER", phone: "" });
    } catch (err: any) {
      alert(err.message || "فشل إضافة المستخدم");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    try {
      await api.patch(`/users/${id}/status`, { isActive: !currentStatus });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    try {
      await api.delete(`/users/${id}`);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  }

  const filteredUsers = users.filter(u => 
    u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 page-enter p-2 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2 leading-tight">
            إدارة <span className="text-gradient-indigo">المستخدمين</span>
          </h1>
          <p className="text-slate-700 text-lg font-medium flex items-center gap-2">
            <UserCog className="w-5 h-5 text-indigo-500" />
            التحكم في صلاحيات الفريق وإدارة الوصول إلى البيانات الحساسة
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 text-white font-bold h-14 px-8 rounded-2xl shadow-lg shadow-indigo-600/20 gap-3 border-none hover:scale-105 transition-all">
                  <UserPlus className="w-5 h-5" />
                  إضافة مستخدم جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] border-none shadow-2xl bg-white rounded-[32px] overflow-hidden p-0" dir="rtl">
                 <form onSubmit={handleAddUser}>
                   <div className="p-10 space-y-8">
                     <DialogHeader className="text-right">
                       <DialogTitle className="text-3xl font-black text-slate-900 leading-tight">إضافة عضو جديد</DialogTitle>
                       <DialogDescription className="text-slate-700 font-bold">تحديد الهوية المهنية والصلاحيات التقنية للمستخدم الجديد</DialogDescription>
                     </DialogHeader>

                     <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-bold px-1">الاسم الأول</Label>
                          <Input required value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} placeholder="أحمد" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-bold px-1">اسم العائلة</Label>
                          <Input required value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} placeholder="علي" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10" />
                        </div>
                     </div>

                     <div className="space-y-2">
                       <Label className="text-slate-700 font-bold px-1">البريد الإلكتروني (اسم المستخدم)</Label>
                       <Input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="admin@sanad.com" dir="ltr" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl text-left font-mono font-bold focus:ring-indigo-500/10" />
                     </div>

                     <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-bold px-1 text-right">كلمة المرور</Label>
                          <Input type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="••••••••" dir="ltr" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl text-left font-mono focus:ring-indigo-500/10" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-slate-700 font-bold px-1 text-right">رقم الهاتف</Label>
                           <Input value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} placeholder="07XXXXXXXXX" dir="ltr" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl text-left font-mono focus:ring-indigo-500/10" />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <Label className="text-slate-700 font-bold px-1">نوع الصلاحية الإدارية</Label>
                        <Select value={newUser.role} onValueChange={v => setNewUser({...newUser, role: v})} dir="rtl">
                          <SelectTrigger className="h-14 bg-slate-50/50 border-slate-100 rounded-xl font-bold focus:ring-indigo-500/10">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-100 rounded-xl shadow-xl" dir="rtl">
                             <SelectItem value="ADMIN" className="font-bold py-3"><div className="flex items-center gap-2 text-indigo-600"><ShieldCheck className="w-4 h-4" /> مدير نظام</div></SelectItem>
                             <SelectItem value="OWNER" className="font-bold py-3">مالك عقار</SelectItem>
                             <SelectItem value="ACCOUNTANT" className="font-bold py-3">محاسب</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                   </div>

                   <DialogFooter className="p-10 bg-slate-50 flex gap-4 mt-6">
                      <Button variant="ghost" type="button" onClick={() => setIsAddOpen(false)} className="flex-1 font-bold h-12 text-slate-600 rounded-xl">إلغاء</Button>
                      <Button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 font-black rounded-xl h-12 shadow-lg shadow-indigo-600/20">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 mr-2" />}
                        تأكيد الإضافة
                      </Button>
                   </DialogFooter>
                 </form>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-end">
        <div className="relative flex-1 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            placeholder="بحث عن مستخدم بالاسم أو البريد..." 
            className="w-full pr-12 h-14 bg-white border border-slate-100 shadow-premium rounded-2xl text-lg font-bold placeholder:text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <Card className="border-none shadow-premium bg-white rounded-[32px] overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="text-right py-6 text-slate-900 font-black">المستخدم</TableHead>
              <TableHead className="text-center py-6 text-slate-900 font-black">الصلاحية</TableHead>
              <TableHead className="text-right py-6 text-slate-900 font-black">التواصل</TableHead>
              <TableHead className="text-right py-6 text-slate-900 font-black">تاريخ الانضمام</TableHead>
              <TableHead className="text-center py-6 text-slate-900 font-black">الحالة</TableHead>
              <TableHead className="text-left py-6 text-slate-900 font-black pl-8">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-20 animate-pulse bg-slate-50/20" />
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center text-slate-600 italic">لا يوجد مستخدمين حالياً</TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/40 transition-colors border-slate-50 group">
                  <TableCell className="py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        {user.firstName[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-base group-hover:text-indigo-600 transition-colors">{user.firstName} {user.lastName}</p>
                        <p className="text-[10px] text-slate-600 font-bold flex items-center gap-1 mt-0.5">
                           <Shield className="w-3 h-3 text-indigo-400" />
                           ID: {user.id.split('-')[0].toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                     <Badge className={cn(
                       "px-4 py-1.5 font-bold text-[10px] uppercase rounded-xl border-none shadow-none",
                       user.role === 'ADMIN' ? "bg-slate-900 text-white" : 
                       user.role === 'ACCOUNTANT' ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"
                     )}>
                        {ROLE_AR[user.role as keyof typeof ROLE_AR] || user.role}
                     </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-700 font-bold">
                        <Mail className="w-3 h-3 text-indigo-400" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-700 font-mono font-bold">
                          <Phone className="w-3 h-3 text-indigo-400" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-bold">
                     {new Date(user.createdAt).toLocaleDateString('ar-IQ')}
                  </TableCell>
                  <TableCell className="text-center">
                     <Badge className={cn(
                       "rounded-full px-5 h-8 font-black text-[9px] items-center gap-2 border-none shadow-none",
                       user.isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                     )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", user.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                        {user.isActive ? 'حساب نشط' : 'معطل مؤقتاً'}
                     </Badge>
                  </TableCell>
                  <TableCell className="pl-8 text-left">
                     <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleStatus(user.id, user.isActive)}
                          className={cn(
                            "h-10 w-10 rounded-xl transition-all",
                            user.isActive ? "text-rose-600 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50"
                          )}
                        >
                           {user.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteUser(user.id)}
                          className="h-10 w-10 rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all"
                        >
                           <Trash2 className="w-5 h-5" />
                        </Button>
                     </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
