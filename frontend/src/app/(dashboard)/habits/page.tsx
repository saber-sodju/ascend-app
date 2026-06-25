"use client";
import { useEffect, useState } from "react";
import { habitsAPI } from "@/lib/api";
import { Habit } from "@/types";
import { todayStr, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { Plus, Flame, Check, X, Loader2, Edit3, Trash2, Calendar, TrendingUp } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

const ICONS = ["⭐", "💪", "📚", "🏃", "🧘", "💧", "🛌", "🎯", "🥗", "☀️", "🧠", "💊", "✍️", "🎵", "🙏"];
const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

function MiniCalendar({ logs }: { logs: Habit["logs"] }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
    const log = logs.find(l => l.date === d);
    return { date: d, completed: log?.completed || false };
  });
  return (
    <div className="flex gap-0.5 mt-2">
      {days.map(d => (
        <div key={d.date} title={d.date} className={cn("flex-1 h-4 rounded-sm", d.completed ? "bg-current opacity-80" : "bg-secondary")} />
      ))}
    </div>
  );
}

function HabitModal({ habit, onClose, onSave }: { habit?: Habit; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    title: habit?.title || "",
    description: habit?.description || "",
    icon: habit?.icon || "⭐",
    color: habit?.color || "#6366f1",
    target_value: habit?.target_value ?? 1,
    unit: habit?.unit || "",
    frequency: habit?.frequency || "daily",
    reminder_time: habit?.reminder_time || "",
  });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!form.title.trim()) { toast.error("Введите название"); return; }
    setLoading(true);
    try {
      if (habit) { await habitsAPI.update(habit.id, form); toast.success("Привычка обновлена"); }
      else { await habitsAPI.create(form); toast.success("Привычка создана!"); }
      onSave(); onClose();
    } catch (e: any) { toast.error(e.response?.data?.detail || "Ошибка"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-semibold text-lg">{habit ? "Редактировать" : "Новая привычка"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Icon + Color */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Иконка</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))} className={cn("w-9 h-9 rounded-xl text-lg transition-all flex items-center justify-center", form.icon === ic ? "bg-primary/20 ring-2 ring-primary" : "bg-secondary hover:bg-muted")}>
                  {ic}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap mt-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={cn("w-6 h-6 rounded-full border-2 transition-all", form.color === c ? "border-white scale-110" : "border-transparent")} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Название привычки *" className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Описание (необязательно)" rows={2} className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Цель</label>
              <input type="number" min={1} value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: Number(e.target.value) }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Единица</label>
              <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="раз, ч, мл..." className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Частота</label>
              <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as any }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="daily">Ежедневно</option>
                <option value="weekly">Еженедельно</option>
                <option value="monthly">Ежемесячно</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Напоминание</label>
              <input type="time" value={form.reminder_time} onChange={e => setForm(f => ({ ...f, reminder_time: e.target.value }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-secondary transition-colors">Отмена</button>
          <button onClick={save} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {habit ? "Сохранить" : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HabitCard({ habit, todayCompleted, onToggle, onEdit, onDelete }: {
  habit: Habit; todayCompleted: boolean;
  onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className={cn("glass rounded-2xl p-5 card-hover group border", todayCompleted ? "border-emerald-500/30" : "border-transparent")}>
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={onToggle}
          className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all shadow-sm flex-shrink-0", todayCompleted ? "ring-2 ring-offset-1 ring-offset-background scale-110" : "hover:scale-105")}
          style={{ backgroundColor: `${habit.color}22`, ringColor: habit.color }}
        >
          {habit.icon}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{habit.title}</h3>
            {todayCompleted && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
          </div>
          {habit.description && <p className="text-[10px] text-muted-foreground truncate">{habit.description}</p>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><Edit3 className="w-3 h-3" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div>
          <div className="flex items-center justify-center gap-1 text-orange-400">
            <Flame className="w-3.5 h-3.5" />
            <span className="text-sm font-bold">{habit.current_streak}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Серия</p>
        </div>
        <div>
          <p className="text-sm font-bold">{habit.longest_streak}</p>
          <p className="text-[10px] text-muted-foreground">Рекорд</p>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: habit.color }}>{habit.completion_rate}%</p>
          <p className="text-[10px] text-muted-foreground">За 30 дней</p>
        </div>
      </div>

      <div style={{ color: habit.color }}>
        <MiniCalendar logs={habit.logs} />
      </div>

      {!todayCompleted && (
        <button
          onClick={onToggle}
          className="w-full mt-3 py-2 rounded-xl text-xs font-medium border border-dashed transition-all hover:border-solid"
          style={{ borderColor: habit.color, color: habit.color, backgroundColor: `${habit.color}10` }}
        >
          Отметить выполненной
        </button>
      )}
    </div>
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | undefined>();
  const today = todayStr();

  const load = async () => {
    setLoading(true);
    const res = await habitsAPI.list(false);
    setHabits(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (habit: Habit) => {
    const isCompleted = habit.logs.some(l => l.date === today && l.completed);
    await habitsAPI.toggle(habit.id, { date: today, completed: !isCompleted });
    load();
    if (!isCompleted) toast.success(`${habit.icon} ${habit.title} — выполнено!`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить привычку?")) return;
    await habitsAPI.delete(id);
    toast.success("Привычка удалена");
    load();
  };

  const todayDate = format(new Date(), "EEEE, d MMMM", { locale: ru });
  const activeHabits = habits.filter(h => h.is_active);
  const completedToday = activeHabits.filter(h => h.logs.some(l => l.date === today && l.completed)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Привычки</h1>
          <p className="text-muted-foreground text-sm mt-1 capitalize">{todayDate}</p>
        </div>
        <button onClick={() => { setEditHabit(undefined); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
          <Plus className="w-4 h-4" /> Новая
        </button>
      </div>

      {/* Today progress */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Прогресс сегодня</p>
            <p className="text-3xl font-bold mt-0.5">{completedToday}<span className="text-muted-foreground text-lg">/{activeHabits.length}</span></p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold gradient-text">{activeHabits.length > 0 ? Math.round(completedToday / activeHabits.length * 100) : 0}%</p>
            <p className="text-xs text-muted-foreground">выполнено</p>
          </div>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000" style={{ width: `${activeHabits.length > 0 ? (completedToday / activeHabits.length) * 100 : 0}%` }} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <span className="text-5xl mb-4">⭐</span>
          <p className="text-lg font-medium">Нет привычек</p>
          <p className="text-sm mt-1">Создай свою первую привычку</p>
        </div>
      ) : (
        <>
          {/* Active */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Активные ({activeHabits.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeHabits.map(h => (
                <HabitCard
                  key={h.id} habit={h}
                  todayCompleted={h.logs.some(l => l.date === today && l.completed)}
                  onToggle={() => handleToggle(h)}
                  onEdit={() => { setEditHabit(h); setShowModal(true); }}
                  onDelete={() => handleDelete(h.id)}
                />
              ))}
            </div>
          </div>
          {/* Inactive */}
          {habits.filter(h => !h.is_active).length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Архив</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-50">
                {habits.filter(h => !h.is_active).map(h => (
                  <HabitCard key={h.id} habit={h} todayCompleted={false} onToggle={() => {}} onEdit={() => { setEditHabit(h); setShowModal(true); }} onDelete={() => handleDelete(h.id)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showModal && <HabitModal habit={editHabit} onClose={() => setShowModal(false)} onSave={load} />}
    </div>
  );
}
