"use client";
import { useEffect, useState } from "react";
import { journalAPI } from "@/lib/api";
import { JournalEntry } from "@/types";
import { formatDate, todayStr, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { Plus, Search, Trash2, Edit3, X, Loader2, Check, BookOpen, Smile, Zap, TrendingUp, Tag } from "lucide-react";

function ScoreSlider({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold" style={{ color }}>{value}/10</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-current" style={{ accentColor: color }} />
    </div>
  );
}

function JournalModal({ entry, onClose, onSave }: { entry?: JournalEntry; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    date: entry?.date || todayStr(),
    what_i_did: entry?.what_i_did || "",
    what_failed: entry?.what_failed || "",
    what_i_learned: entry?.what_i_learned || "",
    plan_for_tomorrow: entry?.plan_for_tomorrow || "",
    mood: entry?.mood || 7,
    energy: entry?.energy || 7,
    productivity: entry?.productivity || 7,
    tagsStr: entry?.tags.map(t => t.tag).join(", ") || "",
  });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    const payload = { ...form, tags: form.tagsStr.split(",").map(t => t.trim()).filter(Boolean) };
    const { tagsStr, ...rest } = payload;
    try {
      if (entry) { await journalAPI.update(entry.id, rest); toast.success("Запись обновлена"); }
      else { await journalAPI.create(rest); toast.success("Запись создана!"); }
      onSave(); onClose();
    } catch (e: any) { toast.error(e.response?.data?.detail || "Ошибка"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass rounded-2xl w-full max-w-2xl shadow-2xl my-4">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card/80 backdrop-blur-sm rounded-t-2xl z-10">
          <h2 className="font-semibold text-lg">{entry ? "Редактировать запись" : "Новая запись"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-5">
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="px-3 py-2 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />

          {[
            { key: "what_i_did", label: "✅ Что сделал сегодня", placeholder: "Опиши свои достижения за день..." },
            { key: "what_failed", label: "❌ Что не получилось", placeholder: "Что пошло не так? Что стоит улучшить?" },
            { key: "what_i_learned", label: "💡 Что узнал", placeholder: "Какие новые знания или инсайты получил?" },
            { key: "plan_for_tomorrow", label: "📋 План на завтра", placeholder: "Что планируешь сделать завтра?" },
          ].map(field => (
            <div key={field.key}>
              <label className="text-sm font-medium mb-2 block">{field.label}</label>
              <textarea
                value={(form as any)[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                rows={3}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          ))}

          <div className="glass rounded-xl p-4 space-y-4">
            <p className="text-sm font-semibold">Оценки дня</p>
            <ScoreSlider label="😊 Настроение" value={form.mood} onChange={v => setForm(f => ({ ...f, mood: v }))} color="#f59e0b" />
            <ScoreSlider label="⚡ Энергия" value={form.energy} onChange={v => setForm(f => ({ ...f, energy: v }))} color="#22c55e" />
            <ScoreSlider label="🎯 Продуктивность" value={form.productivity} onChange={v => setForm(f => ({ ...f, productivity: v }))} color="#6366f1" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5"><Tag className="w-3 h-3" /> Теги (через запятую)</label>
            <input value={form.tagsStr} onChange={e => setForm(f => ({ ...f, tagsStr: e.target.value }))} placeholder="учёба, спорт, работа..." className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-secondary">Отмена</button>
          <button onClick={save} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {entry ? "Сохранить" : "Записать"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MoodEmoji(score: number) {
  if (score >= 9) return "😄";
  if (score >= 7) return "😊";
  if (score >= 5) return "😐";
  if (score >= 3) return "😔";
  return "😢";
}

function EntryCard({ entry, onEdit, onDelete }: { entry: JournalEntry; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass rounded-2xl overflow-hidden card-hover group">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-5 text-left">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{entry.mood ? MoodEmoji(entry.mood) : "📔"}</div>
            <div>
              <p className="font-semibold">{formatDate(entry.date)}</p>
              {entry.what_i_did && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{entry.what_i_did}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {entry.mood && <span className="text-xs font-medium text-yellow-400">{entry.mood}/10</span>}
            {entry.productivity && <span className="text-xs font-medium text-indigo-400">{entry.productivity}/10</span>}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-secondary"><Edit3 className="w-3.5 h-3.5" /></button>
              <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
          {entry.mood && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-secondary rounded-xl">
                <p className="text-lg font-bold text-yellow-400">{entry.mood}</p>
                <p className="text-[10px] text-muted-foreground">Настроение</p>
              </div>
              <div className="text-center p-2 bg-secondary rounded-xl">
                <p className="text-lg font-bold text-emerald-400">{entry.energy || "—"}</p>
                <p className="text-[10px] text-muted-foreground">Энергия</p>
              </div>
              <div className="text-center p-2 bg-secondary rounded-xl">
                <p className="text-lg font-bold text-indigo-400">{entry.productivity || "—"}</p>
                <p className="text-[10px] text-muted-foreground">Продуктивность</p>
              </div>
            </div>
          )}
          {[
            { label: "✅ Что сделал", text: entry.what_i_did },
            { label: "❌ Что не вышло", text: entry.what_failed },
            { label: "💡 Что узнал", text: entry.what_i_learned },
            { label: "📋 План на завтра", text: entry.plan_for_tomorrow },
          ].filter(f => f.text).map(f => (
            <div key={f.label}>
              <p className="text-xs font-semibold text-muted-foreground mb-1">{f.label}</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{f.text}</p>
            </div>
          ))}
          {entry.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {entry.tags.map(t => (
                <span key={t.id} className="text-[10px] px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">#{t.tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<JournalEntry | undefined>();
  const [moodChart, setMoodChart] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const [eRes, mRes] = await Promise.all([
      journalAPI.list({ limit: 30, search }),
      journalAPI.getMoodChart(30),
    ]);
    setEntries(eRes.data);
    setMoodChart(mRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить запись?")) return;
    await journalAPI.delete(id);
    toast.success("Запись удалена");
    load();
  };

  const todayEntry = entries.find(e => e.date === todayStr());
  const avgMood = moodChart.filter(d => d.mood).length > 0 ? Math.round(moodChart.filter(d => d.mood).reduce((s, d) => s + d.mood, 0) / moodChart.filter(d => d.mood).length * 10) / 10 : null;
  const avgProductivity = moodChart.filter(d => d.productivity).length > 0 ? Math.round(moodChart.filter(d => d.productivity).reduce((s, d) => s + d.productivity, 0) / moodChart.filter(d => d.productivity).length * 10) / 10 : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Дневник</h1>
          <p className="text-muted-foreground text-sm mt-1">Рефлексия и ежедневные записи</p>
        </div>
        <button onClick={() => { setEditEntry(undefined); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
          <Plus className="w-4 h-4" /> Новая запись
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl">{todayEntry ? "✅" : "📝"}</p>
          <p className="text-xs text-muted-foreground mt-1">Сегодня</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{entries.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Записей</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{avgMood || "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Ср. настроение</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-indigo-400">{avgProductivity || "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Ср. продуктивность</p>
        </div>
      </div>

      {/* Today prompt */}
      {!todayEntry && (
        <button onClick={() => { setEditEntry(undefined); setShowModal(true); }} className="w-full glass rounded-2xl p-6 text-left hover:bg-white/[0.03] transition-all border-dashed border-border">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📝</div>
            <div>
              <p className="font-semibold">Как прошёл твой день?</p>
              <p className="text-sm text-muted-foreground mt-0.5">Запиши свои мысли, достижения и планы</p>
            </div>
          </div>
        </button>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск в дневнике..." className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BookOpen className="w-16 h-16 opacity-20 mb-4" />
          <p className="text-lg font-medium">Нет записей</p>
          <p className="text-sm mt-1">Начни вести дневник уже сегодня</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(e => (
            <EntryCard key={e.id} entry={e} onEdit={() => { setEditEntry(e); setShowModal(true); }} onDelete={() => handleDelete(e.id)} />
          ))}
        </div>
      )}

      {showModal && <JournalModal entry={editEntry} onClose={() => setShowModal(false)} onSave={load} />}
    </div>
  );
}
