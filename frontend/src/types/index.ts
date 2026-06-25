export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  theme: string;
  language: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  priority: Priority;
  start_date: string | null;
  deadline: string | null;
  current_value: number;
  target_value: number | null;
  unit: string | null;
  status: GoalStatus;
  color: string;
  emoji: string | null;
  progress_percent: number;
  sub_goals: SubGoal[];
  milestones: Milestone[];
  created_at: string;
  updated_at: string | null;
}

export interface SubGoal {
  id: string;
  goal_id: string;
  title: string;
  is_completed: boolean;
  order: number;
  created_at: string;
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  target_value: number | null;
  achieved_at: string | null;
  created_at: string;
}

export type GoalCategory = "health" | "education" | "career" | "finance" | "family" | "religion" | "self_development" | "other";
export type GoalStatus = "not_started" | "in_progress" | "completed" | "paused" | "cancelled";
export type Priority = "low" | "medium" | "high" | "critical" | "urgent";

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  frequency: "daily" | "weekly" | "monthly";
  target_value: number;
  unit: string | null;
  color: string;
  icon: string;
  is_active: boolean;
  reminder_time: string | null;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  logs: HabitLog[];
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  value: number;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: Priority;
  category: string | null;
  due_date: string | null;
  status: TaskStatus;
  order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export type TaskStatus = "todo" | "in_progress" | "completed" | "overdue";

export interface Transaction {
  id: string;
  user_id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  spent: number;
  remaining: number;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  color: string;
  emoji: string | null;
  is_achieved: boolean;
  progress_percent: number;
  created_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface HealthLog {
  id: string;
  user_id: string;
  date: string;
  sleep_hours: number | null;
  water_ml: number | null;
  energy_level: number | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  type: string;
  duration: number | null;
  distance: number | null;
  calories: number | null;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  what_i_did: string | null;
  what_failed: string | null;
  what_i_learned: string | null;
  plan_for_tomorrow: string | null;
  mood: number | null;
  energy: number | null;
  productivity: number | null;
  tags: { id: string; tag: string }[];
  created_at: string;
  updated_at: string | null;
}

export interface DashboardData {
  today: {
    date: string;
    habits_total: number;
    habits_completed: number;
    habits_completion_rate: number;
    tasks_total: number;
    tasks_completed: number;
    tasks_today: number;
    latest_weight: number | null;
    water_ml: number | null;
    sleep_hours: number | null;
    energy_level: number | null;
  };
  financial: {
    income_month: number;
    expenses_month: number;
    savings_month: number;
    spent_today: number;
  };
  goals: {
    total: number;
    completed: number;
    in_progress: number;
    completion_rate: number;
  };
  weekly_score: {
    score: number;
    habits_score: number;
    tasks_score: number;
    goals_score: number;
    health_score: number;
  };
  current_streaks: Array<{ id: string; title: string; icon: string; color: string; streak: number }>;
  weight_chart: Array<{ date: string; weight: number }>;
  recent_transactions: Array<{ id: string; type: string; category: string; amount: number; date: string; description: string | null }>;
  upcoming_tasks: Array<{ id: string; title: string; due_date: string | null; priority: string; status: string }>;
  goals_progress: Array<{ id: string; title: string; category: string; progress: number; color: string; emoji: string | null; status: string; deadline: string | null }>;
}

export interface FinanceSummary {
  total_income: number;
  total_expenses: number;
  savings: number;
  month: number;
  year: number;
  by_category: Record<string, { income: number; expense: number }>;
}

export interface HealthSummary {
  latest_weight: number | null;
  avg_weight_week: number | null;
  target_weight: number | null;
  avg_sleep: number | null;
  avg_water: number | null;
  avg_energy: number | null;
}
