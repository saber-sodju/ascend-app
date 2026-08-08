import enum


class Rarity(str, enum.Enum):
    common = "common"
    rare = "rare"
    epic = "epic"
    legendary = "legendary"


RARITY_XP_BONUS: dict[Rarity, int] = {
    Rarity.common: 50,
    Rarity.rare: 150,
    Rarity.epic: 350,
    Rarity.legendary: 750,
}
