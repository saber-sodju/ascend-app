"use client";
import { useEffect, useState } from "react";
import { goalsAPI } from "@/lib/api";
import { Goal, GoalCategory, GoalStatus } from "@/types";
import { GOAL_CATEGORIES, STATUS_CONFIG, PRIORITY_CONFIG, formatDate, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Plus, Target, Trash2, Edit3, ChevronRight, CheckCircle2,
  Circle, Calendar, Flag, Filter, X, Loader2, Check,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "not_started", label: "Не начата" },
  { value: "in_progress", label: "В процессе" },
  { value: "completed", label: "Завершена" },
  { value: "paused", label: "Приостановлена" },
];

const CATEGORY_OPTIONS = Object.entries(GOAL_CATEGORIES).map(([k, v]) => ({ value: k, label: v.label, emoji: v.emoji }));
const PRIORITIES = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
  { value: "critical", label: "Критический" },
];
const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#ef4444", "#8b5cf6", "#06b6d4"];

function GoalModal({ goal, onClose, onSave }: { goal?: Goal; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    title: goal?.title || "",
    description: goal?.description || "",
    category: goal?.category || "other" as GoalCategory,
    priority: goal?.priority || "medium",
    start_date: goal?.start_date || "",
    deadline: goal?.deadline || "",
    current_value: goal?.current_value ?? 0,
    target_value: goal?.target_value ?? "",
    unit: goal?.unit || "",
    color: goal?.color || "#6366f1",
    emoji: goal?.emoji || "",
    status: goal?.status || "not_started",
  });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!form.title.trim()) { toast.error("Введите название"); return; }
    setLoading(true);
    const payload = { ...form, target_value: form.target_value === "" ? null : Number(form.target_value) };
    try {
      if (goal) {
        await goalsAPI.update(goal.id, payload);
        toast.success("Цель обновлена");
      } else {
        await goalsAPI.create(payload);
        toast.success("Цель создана!");
      }
      onSave();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-semibold text-lg">{goal ? "Редактировать цель" : "Новая цель"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Color + Emoji */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={cn("w-6 h-6 rounded-full border-2 transition-all", form.color === c ? "border-white scale-110" : "border-transparent")} style={{ backgroundColor: c }} />
              ))}
            </div>
            <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="Эмодзи" className="w-20 px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Название цели *" className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />

          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Описание" rows={3} className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Категория</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as GoalCategory }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Приоритет</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Начало</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Дедлайн</label>
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Текущее значение</label>
              <input type="number" value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: Number(e.target.value) }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Целевое значение</label>
              <input type="number" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} placeholder="—" className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Единица</label>
              <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="кг, $, ч..." className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          {goal && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Статус</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {STATUS_OPTIONS.filter(o => o.value).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-secondary transition-colors">Отмена</button>
          <button onClick={save} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {goal ? "Сохранить" : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalCard({ goal, onEdit, onDelete, onRefresh }: { goal: Goal; onEdit: () => void; onDelete: () => void; onRefresh: () => void }) {
  const cat = GOAL_CATEGORIES[goal.category];
  const sc = STATUS_CONFIG[goal.status];
  const pc = PRIORITY_CONFIG[goal.priority];

  const toggleSubGoal = async (sgId: string, completed: boolean) => {
    await goalsAPI.updateSubGoal(goal.id, sgId, { is_completed: completed });
    onRefresh();
  };

  return (
    <div className="glass rounded-2xl p-5 card-hover group">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: `${goal.color}22` }}>
          {goal.emoji || cat?.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{goal.title}</h3>
          {goal.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{goal.description}</p>}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${sc?.bg} ${sc?.color}`}>{sc?.label}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${pc?.bg} ${pc?.color}`}>{pc?.label}</span>
            <span className="text-[10px] text-muted-foreground">{cat?.emoji} {cat?.label}</span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">
            {goal.target_value ? `${goal.current_value} / ${goal.target_value} ${goal.unit || ""}` : "Прогресс"}
          </span>
          <span className="font-bold">{goal.progress_percent}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${goal.progress_percent}%`, backgroundColor: goal.color }} />
        </div>
      </div>

      {/* SubGoals */}
      {goal.sub_goals.length > 0 && (
        <div className="space-y-1.5">
          {goal.sub_goals.map(sg => (
            <button key={sg.id} onClick={() => toggleSubGoal(sg.id, !sg.is_completed)} className="flex items-center gap-2 w-full text-left group/sg hover:bg-secondary/50 rounded-lg px-1 py-1 transition-colors">
              {sg.is_completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              <span className={cn("text-xs flex-1 truncate", sg.is_completed && "line-through text-muted-foreground")}>{sg.title}</span>
            </button>
          ))}
        </div>
      )}

      {goal.deadline && (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>Дедлайн: {formatDate(goal.deadline)}</span>
        </div>
      )}
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | undefined>();
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const load = async () => {
    setLoading(true);
    const params: any = {};
    if (filterStatus) params.status = filterStatus;
    if (filterCat) params.category = filterCat;
    const res = await goalsAPI.list(params);
    setGoals(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus, filterCat]);

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить цель?")) return;
    await goalsAPI.delete(id);
    toast.success("Цель удалена");
    load();
  };

  const grouped = Object.entries(GOAL_CATEGORIES).reduce((acc, [key]) => {
    const g = goals.filter(goal => goal.category === key);
    if (g.length > 0) acc[key] = g;
    return acc;
  }, {} as Record<string, Goal[]>);

  const stats = {
    total: goals.length,
    completed: goals.filter(g => g.status === "completed").length,
    in_progress: goals.filter(g => g.status === "in_progress").length,
    avg_progress: goals.length ? Math.round(goals.reduce((s, g) => s + g.progress_percent, 0) / goals.length) : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Мои цели</h1>
          <p className="text-muted-foreground text-sm mt-1">Управляй своими целями и отслеживай прогресс</p>
        </div>
        <button onClick={() => { setEditGoal(undefined); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
          <Plus className="w-4 h-4" /> Новая цель
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Всего целей", value: stats.total, color: "text-foreground" },
          { label: "Завершено", value: stats.completed, color: "text-emerald-400" },
          { label: "В процессе", value: stats.in_progress, color: "text-blue-400" },
          { label: "Средний прогресс", value: `${stats.avg_progress}%`, color: "text-indigo-400" },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">Все категории</option>
          {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
        </select>
        {(filterStatus || filterCat) && (
          <button onClick={() => { setFilterStatus(""); setFilterCat(""); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-3.5 h-3.5" /> Сбросить
          </button>
        )}
      </div>

      {/* Goals */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Target className="w-16 h-16 opacity-20 mb-4" />
          <p className="text-lg font-medium">Целей пока нет</p>
          <p className="text-sm mt-1">Создай свою первую цель</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, catGoals]) => {
            const catInfo = GOAL_CATEGORIES[cat];
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{catInfo.emoji}</span>
                  <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{catInfo.label}</h2>
                  <span className="text-xs text-muted-foreground">({catGoals.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {catGoals.map(goal => (
                    <GoalCard key={goal.id} goal={goal} onEdit={() => { setEditGoal(goal); setShowModal(true); }} onDelete={() => handleDelete(goal.id)} onRefresh={load} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && <GoalModal goal={editGoal} onClose={() => setShowModal(false)} onSave={load} />}
    </div>
  );
}
