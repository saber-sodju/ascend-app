"use client";
import { useEffect, useState } from "react";
import { tasksAPI } from "@/lib/api";
import { Task, TaskStatus } from "@/types";
import { PRIORITY_CONFIG, STATUS_CONFIG, formatDate, todayStr, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { Plus, CheckCircle2, Circle, Trash2, Edit3, X, Loader2, Check, Calendar, Flag, Search, Clock } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const TASK_TABS: { key: TaskStatus | "all"; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "todo", label: "К выполнению" },
  { key: "in_progress", label: "В процессе" },
  { key: "completed", label: "Выполнено" },
  { key: "overdue", label: "Просрочено" },
];

function TaskModal({ task, onClose, onSave }: { task?: Task; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    category: task?.category || "",
    due_date: task?.due_date || todayStr(),
    status: task?.status || "todo",
  });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!form.title.trim()) { toast.error("Введите название"); return; }
    setLoading(true);
    try {
      if (task) { await tasksAPI.update(task.id, form); toast.success("Задача обновлена"); }
      else { await tasksAPI.create(form); toast.success("Задача создана!"); }
      onSave(); onClose();
    } catch (e: any) { toast.error(e.response?.data?.detail || "Ошибка"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-semibold text-lg">{task ? "Редактировать" : "Новая задача"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Название задачи *" className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Описание" rows={3} className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Приоритет</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
                <option value="urgent">Срочный</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Категория</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Работа, учёба..." className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Срок</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            {task && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Статус</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="todo">К выполнению</option>
                  <option value="in_progress">В процессе</option>
                  <option value="completed">Выполнено</option>
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-secondary transition-colors">Отмена</button>
          <button onClick={save} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {task ? "Сохранить" : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskItem({ task, onToggle, onEdit, onDelete }: { task: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const pc = PRIORITY_CONFIG[task.priority];
  const completed = task.status === "completed";

  return (
    <div className={cn("flex items-start gap-3 p-4 rounded-xl border transition-all group", completed ? "border-border/50 opacity-60" : "border-border hover:border-border/80 hover:bg-secondary/30")}>
      <button onClick={onToggle} className="mt-0.5 flex-shrink-0 transition-all hover:scale-110">
        {completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm", completed && "line-through")}>{task.title}</p>
        {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {task.due_date && (
            <span className={cn("text-[10px] flex items-center gap-1", task.status === "overdue" ? "text-red-400" : "text-muted-foreground")}>
              <Calendar className="w-2.5 h-2.5" /> {formatDate(task.due_date)}
            </span>
          )}
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", pc.bg, pc.color)}>
            {pc.label}
          </span>
          {task.category && <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-secondary rounded-full">{task.category}</span>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TaskStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>();

  const load = async () => {
    setLoading(true);
    const params: any = {};
    if (activeTab !== "all") params.status = activeTab;
    const res = await tasksAPI.list(params);
    setTasks(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [activeTab]);

  const handleToggle = async (task: Task) => {
    const newStatus = task.status === "completed" ? "todo" : "completed";
    await tasksAPI.update(task.id, { status: newStatus });
    if (newStatus === "completed") toast.success("Задача выполнена! ✅");
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить задачу?")) return;
    await tasksAPI.delete(id);
    toast.success("Задача удалена");
    load();
  };

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const counts: Record<string, number> = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === "todo").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
    overdue: tasks.filter(t => t.status === "overdue").length,
  };

  const todayTasks = filtered.filter(t => t.due_date === todayStr() && t.status !== "completed");
  const otherTasks = filtered.filter(t => !(t.due_date === todayStr() && t.status !== "completed"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Задачи</h1>
          <p className="text-muted-foreground text-sm mt-1">Сегодня: {format(new Date(), "d MMMM", { locale: ru })}</p>
        </div>
        <button onClick={() => { setEditTask(undefined); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
          <Plus className="w-4 h-4" /> Новая задача
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Поиск задач..."
          className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 overflow-x-auto">
        {TASK_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all", activeTab === tab.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center", activeTab === tab.key ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <CheckCircle2 className="w-16 h-16 opacity-20 mb-4" />
          <p className="text-lg font-medium">Задач нет</p>
          <p className="text-sm mt-1">Создай новую задачу</p>
        </div>
      ) : (
        <div className="space-y-6">
          {todayTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">На сегодня ({todayTasks.length})</h2>
              </div>
              <div className="space-y-2">
                {todayTasks.map(t => (
                  <TaskItem key={t.id} task={t} onToggle={() => handleToggle(t)} onEdit={() => { setEditTask(t); setShowModal(true); }} onDelete={() => handleDelete(t.id)} />
                ))}
              </div>
            </div>
          )}
          {otherTasks.length > 0 && (
            <div>
              {todayTasks.length > 0 && <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Остальные</h2>}
              <div className="space-y-2">
                {otherTasks.map(t => (
                  <TaskItem key={t.id} task={t} onToggle={() => handleToggle(t)} onEdit={() => { setEditTask(t); setShowModal(true); }} onDelete={() => handleDelete(t.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && <TaskModal task={editTask} onClose={() => setShowModal(false)} onSave={load} />}
    </div>
  );
}
