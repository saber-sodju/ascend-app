from dataclasses import dataclass
from app.gamification.rarity import Rarity


@dataclass(frozen=True)
class AchievementDefinition:
    key: str
    name: str
    description: str
    icon: str
    rarity: Rarity
    category: str
    metric_key: str
    threshold: float


# The single place to add or tune achievements. Adding a new achievement on an EXISTING
# metric = append one entry here, nothing else in the codebase changes. Adding a whole new
# category = also write one metric function in metrics.py and reference its key below.
ACHIEVEMENTS: list[AchievementDefinition] = [
    # --- Habit streaks ---
    AchievementDefinition("streak_3", "Первые шаги", "3 дня подряд выполнена привычка", "🔥", Rarity.common, "habits", "max_habit_streak", 3),
    AchievementDefinition("streak_7", "Неделя силы воли", "7 дней подряд выполнена привычка", "🔥", Rarity.common, "habits", "max_habit_streak", 7),
    AchievementDefinition("streak_14", "Две недели", "14 дней подряд выполнена привычка", "⚡", Rarity.rare, "habits", "max_habit_streak", 14),
    AchievementDefinition("streak_30", "Месяц дисциплины", "30 дней подряд выполнена привычка", "⚡", Rarity.rare, "habits", "max_habit_streak", 30),
    AchievementDefinition("streak_60", "Два месяца", "60 дней подряд выполнена привычка", "💪", Rarity.epic, "habits", "max_habit_streak", 60),
    AchievementDefinition("streak_100", "Сотня", "100 дней подряд выполнена привычка", "💎", Rarity.epic, "habits", "max_habit_streak", 100),
    AchievementDefinition("streak_365", "Год без пропусков", "365 дней подряд выполнена привычка", "👑", Rarity.legendary, "habits", "max_habit_streak", 365),

    # --- Workouts ---
    AchievementDefinition("workout_1", "Первая тренировка", "Записана первая тренировка", "🏋️", Rarity.common, "workouts", "total_activity_logs", 1),
    AchievementDefinition("workout_10", "Разминка закончена", "10 тренировок", "🏋️", Rarity.common, "workouts", "total_activity_logs", 10),
    AchievementDefinition("workout_50", "В форме", "50 тренировок", "🥇", Rarity.rare, "workouts", "total_activity_logs", 50),
    AchievementDefinition("workout_100", "Атлет", "100 тренировок", "🏆", Rarity.epic, "workouts", "total_activity_logs", 100),
    AchievementDefinition("workout_500", "Железная воля", "500 тренировок", "🌟", Rarity.legendary, "workouts", "total_activity_logs", 500),

    # --- Reading ---
    AchievementDefinition("book_1", "Первая книга", "Прочитана первая книга", "📖", Rarity.common, "reading", "total_books_finished", 1),
    AchievementDefinition("book_5", "Читатель", "5 прочитанных книг", "📖", Rarity.common, "reading", "total_books_finished", 5),
    AchievementDefinition("book_10", "Книголюб", "10 прочитанных книг", "📚", Rarity.rare, "reading", "total_books_finished", 10),
    AchievementDefinition("book_25", "Эрудит", "25 прочитанных книг", "🎓", Rarity.epic, "reading", "total_books_finished", 25),
    AchievementDefinition("book_50", "Мудрец", "50 прочитанных книг", "🧠", Rarity.legendary, "reading", "total_books_finished", 50),

    # --- Discipline ---
    AchievementDefinition("discipline_week", "Идеальная неделя", "Все привычки выполнены 7 дней подряд", "🌈", Rarity.rare, "discipline", "perfect_days_streak", 7),
    AchievementDefinition("discipline_month", "Идеальный месяц", "Все привычки выполнены 30 дней подряд", "🏵️", Rarity.legendary, "discipline", "perfect_days_streak", 30),

    # --- Goals ---
    AchievementDefinition("goal_first", "Первая цель", "Выполнена первая цель", "🎯", Rarity.common, "goals", "completed_goals_count", 1),
    AchievementDefinition("goal_10", "Целеустремлённый", "Выполнено 10 целей", "🎯", Rarity.epic, "goals", "completed_goals_count", 10),
    AchievementDefinition("goal_month_all", "Идеальный месяц целей", "Все цели месяца выполнены", "🚀", Rarity.legendary, "goals", "goals_completed_this_month", 1),
]

ACHIEVEMENTS_BY_KEY: dict[str, AchievementDefinition] = {a.key: a for a in ACHIEVEMENTS}
