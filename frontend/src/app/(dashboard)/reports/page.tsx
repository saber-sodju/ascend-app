"use client";
import { useEffect, useState } from "react";
import { reportsAPI } from "@/lib/api";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell } from "recharts";
import { Trophy, Target, Repeat2, CheckSquare, Wallet, Scale, Calendar, TrendingUp } from "lucide-react";

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={64} cy={64} r={r} fill="none" stroke="hsl(240 5.9% 14%)" strokeWidth={8} />
          <circle cx={64} cy={64} r={r} fill="none" stroke={color} strokeWidth={8} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.5s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{Math.round(score)}</span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">{label}</p>
    </div>
  );
}

export default function ReportsPage() {
  const [weekly, setWeekly] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly">("weekly");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const today = new Date();
    const [wRes, mRes] = await Promise.all([
      reportsAPI.weekly(),
      reportsAPI.monthly({ month: today.getMonth() + 1, year: today.getFullYear() }),
    ]);
    setWeekly(wRes.data);
    setMonthly(mRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const data = activeTab === "weekly" ? weekly : monthly;

  const habitDetails = weekly?.habits?.details || [];
  const pieColors = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#ef4444"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Отчёты</h1>
          <p className="text-muted-foreground text-sm mt-1">Анализ твоего прогресса</p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-xl p-1">
          {[{ v: "weekly", l: "Неделя" }, { v: "monthly", l: "Месяц" }].map(tab => (
            <button key={tab.v} onClick={() => setActiveTab(tab.v as any)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {tab.l}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <>
          {/* Period */}
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {activeTab === "weekly" ? `${data.week_start} — ${data.week_end}` : `${getMonthName(data.month)} ${data.year}`}
            </p>
          </div>

          {/* Overall score + subscores */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-6 text-center">{activeTab === "weekly" ? "Счёт недели" : "Счёт месяца"}</h3>
            <div className="flex flex-wrap justify-around gap-6">
              <ScoreGauge score={data[activeTab === "weekly" ? "weekly_score" : "monthly_score"] || 0} label="Общий" />
              <ScoreGauge score={data.habits?.score || 0} label="Привычки" />
              <ScoreGauge score={data.tasks?.score || 0} label="Задачи" />
              {data.goals?.score !== undefined && <ScoreGauge score={data.goals.score || 0} label="Цели" />}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Habits */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-indigo-500/15"><Repeat2 className="w-4 h-4 text-indigo-400" /></div>
                <h3 className="font-semibold text-sm">Привычки</h3>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-muted-foreground">Выполнено</span>
                <span className="font-bold">{data.habits.completed}/{data.habits.total}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${data.habits.score}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{data.habits.score}% выполнено</p>

              {habitDetails.length > 0 && (
                <div className="mt-3 space-y-2">
                  {habitDetails.map((h: any) => (
                    <div key={h.id}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span>{h.icon} {h.title}</span>
                        <span className="font-medium">{h.rate}%</span>
                      </div>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${h.rate}%`, backgroundColor: h.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tasks */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-emerald-500/15"><CheckSquare className="w-4 h-4 text-emerald-400" /></div>
                <h3 className="font-semibold text-sm">Задачи</h3>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-muted-foreground">Выполнено</span>
                <span className="font-bold">{data.tasks.completed}/{data.tasks.total}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.tasks.score}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{data.tasks.score}% выполнено</p>
              {activeTab === "weekly" && data.tasks.list?.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {data.tasks.list.slice(0, 5).map((t: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span className="text-muted-foreground truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Finance */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-yellow-500/15"><Wallet className="w-4 h-4 text-yellow-400" /></div>
                <h3 className="font-semibold text-sm">Финансы</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Доходы</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(data.finance.income)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Расходы</span>
                  <span className="font-bold text-red-400">{formatCurrency(data.finance.expenses)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2">
                  <span className="text-muted-foreground">Сэкономлено</span>
                  <span className={`font-bold ${data.finance.savings >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(data.finance.savings)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Goals (weekly) */}
          {activeTab === "weekly" && data.goals && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-orange-500/15"><Target className="w-4 h-4 text-orange-400" /></div>
                <h3 className="font-semibold">Цели в процессе</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.goals.in_progress?.map((g: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate max-w-[200px]">{g.title}</span>
                      <span className="font-bold text-xs">{g.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full" style={{ width: `${g.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health (monthly) */}
          {activeTab === "monthly" && data.health && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-pink-500/15"><Scale className="w-4 h-4 text-pink-400" /></div>
                <h3 className="font-semibold">Здоровье</h3>
              </div>
              <div className="flex items-center gap-6">
                {data.health.weight_change !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Изменение веса</p>
                    <p className={`text-2xl font-bold ${data.health.weight_change <= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {data.health.weight_change > 0 ? "+" : ""}{data.health.weight_change} кг
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
