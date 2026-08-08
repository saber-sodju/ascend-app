"use client";
import { useEffect, useState } from "react";
import { gamificationAPI } from "@/lib/api";
import { GamificationStats } from "@/types";
import { Flame, TrendingUp, TrendingDown, Trophy, Target, Star, Zap } from "lucide-react";

export default function StatisticsPage() {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gamificationAPI.stats().then(res => setStats(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const { level_info } = stats;

  const tiles = [
    { label: "Средний % выполнения", value: `${stats.average_completion_rate}%`, icon: TrendingUp, color: "text-indigo-400" },
    { label: "Текущая серия", value: stats.best_current_streak, icon: Flame, color: "text-orange-400" },
    { label: "Максимальная серия", value: stats.best_longest_streak, icon: Star, color: "text-amber-400" },
    { label: "Достижения", value: `${stats.achievements_unlocked}/${stats.achievements_total}`, icon: Trophy, color: "text-amber-400" },
    { label: "Целей выполнено", value: stats.goals_completed, icon: Target, color: "text-emerald-400" },
    { label: "Всего XP", value: stats.xp, icon: Zap, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Статистика</h1>
        <p className="text-muted-foreground text-sm mt-1">Твой прогресс в цифрах</p>
      </div>

      {/* Level card */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-primary/25">
              {level_info.level}
            </div>
            <div>
              <p className="font-semibold">Уровень {level_info.level}</p>
              <p className="text-xs text-muted-foreground">{level_info.xp} XP всего</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold gradient-text">{level_info.progress_percent}%</p>
            <p className="text-[10px] text-muted-foreground">до уровня {level_info.level + 1}</p>
          </div>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000" style={{ width: `${level_info.progress_percent}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-right">{level_info.xp} / {level_info.next_level_xp} XP</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tiles.map(t => (
          <div key={t.label} className="glass rounded-xl p-4 text-center">
            <t.icon className={`w-5 h-5 mx-auto mb-1.5 ${t.color}`} />
            <p className={`text-xl font-bold ${t.color}`}>{t.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Best / Worst habits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Лучшие привычки
          </h2>
          {stats.best_habits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет данных</p>
          ) : (
            <div className="space-y-2">
              {stats.best_habits.map(h => (
                <div key={h.habit_id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/50">
                  <span className="flex items-center gap-2 text-sm truncate"><span>{h.icon}</span>{h.title}</span>
                  <span className="text-sm font-bold text-emerald-400">{h.completion_rate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" /> Слабые привычки
          </h2>
          {stats.worst_habits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет данных</p>
          ) : (
            <div className="space-y-2">
              {stats.worst_habits.map(h => (
                <div key={h.habit_id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/50">
                  <span className="flex items-center gap-2 text-sm truncate"><span>{h.icon}</span>{h.title}</span>
                  <span className="text-sm font-bold text-red-400">{h.completion_rate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
