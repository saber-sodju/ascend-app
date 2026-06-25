"use client";
import { useEffect, useState } from "react";
import { healthAPI, authAPI } from "@/lib/api";
import { WeightLog, HealthLog, ActivityLog } from "@/types";
import { formatDateShort, todayStr, ACTIVITY_TYPES } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import { Scale, Droplets, Moon, Zap, Plus, Trash2, X, Loader2, Check, Activity, Target, TrendingDown, TrendingUp, Edit2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function WeightGoalCard({ summary, weightLogs, onUpdate }: { summary: any; weightLogs: WeightLog[]; onUpdate: () => void }) {
  const { updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [saving, setSaving] = useState(false);

  const currentWeight = summary?.latest_weight;
  const targetWeight = summary?.target_weight ? Number(summary.target_weight) : null;
  const startWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : currentWeight;

  const isLosing = targetWeight !== null && startWeight !== null && targetWeight < startWeight;
  const isGaining = targetWeight !== null && startWeight !== null && targetWeight > startWeight;

  let progress = 0;
  let remaining = 0;
  if (targetWeight && currentWeight && startWeight) {
    remaining = Math.abs(targetWeight - currentWeight);
    if (isLosing) {
      const total = startWeight - targetWeight;
      const done = startWeight - currentWeight;
      progress = total > 0 ? Math.min(100, Math.max(0, (done / total) * 100)) : 0;
    } else if (isGaining) {
      const total = targetWeight - startWeight;
      const done = currentWeight - startWeight;
      progress = total > 0 ? Math.min(100, Math.max(0, (done / total) * 100)) : 0;
    }
  }

  const handleSave = async () => {
    if (!targetInput) return;
    setSaving(true);
    try {
      const res = await authAPI.updateMe({ target_weight: targetInput });
      updateUser(res.data);
      toast.success("Цель установлена!");
      setEditing(false);
      onUpdate();
    } catch { toast.error("Ошибка"); }
    finally { setSaving(false); }
  };

  const progressColor = isLosing ? "#10b981" : isGaining ? "#6366f1" : "#D4A63A";
  const circumference = 2 * Math.PI * 54;
  const strokeDash = circumference - (progress / 100) * circumference;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/15">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Цель по весу</h3>
            <p className="text-xs text-muted-foreground">
              {isLosing ? "Похудеть" : isGaining ? "Набрать вес" : targetWeight ? "Поддержание" : "Цель не установлена"}
            </p>
          </div>
        </div>
        <button onClick={() => { setEditing(true); setTargetInput(targetWeight?.toString() || ""); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-secondary hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Edit2 className="w-3.5 h-3.5" />
          {targetWeight ? "Изменить цель" : "Установить цель"}
        </button>
      </div>

      {!targetWeight ? (
        <div className="flex flex-col items-center py-6 text-center gap-3">
          <Scale className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Установи целевой вес чтобы отслеживать прогресс</p>
          <button onClick={() => { setEditing(true); setTargetInput(""); }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
            Установить цель
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          {/* Circular progress */}
          <div className="relative flex-shrink-0">
            <svg width="128" height="128" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="54" fill="none" stroke="hsl(218 15% 17%)" strokeWidth="10" />
              <circle cx="64" cy="64" r="54" fill="none" stroke={progressColor} strokeWidth="10"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDash}
                transform="rotate(-90 64 64)" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{Math.round(progress)}%</span>
              <span className="text-[10px] text-muted-foreground">прогресс</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Scale className="w-3.5 h-3.5" /> Начальный вес
              </div>
              <span className="text-sm font-semibold">{startWeight} кг</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isLosing ? <TrendingDown className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />}
                Текущий вес
              </div>
              <span className="text-sm font-bold" style={{ color: progressColor }}>{currentWeight ?? "—"} кг</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="w-3.5 h-3.5 text-primary" /> Цель
              </div>
              <span className="text-sm font-semibold">{targetWeight} кг</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">Осталось</span>
              <span className="text-sm font-bold text-primary">
                {remaining > 0 ? `${remaining.toFixed(1)} кг` : "🎉 Цель достигнута!"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {targetWeight && (
        <div className="mt-4">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: progressColor }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>{startWeight} кг</span>
            <span>{targetWeight} кг</span>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Целевой вес</h2>
              <button onClick={() => setEditing(false)} className="p-1 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button onClick={() => {}} className="flex-1 py-3 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 text-emerald-400 text-sm font-medium flex items-center justify-center gap-2">
                  <TrendingDown className="w-4 h-4" /> Похудеть
                </button>
                <button onClick={() => {}} className="flex-1 py-3 rounded-xl border-2 border-indigo-500/50 bg-indigo-500/10 text-indigo-400 text-sm font-medium flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Набрать
                </button>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Целевой вес (кг)</label>
                <div className="relative">
                  <input type="number" step="0.1" value={targetInput} onChange={e => setTargetInput(e.target.value)}
                    placeholder="70.0" className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">кг</span>
                </div>
                {currentWeight && targetInput && (
                  <p className="text-xs text-muted-foreground mt-1.5 text-center">
                    {Number(targetInput) < currentWeight
                      ? `Похудеть на ${(currentWeight - Number(targetInput)).toFixed(1)} кг`
                      : Number(targetInput) > currentWeight
                      ? `Набрать ${(Number(targetInput) - currentWeight).toFixed(1)} кг`
                      : "Поддержание текущего веса"}
                  </p>
                )}
              </div>
            </div>
            <button onClick={handleSave} disabled={saving || !targetInput}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Сохранить цель"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickLog({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({ sleep_hours: "", water_ml: "", energy_level: "" });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await healthAPI.upsertHealthLog({
        date: todayStr(),
        sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null,
        water_ml: form.water_ml ? Number(form.water_ml) : null,
        energy_level: form.energy_level ? Number(form.energy_level) : null,
      });
      toast.success("Данные сохранены!");
      onSave();
    } catch { toast.error("Ошибка"); }
    finally { setLoading(false); }
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="font-semibold mb-4">Быстрая запись — Сегодня</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground mb-2"><Moon className="w-3.5 h-3.5 text-purple-400" /> Сон (часов)</label>
          <input type="number" step="0.5" min="0" max="24" value={form.sleep_hours} onChange={e => setForm(f => ({ ...f, sleep_hours: e.target.value }))} placeholder="7.5" className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground mb-2"><Droplets className="w-3.5 h-3.5 text-blue-400" /> Вода (мл)</label>
          <input type="number" min="0" value={form.water_ml} onChange={e => setForm(f => ({ ...f, water_ml: e.target.value }))} placeholder="2000" className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground mb-2"><Zap className="w-3.5 h-3.5 text-yellow-400" /> Энергия (1-10)</label>
          <input type="number" min="1" max="10" value={form.energy_level} onChange={e => setForm(f => ({ ...f, energy_level: e.target.value }))} placeholder="7" className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>
      <button onClick={save} disabled={loading} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Сохранить
      </button>
    </div>
  );
}

function WeightModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!weight) { toast.error("Введите вес"); return; }
    setLoading(true);
    try {
      await healthAPI.createWeight({ weight: Number(weight), date, notes });
      toast.success("Вес записан!");
      onSave(); onClose();
    } catch { toast.error("Ошибка"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-semibold">Записать вес</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="relative">
            <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="75.0" className="w-full px-4 py-4 bg-secondary border border-border rounded-xl text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">кг</span>
          </div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Заметки" className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-secondary">Отмена</button>
          <button onClick={save} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Записать
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ type: "running", date: todayStr(), duration: "", distance: "", calories: "", notes: "" });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await healthAPI.createActivity({ ...form, duration: form.duration ? Number(form.duration) : null, distance: form.distance ? Number(form.distance) : null, calories: form.calories ? Number(form.calories) : null });
      toast.success("Активность записана!");
      onSave(); onClose();
    } catch { toast.error("Ошибка"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-semibold">Записать активность</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-2 flex-wrap">
            {ACTIVITY_TYPES.map(a => (
              <button key={a.value} onClick={() => setForm(f => ({ ...f, type: a.value }))} className={`flex flex-col items-center gap-1 p-3 rounded-xl text-sm transition-all ${form.type === a.value ? "bg-primary/20 ring-2 ring-primary text-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                <span className="text-xl">{a.emoji}</span>
                <span className="text-[10px]">{a.label}</span>
              </button>
            ))}
          </div>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Время (мин)</label>
              <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="30" className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Дист. (км)</label>
              <input type="number" step="0.1" value={form.distance} onChange={e => setForm(f => ({ ...f, distance: e.target.value }))} placeholder="5.0" className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Калории</label>
              <input type="number" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} placeholder="300" className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Заметки" className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-secondary">Отмена</button>
          <button onClick={save} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Записать
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HealthPage() {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

  const load = async () => {
    setLoading(true);
    const [wRes, hRes, aRes, sRes] = await Promise.all([
      healthAPI.listWeight(60),
      healthAPI.getHealthLogs(30),
      healthAPI.listActivities(20),
      healthAPI.getSummary(),
    ]);
    setWeightLogs(wRes.data);
    setHealthLogs(hRes.data);
    setActivities(aRes.data);
    setSummary(sRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const weightChartData = [...weightLogs].reverse().map(w => ({ date: formatDateShort(w.date), weight: w.weight }));
  const sleepChartData = [...healthLogs].reverse().filter(l => l.sleep_hours).map(l => ({ date: formatDateShort(l.date), sleep: l.sleep_hours }));
  const waterChartData = [...healthLogs].reverse().filter(l => l.water_ml).map(l => ({ date: formatDateShort(l.date), water: l.water_ml }));

  const activityEmoji = (type: string) => ACTIVITY_TYPES.find(a => a.value === type)?.emoji || "🏃";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Здоровье</h1>
          <p className="text-muted-foreground text-sm mt-1">Отслеживай своё здоровье и активность</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowWeightModal(true)} className="flex items-center gap-2 px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
            <Scale className="w-4 h-4" /> Вес
          </button>
          <button onClick={() => setShowActivityModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
            <Plus className="w-4 h-4" /> Активность
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Текущий вес", value: summary.latest_weight ? `${summary.latest_weight} кг` : "—", icon: Scale, color: "text-orange-400", bg: "bg-orange-500/15" },
            { label: "Средний вес", value: summary.avg_weight_week ? `${summary.avg_weight_week} кг` : "—", icon: Scale, color: "text-yellow-400", bg: "bg-yellow-500/15" },
            { label: "Цель", value: summary.target_weight ? `${summary.target_weight} кг` : "—", icon: Scale, color: "text-indigo-400", bg: "bg-indigo-500/15" },
            { label: "Сред. сон", value: summary.avg_sleep ? `${summary.avg_sleep} ч` : "—", icon: Moon, color: "text-purple-400", bg: "bg-purple-500/15" },
            { label: "Вода/день", value: summary.avg_water ? `${summary.avg_water} мл` : "—", icon: Droplets, color: "text-blue-400", bg: "bg-blue-500/15" },
            { label: "Энергия", value: summary.avg_energy ? `${summary.avg_energy}/10` : "—", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/15" },
          ].map(s => (
            <div key={s.label} className="glass rounded-xl p-4 text-center">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Weight Goal */}
      {summary && <WeightGoalCard summary={summary} weightLogs={weightLogs} onUpdate={load} />}

      {/* Quick log */}
      <QuickLog onSave={load} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight chart */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">График веса</h3>
            <span className="text-xs text-muted-foreground">60 дней</span>
          </div>
          {weightChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weightChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5.9% 14%)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(240 5% 55%)" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "hsl(240 10% 7%)", border: "1px solid hsl(240 5.9% 14%)", borderRadius: "0.75rem", fontSize: 12 }} formatter={(v: any) => [`${v} кг`, "Вес"]} />
                <Area type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2} fill="url(#wGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-44 text-muted-foreground text-sm">Нет данных о весе</div>}
        </div>

        {/* Sleep chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Сон (часов)</h3>
          {sleepChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={sleepChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5.9% 14%)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(240 5% 55%)" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} domain={[0, 12]} />
                <Tooltip contentStyle={{ background: "hsl(240 10% 7%)", border: "1px solid hsl(240 5.9% 14%)", borderRadius: "0.75rem", fontSize: 12 }} formatter={(v: any) => [`${v} ч`, "Сон"]} />
                <Area type="monotone" dataKey="sleep" stroke="#8b5cf6" strokeWidth={2} fill="url(#sGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-44 text-muted-foreground text-sm">Нет данных о сне</div>}
        </div>
      </div>

      {/* Water chart */}
      {waterChartData.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Потребление воды (мл)</h3>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={waterChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="watGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5.9% 14%)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(240 5% 55%)" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} />
              <Tooltip contentStyle={{ background: "hsl(240 10% 7%)", border: "1px solid hsl(240 5.9% 14%)", borderRadius: "0.75rem", fontSize: 12 }} formatter={(v: any) => [`${v} мл`, "Вода"]} />
              <Area type="monotone" dataKey="water" stroke="#06b6d4" strokeWidth={2} fill="url(#watGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Activities */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Последние тренировки</h3>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Нет записей активности</div>
        ) : (
          <div className="space-y-2">
            {activities.map(a => {
              const at = ACTIVITY_TYPES.find(t => t.value === a.type);
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors group">
                  <span className="text-2xl">{activityEmoji(a.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{at?.label || a.type}</p>
                    <div className="flex gap-3 mt-0.5">
                      {a.duration && <span className="text-[10px] text-muted-foreground">{a.duration} мин</span>}
                      {a.distance && <span className="text-[10px] text-muted-foreground">{a.distance} км</span>}
                      {a.calories && <span className="text-[10px] text-muted-foreground">{a.calories} ккал</span>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDateShort(a.date)}</span>
                  <button onClick={async () => { await healthAPI.deleteActivity(a.id); load(); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent weight */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4">История веса</h3>
        <div className="space-y-2">
          {weightLogs.slice(0, 10).map((w, i) => (
            <div key={w.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors group">
              <div className="flex items-center gap-3">
                <Scale className="w-4 h-4 text-orange-400" />
                <div>
                  <p className="text-sm font-bold">{w.weight} кг</p>
                  {w.notes && <p className="text-[10px] text-muted-foreground">{w.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {i > 0 && weightLogs[i - 1] && (
                  <span className={`text-xs font-medium ${w.weight < weightLogs[i - 1].weight ? "text-emerald-400" : w.weight > weightLogs[i - 1].weight ? "text-red-400" : "text-muted-foreground"}`}>
                    {w.weight < weightLogs[i - 1].weight ? "▼" : w.weight > weightLogs[i - 1].weight ? "▲" : "→"}{" "}
                    {Math.abs(w.weight - weightLogs[i - 1].weight).toFixed(1)}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{formatDateShort(w.date)}</span>
                <button onClick={async () => { await healthAPI.deleteWeight(w.id); load(); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showWeightModal && <WeightModal onClose={() => setShowWeightModal(false)} onSave={load} />}
      {showActivityModal && <ActivityModal onClose={() => setShowActivityModal(false)} onSave={load} />}
    </div>
  );
}
