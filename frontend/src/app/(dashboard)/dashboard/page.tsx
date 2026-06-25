"use client";
import { useEffect, useState } from "react";
import { dashboardAPI } from "@/lib/api";
import { DashboardData } from "@/types";
import { formatCurrency, formatDateShort, GOAL_CATEGORIES, PRIORITY_CONFIG } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Target, Repeat2, CheckSquare, Wallet, Heart, Flame,
  TrendingUp, TrendingDown, Scale, Droplets, Moon, Zap,
  ArrowUp, ArrowDown, Calendar, Clock,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis,
  Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(240 5.9% 14%)" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="score-ring" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, trend }: any) {
  return (
    <div className="glass rounded-2xl p-5 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-1 ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5 opacity-70">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-20 text-muted-foreground">Не удалось загрузить данные</div>;

  const today = new Date();
  const todayLabel = format(today, "EEEE, d MMMM", { locale: ru });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize">{todayLabel}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Привет! Вот твой ежедневный обзор
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Weekly Score</p>
          <p className="text-2xl font-bold gradient-text">{data.weekly_score.score}</p>
        </div>
      </div>

      {/* Today Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Repeat2}
          label="Привычки сегодня"
          value={`${data.today.habits_completed}/${data.today.habits_total}`}
          sub={`${data.today.habits_completion_rate}% выполнено`}
          color="bg-indigo-500/15 text-indigo-400"
        />
        <StatCard
          icon={CheckSquare}
          label="Задачи на сегодня"
          value={`${data.today.tasks_completed}/${data.today.tasks_total}`}
          sub={`${data.today.tasks_today} осталось`}
          color="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          icon={Wallet}
          label="Потрачено сегодня"
          value={formatCurrency(data.financial.spent_today)}
          sub={`${formatCurrency(data.financial.savings_month)} сэкономлено`}
          color="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          icon={Scale}
          label="Текущий вес"
          value={data.today.latest_weight ? `${data.today.latest_weight} кг` : "—"}
          sub={data.today.energy_level ? `Энергия: ${data.today.energy_level}/10` : "Данных нет"}
          color="bg-orange-500/15 text-orange-400"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Score */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Счёт недели</h3>
          <div className="flex items-center justify-center mb-6">
            <ScoreRing score={Math.round(data.weekly_score.score)} size={140} />
          </div>
          <div className="space-y-2">
            {[
              { label: "Привычки", value: data.weekly_score.habits_score, color: "#6366f1" },
              { label: "Задачи", value: data.weekly_score.tasks_score, color: "#22c55e" },
              { label: "Цели", value: data.weekly_score.goals_score, color: "#f59e0b" },
              { label: "Здоровье", value: data.weekly_score.health_score, color: "#ec4899" },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{Math.round(item.value)}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weight Chart */}
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">График веса</h3>
            {data.today.latest_weight && (
              <span className="text-sm font-medium text-muted-foreground">{data.today.latest_weight} кг</span>
            )}
          </div>
          {data.weight_chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={data.weight_chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5.9% 14%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} tickFormatter={(v) => formatDateShort(v)} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "hsl(240 10% 7%)", border: "1px solid hsl(240 5.9% 14%)", borderRadius: "0.75rem", fontSize: 12 }}
                  labelFormatter={(v) => formatDateShort(v)}
                  formatter={(v: any) => [`${v} кг`, "Вес"]}
                />
                <Area type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2} fill="url(#weightGrad)" dot={{ fill: "#6366f1", r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              <Scale className="w-8 h-8 mb-2 opacity-30 mr-2" /> Нет данных о весе
            </div>
          )}
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals Progress */}
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Прогресс целей</h3>
            <span className="text-xs text-muted-foreground">{data.goals.completed}/{data.goals.total} завершено</span>
          </div>
          {data.goals_progress.length > 0 ? (
            <div className="space-y-3">
              {data.goals_progress.map((goal) => (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{goal.emoji || GOAL_CATEGORIES[goal.category]?.emoji}</span>
                      <span className="text-sm font-medium truncate max-w-[200px]">{goal.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {goal.deadline && (
                        <span className="text-[10px] text-muted-foreground">{formatDateShort(goal.deadline)}</span>
                      )}
                      <span className="text-sm font-bold">{goal.progress}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${goal.progress}%`, backgroundColor: goal.color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              <Target className="w-8 h-8 opacity-30 mr-2" /> Целей пока нет
            </div>
          )}
        </div>

        {/* Streaks */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Серии привычек 🔥</h3>
          {data.current_streaks.length > 0 ? (
            <div className="space-y-3">
              {data.current_streaks.map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.icon}</span>
                    <span className="text-sm truncate max-w-[110px]">{s.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="font-bold text-sm">{s.streak}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
              <Flame className="w-8 h-8 opacity-30 mb-2" />
              <p>Нет активных серий</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Finance */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Финансы месяца</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Доходы</p>
              <p className="font-bold text-emerald-400">{formatCurrency(data.financial.income_month)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Расходы</p>
              <p className="font-bold text-red-400">{formatCurrency(data.financial.expenses_month)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Сэкономлено</p>
              <p className={`font-bold ${data.financial.savings_month >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatCurrency(data.financial.savings_month)}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {data.recent_transactions.slice(0, 4).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${tx.type === "income" ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                    {tx.type === "income" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{tx.description || tx.category}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDateShort(tx.date)}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                  {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Предстоящие задачи</h3>
          {data.upcoming_tasks.length > 0 ? (
            <div className="space-y-2">
              {data.upcoming_tasks.map((task) => {
                const pc = PRIORITY_CONFIG[task.priority];
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pc?.color.replace("text-", "bg-")}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      {task.due_date && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="w-2.5 h-2.5" /> {formatDateShort(task.due_date)}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pc?.bg} ${pc?.color}`}>
                      {pc?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
              <CheckSquare className="w-8 h-8 opacity-30 mb-2" />
              <p>Нет предстоящих задач</p>
            </div>
          )}
        </div>
      </div>

      {/* Health quick */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/15">
            <Droplets className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Вода</p>
            <p className="font-bold text-sm">{data.today.water_ml ? `${data.today.water_ml} мл` : "—"}</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/15">
            <Moon className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Сон</p>
            <p className="font-bold text-sm">{data.today.sleep_hours ? `${data.today.sleep_hours} ч` : "—"}</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-yellow-500/15">
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Энергия</p>
            <p className="font-bold text-sm">{data.today.energy_level ? `${data.today.energy_level}/10` : "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
