import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isToday, isTomorrow, isYesterday } from "date-fns";
import { ru } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "$"): string {
  return `${currency}${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Сегодня";
    if (isTomorrow(d)) return "Завтра";
    if (isYesterday(d)) return "Вчера";
    return format(d, "d MMM yyyy", { locale: ru });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "d MMM", { locale: ru });
  } catch {
    return dateStr;
  }
}

export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getMonthName(month: number): string {
  const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  return months[month - 1] || "";
}

export const GOAL_CATEGORIES: Record<string, { label: string; emoji: string; color: string }> = {
  health: { label: "Здоровье", emoji: "💪", color: "#22c55e" },
  education: { label: "Учёба", emoji: "📚", color: "#6366f1" },
  career: { label: "Карьера", emoji: "💼", color: "#f59e0b" },
  finance: { label: "Финансы", emoji: "💰", color: "#10b981" },
  family: { label: "Семья", emoji: "👨‍👩‍👧", color: "#ec4899" },
  religion: { label: "Религия", emoji: "🕌", color: "#8b5cf6" },
  self_development: { label: "Саморазвитие", emoji: "🧠", color: "#14b8a6" },
  other: { label: "Другое", emoji: "⭐", color: "#6b7280" },
};

export const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: "Низкий", color: "text-slate-400", bg: "bg-slate-400/10" },
  medium: { label: "Средний", color: "text-blue-400", bg: "bg-blue-400/10" },
  high: { label: "Высокий", color: "text-orange-400", bg: "bg-orange-400/10" },
  critical: { label: "Критический", color: "text-red-400", bg: "bg-red-400/10" },
  urgent: { label: "Срочный", color: "text-red-500", bg: "bg-red-500/10" },
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  not_started: { label: "Не начата", color: "text-slate-400", bg: "bg-slate-400/10" },
  in_progress: { label: "В процессе", color: "text-blue-400", bg: "bg-blue-400/10" },
  completed: { label: "Завершена", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  paused: { label: "Приостановлена", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  cancelled: { label: "Отменена", color: "text-red-400", bg: "bg-red-400/10" },
  todo: { label: "К выполнению", color: "text-slate-400", bg: "bg-slate-400/10" },
  overdue: { label: "Просрочена", color: "text-red-400", bg: "bg-red-400/10" },
};

export const INCOME_CATEGORIES = [
  { value: "salary", label: "Зарплата", emoji: "💵" },
  { value: "scholarship", label: "Стипендия", emoji: "🎓" },
  { value: "freelance", label: "Фриланс", emoji: "💻" },
  { value: "investment", label: "Инвестиции", emoji: "📈" },
  { value: "gift", label: "Подарок", emoji: "🎁" },
  { value: "other", label: "Прочее", emoji: "💸" },
];

export const EXPENSE_CATEGORIES = [
  { value: "food", label: "Еда", emoji: "🍕" },
  { value: "transport", label: "Транспорт", emoji: "🚌" },
  { value: "education", label: "Учёба", emoji: "📚" },
  { value: "shopping", label: "Покупки", emoji: "🛍️" },
  { value: "subscriptions", label: "Подписки", emoji: "📱" },
  { value: "entertainment", label: "Развлечения", emoji: "🎮" },
  { value: "health", label: "Здоровье", emoji: "💊" },
  { value: "bills", label: "Счета", emoji: "🏠" },
  { value: "other", label: "Прочее", emoji: "💸" },
];

export const ACTIVITY_TYPES = [
  { value: "running", label: "Бег", emoji: "🏃" },
  { value: "walking", label: "Ходьба", emoji: "🚶" },
  { value: "gym", label: "Зал", emoji: "🏋️" },
  { value: "cycling", label: "Велосипед", emoji: "🚴" },
  { value: "swimming", label: "Плавание", emoji: "🏊" },
  { value: "yoga", label: "Йога", emoji: "🧘" },
  { value: "football", label: "Футбол", emoji: "⚽" },
  { value: "other", label: "Другое", emoji: "🏃" },
];
