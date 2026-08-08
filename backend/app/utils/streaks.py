from typing import List, Sequence
from datetime import date, timedelta


def calculate_streak(logs: Sequence) -> tuple[int, int]:
    if not logs:
        return 0, 0
    sorted_logs = sorted([l for l in logs if l.completed], key=lambda x: x.date, reverse=True)
    if not sorted_logs:
        return 0, 0
    current = 0
    today = date.today()
    check = today
    for log in sorted_logs:
        if log.date == check or log.date == check - timedelta(days=1):
            current += 1
            check = log.date - timedelta(days=1)
        else:
            break
    longest = 0
    current_run = 1
    for i in range(1, len(sorted_logs)):
        if (sorted_logs[i - 1].date - sorted_logs[i].date).days == 1:
            current_run += 1
            longest = max(longest, current_run)
        else:
            current_run = 1
    longest = max(longest, current_run)
    return current, longest
