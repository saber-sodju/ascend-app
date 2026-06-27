"use client";
import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { authAPI, clearAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { User, Lock, Palette, Download, Upload, Loader2, Check, Moon, Sun, Scale, AlertTriangle, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || "", target_weight: "", language: user?.language || "ru" });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [theme, setTheme] = useState(user?.theme || "dark");
  const [saving, setSaving] = useState<string | null>(null);

  const saveProfile = async () => {
    setSaving("profile");
    try {
      const res = await authAPI.updateMe({ full_name: profileForm.full_name, target_weight: profileForm.target_weight || null, language: profileForm.language });
      updateUser(res.data);
      toast.success("Профиль обновлён");
    } catch { toast.error("Ошибка"); }
    finally { setSaving(null); }
  };

  const savePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) { toast.error("Пароли не совпадают"); return; }
    if (passwordForm.new_password.length < 6) { toast.error("Минимум 6 символов"); return; }
    setSaving("password");
    try {
      await authAPI.changePassword({ current_password: passwordForm.current_password, new_password: passwordForm.new_password });
      toast.success("Пароль изменён");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (e: any) { toast.error(e.response?.data?.detail || "Ошибка"); }
    finally { setSaving(null); }
  };

  const saveTheme = async (t: string) => {
    setTheme(t);
    try {
      const res = await authAPI.updateMe({ theme: t });
      updateUser(res.data);
      toast.success(`Тема: ${t === "dark" ? "тёмная" : "светлая"}`);
    } catch { toast.error("Ошибка"); }
  };

  const exportData = () => {
    toast.success("Экспорт данных скоро будет доступен");
  };

  const handleClear = async (label: string, fn: () => Promise<any>) => {
    if (!confirm(`Удалить все данные раздела "${label}"? Это действие необратимо!`)) return;
    try {
      await fn();
      toast.success(`${label} — данные очищены`);
    } catch { toast.error("Ошибка при очистке"); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="text-muted-foreground text-sm mt-1">Управляй своим аккаунтом и предпочтениями</p>
      </div>

      {/* Profile */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-500/15"><User className="w-5 h-5 text-indigo-400" /></div>
          <div>
            <h3 className="font-semibold">Профиль</h3>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Полное имя</label>
            <input value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Введи своё имя" className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Целевой вес (кг)</label>
            <div className="relative">
              <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="number" step="0.1" value={profileForm.target_weight} onChange={e => setProfileForm(f => ({ ...f, target_weight: e.target.value }))} placeholder="75.0" className="w-full pl-9 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Язык</label>
            <select value={profileForm.language} onChange={e => setProfileForm(f => ({ ...f, language: e.target.value }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="ru">🇷🇺 Русский</option>
              <option value="en">🇺🇸 English</option>
            </select>
          </div>
          <button onClick={saveProfile} disabled={saving === "profile"} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {saving === "profile" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Сохранить
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-yellow-500/15"><Palette className="w-5 h-5 text-yellow-400" /></div>
          <h3 className="font-semibold">Внешний вид</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => saveTheme("dark")}
            className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${theme === "dark" ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/30"}`}
          >
            <Moon className="w-6 h-6 text-indigo-400" />
            <span className="text-sm font-medium">Тёмная</span>
            {theme === "dark" && <span className="text-[10px] text-primary">✓ Активна</span>}
          </button>
          <button
            onClick={() => saveTheme("light")}
            className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${theme === "light" ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/30"}`}
          >
            <Sun className="w-6 h-6 text-yellow-400" />
            <span className="text-sm font-medium">Светлая</span>
            {theme === "light" && <span className="text-[10px] text-primary">✓ Активна</span>}
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-red-500/15"><Lock className="w-5 h-5 text-red-400" /></div>
          <h3 className="font-semibold">Изменить пароль</h3>
        </div>
        <div className="space-y-4">
          <input type="password" value={passwordForm.current_password} onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))} placeholder="Текущий пароль" className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <input type="password" value={passwordForm.new_password} onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))} placeholder="Новый пароль (мин. 6 символов)" className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <input type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))} placeholder="Подтверди новый пароль" className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={savePassword} disabled={saving === "password"} className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50">
            {saving === "password" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Изменить пароль
          </button>
        </div>
      </div>

      {/* Data */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-emerald-500/15"><Download className="w-5 h-5 text-emerald-400" /></div>
          <h3 className="font-semibold">Данные</h3>
        </div>
        <div className="flex gap-3">
          <button onClick={exportData} className="flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm hover:bg-muted transition-colors">
            <Download className="w-4 h-4" /> Экспорт JSON
          </button>
          <button onClick={exportData} className="flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm hover:bg-muted transition-colors">
            <Upload className="w-4 h-4" /> Импорт
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Экспортируй все данные для резервного копирования</p>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl p-6 border border-red-500/30 bg-red-500/5">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-red-500/15"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
          <div>
            <h3 className="font-semibold text-red-400">Опасная зона</h3>
            <p className="text-xs text-muted-foreground">Эти действия необратимы — данные нельзя восстановить</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Цели", fn: clearAPI.goals },
            { label: "Задачи", fn: clearAPI.tasks },
            { label: "Привычки", fn: clearAPI.habits },
            { label: "Финансы", fn: clearAPI.finance },
            { label: "Здоровье", fn: clearAPI.health },
            { label: "Дневник", fn: clearAPI.journal },
          ].map(({ label, fn }) => (
            <button key={label} onClick={() => handleClear(label, fn)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-4 h-4" /> Очистить {label}
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-red-500/20">
          <button onClick={async () => {
            if (!confirm("УДАЛИТЬ ВСЕ ДАННЫЕ? Цели, задачи, привычки, финансы, здоровье, дневник — всё будет стёрто!")) return;
            if (!confirm("Последнее предупреждение! Восстановить данные будет невозможно. Продолжить?")) return;
            try {
              await Promise.all([clearAPI.goals(), clearAPI.tasks(), clearAPI.habits(), clearAPI.finance(), clearAPI.health(), clearAPI.journal()]);
              toast.success("Все данные очищены");
            } catch { toast.error("Ошибка"); }
          }} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors">
            <Trash2 className="w-4 h-4" /> Сбросить все данные
          </button>
        </div>
      </div>

      {/* About */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-3">О приложении</h3>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Life Manager v1.0.0</p>
          <p>Персональная система управления жизнью</p>
          <p className="text-xs mt-2">Пользователь: <span className="text-foreground">{user?.username}</span></p>
          <p className="text-xs">Email: <span className="text-foreground">{user?.email}</span></p>
          <p className="text-xs">Зарегистрирован: <span className="text-foreground">{user?.created_at ? new Date(user.created_at).toLocaleDateString("ru") : "—"}</span></p>
        </div>
      </div>
    </div>
  );
}
