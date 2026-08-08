"use client";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { UnlockedAchievement } from "@/types";
import { RARITY_CONFIG } from "@/lib/utils";

function AchievementToastCard({ achievement, visible }: { achievement: UnlockedAchievement; visible: boolean }) {
  const rarity = RARITY_CONFIG[achievement.rarity] || RARITY_CONFIG.common;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`glass rounded-2xl p-4 pr-5 shadow-2xl border ${rarity.border} flex items-center gap-3 min-w-[300px] max-w-sm`}
        >
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${rarity.bg}`}
          >
            {achievement.icon}
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">🏆 Новое достижение</p>
            <p className="font-semibold text-sm truncate mt-0.5">{achievement.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${rarity.bg} ${rarity.color}`}>{rarity.label}</span>
              <span className="text-[10px] text-emerald-400 font-medium">+{achievement.xp_bonus} XP</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function showAchievementUnlockToast(achievement: UnlockedAchievement) {
  toast.custom((t) => <AchievementToastCard achievement={achievement} visible={t.visible} />, {
    duration: 5000,
    position: "top-center",
  });
}

export function showAchievementUnlockToasts(achievements: UnlockedAchievement[]) {
  achievements.forEach((a, i) => {
    setTimeout(() => showAchievementUnlockToast(a), i * 600);
  });
}
