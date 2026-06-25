"use client";
import { useEffect, useState } from "react";
import { usersAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import { Plus, Trash2, KeyRound, UserCheck, UserX, Loader2, X, Shield } from "lucide-react";

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export default function UsersPage() {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showPassword, setShowPassword] = useState<User | null>(null);
  const [form, setForm] = useState({ email: "", username: "", full_name: "", password: "" });
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await usersAPI.list();
      setUsers(res.data);
    } catch {
      toast.error("Нет прав или ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.email || !form.username || !form.password) return toast.error("Заполни все поля");
    setSaving(true);
    try {
      await usersAPI.create(form);
      toast.success("Пользователь создан");
      setShowCreate(false);
      setForm({ email: "", username: "", full_name: "", password: "" });
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Ошибка создания");
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await usersAPI.update(user.id, { is_active: !user.is_active });
      toast.success(user.is_active ? "Пользователь деактивирован" : "Пользователь активирован");
      load();
    } catch { toast.error("Ошибка"); }
  };

  const handleResetPassword = async () => {
    if (!showPassword || !newPassword) return;
    setSaving(true);
    try {
      await usersAPI.update(showPassword.id, { new_password: newPassword });
      toast.success("Пароль изменён");
      setShowPassword(null);
      setNewPassword("");
    } catch { toast.error("Ошибка смены пароля"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Удалить пользователя ${user.username}?`)) return;
    try {
      await usersAPI.delete(user.id);
      toast.success("Пользователь удалён");
      load();
    } catch (e: any) { toast.error(e.response?.data?.detail || "Ошибка"); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Управление пользователями</h1>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </div>

      <div className="space-y-3">
        {users.map(user => (
          <div key={user.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                {(user.full_name || user.username)[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{user.full_name || user.username}</span>
                  {user.is_admin && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Админ</span>}
                  {!user.is_active && <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">Неактивен</span>}
                </div>
                <p className="text-sm text-muted-foreground truncate">{user.email} · @{user.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => { setShowPassword(user); setNewPassword(""); }} title="Сменить пароль"
                className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <KeyRound className="w-4 h-4" />
              </button>
              {user.id !== me?.id && (
                <>
                  <button onClick={() => handleToggleActive(user)} title={user.is_active ? "Деактивировать" : "Активировать"}
                    className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                    {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(user)} title="Удалить"
                    className="p-2 rounded-xl hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Новый пользователь</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            {[
              { key: "email", label: "Email", type: "email" },
              { key: "username", label: "Username", type: "text" },
              { key: "full_name", label: "Полное имя (необязательно)", type: "text" },
              { key: "password", label: "Пароль", type: "password" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
                <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            ))}
            <button onClick={handleCreate} disabled={saving}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Создать"}
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Сменить пароль</h2>
              <button onClick={() => setShowPassword(null)} className="p-1 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-muted-foreground">Пользователь: <span className="text-foreground font-medium">@{showPassword.username}</span></p>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Новый пароль</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button onClick={handleResetPassword} disabled={saving || !newPassword}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Сохранить"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
