"use client";
import { useEffect, useState } from "react";
import { achievementsAPI } from "@/lib/api";
import { Achievement } from "@/types";
import { cn, RARITY_CONFIG, formatDate } from "@/lib/utils";
import { Trophy, Lock } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  habits: "Привычки",
  workouts: "Тренировки",
  reading: "Чтение",
  discipline: "Дисциплина",
  goals: "Цели",
};

const CATEGORY_ORDER = ["habits", "workouts", "reading", "discipline", "goals"];

function AchievementCard({ a }: { a: Achievement }) {
  const rarity = RARITY_CONFIG[a.rarity] || RARITY_CONFIG.common;
  const unlocked = !!a.unlocked_at;
  const progressPct = a.progress_target > 0 ? Math.min(100, Math.round((a.progress_current / a.progress_target) * 100)) : 0;

  return (
    <div className={cn("glass rounded-2xl p-4 border transition-all", unlocked ? rarity.border : "border-transparent opacity-70")}>
      <div className="flex items-center gap-3 mb-2">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0", unlocked ? rarity.bg : "bg-secondary")}>
          {unlocked ? a.icon : <Lock className="w-4 h-4 text-muted-foreground" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm truncate">{a.name}</h3>
          <p className="text-[10px] text-muted-foreground truncate">{a.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full", rarity.bg, rarity.color)}>{rarity.label}</span>
        {unlocked ? (
          <span className="text-[10px] text-emerald-400">Получено {formatDate(a.unlocked_at!)}</span>
        ) : (
          <span className="text-[10px] text-muted-foreground">{a.progress_current}/{a.progress_target}</span>
        )}
      </div>
      {!unlocked && (
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progressPct}%`, backgroundColor: "#6366f1" }} />
        </div>
      )}
    </div>
  );
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    achievementsAPI.list().then(res => setAchievements(res.data)).finally(() => setLoading(false));
  }, []);

  const unlockedCount = achievements.filter(a => a.unlocked_at).length;
  const grouped = CATEGORY_ORDER.map(cat => ({ cat, items: achievements.filter(a => a.category === cat) })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Достижения</h1>
          <p className="text-muted-foreground text-sm mt-1">Награды за дисциплину и прогресс</p>
        </div>
        <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-lg">{unlockedCount}</span>
          <span className="text-muted-foreground text-sm">/ {achievements.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ cat, items }) => (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {CATEGORY_LABELS[cat] || cat} ({items.filter(i => i.unlocked_at).length}/{items.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map(a => <AchievementCard key={a.key} a={a} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
