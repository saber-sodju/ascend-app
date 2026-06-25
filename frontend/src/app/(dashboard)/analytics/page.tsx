"use client";
import { useEffect, useState } from "react";
import { analyticsAPI } from "@/lib/api";
import { formatCurrency, getMonthName, GOAL_CATEGORIES } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { TrendingUp, Target, Repeat2, Wallet, Heart, Flame } from "lucide-react";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

const TABS = [
  { key: "productivity", label: "Продуктивность", icon: TrendingUp },
  { key: "habits", label: "Привычки", icon: Repeat2 },
  { key: "finance", label: "Финансы", icon: Wallet },
  { key: "health", label: "Здоровье", icon: Heart },
  { key: "goals", label: "Цели", icon: Target },
];

export default function AnalyticsPage() {
  const [tab, setTab] = useState("productivity");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetch: Record<string, () => Promise<any>> = {
      productivity: () => analyticsAPI.productivity(30),
      habits: () => analyticsAPI.habits(),
      finance: () => analyticsAPI.finance(),
      health: () => analyticsAPI.health(90),
      goals: () => analyticsAPI.goals(),
    };
    fetch[tab]().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [tab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Аналитика</h1>
        <p className="text-muted-foreground text-sm mt-1">Глубокий анализ твоих данных</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === t.key ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : !data ? (
        <div className="text-center py-20 text-muted-foreground">Нет данных</div>
      ) : (
        <>
          {tab === "productivity" && Array.isArray(data) && (
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Выполнение привычек — 30 дней</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5.9% 14%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(240 5% 55%)" }} interval={6} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "hsl(240 10% 7%)", border: "1px solid hsl(240 5.9% 14%)", borderRadius: "0.75rem", fontSize: 12 }} />
                    <Area type="monotone" dataKey="habits_score" name="Привычки %" stroke="#6366f1" strokeWidth={2} fill="url(#prodGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Настроение и продуктивность</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.filter((d: any) => d.mood || d.productivity)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5.9% 14%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(240 5% 55%)" }} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} domain={[0, 10]} />
                    <Tooltip contentStyle={{ background: "hsl(240 10% 7%)", border: "1px solid hsl(240 5.9% 14%)", borderRadius: "0.75rem", fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} />
                    <Line type="monotone" dataKey="mood" name="Настроение" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="productivity" name="Продуктивность" stroke="#6366f1" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="energy" name="Энергия" stroke="#22c55e" strokeWidth={2} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {tab === "habits" && Array.isArray(data) && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.map((h: any) => (
                  <div key={h.id} className="glass rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{h.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{h.title}</p>
                        <p className={`text-[10px] ${h.is_active ? "text-emerald-400" : "text-muted-foreground"}`}>{h.is_active ? "Активна" : "Архив"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-orange-400 flex items-center justify-center gap-1"><Flame className="w-3.5 h-3.5" />{h.streak}</p>
                        <p className="text-[10px] text-muted-foreground">Серия</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{h.completed}</p>
                        <p className="text-[10px] text-muted-foreground">Выполнено</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-indigo-400">{h.rate}%</p>
                        <p className="text-[10px] text-muted-foreground">Процент</p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${h.rate}%`, backgroundColor: "#6366f1" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "finance" && data.monthly && (
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Доходы и расходы {data.year}</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.monthly.map((d: any) => ({ ...d, name: getMonthName(d.month) }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5.9% 14%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} />
                    <Tooltip contentStyle={{ background: "hsl(240 10% 7%)", border: "1px solid hsl(240 5.9% 14%)", borderRadius: "0.75rem", fontSize: 12 }} formatter={(v: any) => [formatCurrency(v)]} />
                    <Legend iconType="circle" iconSize={8} />
                    <Bar dataKey="income" name="Доходы" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Расходы" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="savings" name="Накопления" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {Object.keys(data.by_category).length > 0 && (
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Расходы по категориям (всё время)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={Object.entries(data.by_category).map(([name, value]) => ({ name, value }))} cx="40%" cy="50%" outerRadius={100} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {Object.keys(data.by_category).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(240 10% 7%)", border: "1px solid hsl(240 5.9% 14%)", borderRadius: "0.75rem", fontSize: 12 }} formatter={(v: any) => [formatCurrency(v)]} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "hsl(240 5% 55%)" }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {tab === "health" && (
            <div className="space-y-6">
              {data.weight_chart?.length > 0 && (
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Вес — 90 дней</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data.weight_chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="hWGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5.9% 14%)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(240 5% 55%)" }} interval={14} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ background: "hsl(240 10% 7%)", border: "1px solid hsl(240 5.9% 14%)", borderRadius: "0.75rem", fontSize: 12 }} formatter={(v: any) => [`${v} кг`]} />
                      <Area type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2} fill="url(#hWGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
              {data.sleep_chart?.length > 0 && (
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Сон — 90 дней</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={data.sleep_chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5.9% 14%)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(240 5% 55%)" }} interval={14} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} domain={[0, 12]} />
                      <Tooltip contentStyle={{ background: "hsl(240 10% 7%)", border: "1px solid hsl(240 5.9% 14%)", borderRadius: "0.75rem", fontSize: 12 }} formatter={(v: any) => [`${v} ч`]} />
                      <Area type="monotone" dataKey="sleep" stroke="#8b5cf6" strokeWidth={2} fill="none" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {tab === "goals" && data.by_category && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-4">По категориям</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={Object.entries(data.by_category).map(([name, value]) => ({ name: GOAL_CATEGORIES[name]?.label || name, value }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {Object.keys(data.by_category).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(240 10% 7%)", border: "1px solid hsl(240 5.9% 14%)", borderRadius: "0.75rem", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold mb-4">По статусам</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={Object.entries(data.by_status).map(([name, value]) => ({ name, value }))} layout="vertical" margin={{ top: 0, right: 5, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5.9% 14%)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} width={60} />
                    <Tooltip contentStyle={{ background: "hsl(240 10% 7%)", border: "1px solid hsl(240 5.9% 14%)", borderRadius: "0.75rem", fontSize: 12 }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}>
                      {Object.keys(data.by_status).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass rounded-2xl p-6 md:col-span-2">
                <h3 className="font-semibold mb-4">Все цели</h3>
                <div className="space-y-3">
                  {data.goals?.map((g: any) => (
                    <div key={g.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-2">
                          <span>{GOAL_CATEGORIES[g.category]?.emoji}</span>
                          <span className="font-medium">{g.title}</span>
                          {g.deadline && <span className="text-[10px] text-muted-foreground">{g.deadline}</span>}
                        </span>
                        <span className="font-bold">{g.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${g.progress}%`, backgroundColor: COLORS[0] }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
