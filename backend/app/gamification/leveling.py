from dataclasses import dataclass

# XP needed to go from level N to N+1 grows linearly: LEVEL_XP_BASE + LEVEL_XP_STEP * (N - 1).
# Change these two constants (or swap xp_for_level entirely) to retune the whole progression —
# nothing else in the codebase encodes level math.
LEVEL_XP_BASE = 100
LEVEL_XP_STEP = 50


def xp_for_level(level: int) -> int:
    """Total XP required to REACH `level` (level 1 always starts at 0 XP)."""
    if level <= 1:
        return 0
    n = level - 1
    return n * LEVEL_XP_BASE + LEVEL_XP_STEP * n * (n - 1) // 2


@dataclass
class LevelInfo:
    level: int
    xp: int
    floor_xp: int
    next_level_xp: int
    progress_percent: float


def level_from_xp(xp: int) -> LevelInfo:
    xp = max(0, xp)
    level = 1
    while xp_for_level(level + 1) <= xp:
        level += 1
    floor_xp = xp_for_level(level)
    next_level_xp = xp_for_level(level + 1)
    span = next_level_xp - floor_xp
    progress_percent = round((xp - floor_xp) / span * 100, 1) if span else 100.0
    return LevelInfo(level=level, xp=xp, floor_xp=floor_xp, next_level_xp=next_level_xp, progress_percent=progress_percent)
