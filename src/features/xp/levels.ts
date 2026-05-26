// Calcul des paliers d'XP et des niveaux (1 → 100).
// Formule reprise de l'architecture v1.0 :
//   - L1 : 100 XP
//   - L2 : 120 XP
//   - L3 → L20 : +15 XP par niveau (croissance douce)
//   - L21 → L100 : +50 XP par niveau (croissance accélérée)

export const MAX_LEVEL = 100;

export function getXpThreshold(level: number): number {
  if (level <= 0) return 0;
  if (level === 1) return 100;
  if (level === 2) return 120;
  if (level <= 20) {
    return 120 + (level - 2) * 15;
  }
  const xpAtL20 = 120 + 18 * 15; // 390
  return xpAtL20 + (level - 20) * 50;
}

export function getCumulativeXp(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) total += getXpThreshold(i);
  return total;
}

export function getLevelFromXp(totalXp: number): number {
  let level = 0;
  let cumul = 0;
  while (level < MAX_LEVEL) {
    const next = getXpThreshold(level + 1);
    if (cumul + next > totalXp) break;
    cumul += next;
    level++;
  }
  return level;
}

export type XpProgress = {
  level: number;
  xpInLevel: number;
  xpForNextLevel: number;
  percent: number;
  totalXp: number;
  isMaxLevel: boolean;
};

export function getXpProgress(totalXp: number): XpProgress {
  const level = getLevelFromXp(totalXp);
  if (level >= MAX_LEVEL) {
    return {
      level: MAX_LEVEL,
      xpInLevel: 0,
      xpForNextLevel: 0,
      percent: 100,
      totalXp,
      isMaxLevel: true,
    };
  }
  const cumulAtLevel = getCumulativeXp(level);
  const xpInLevel = totalXp - cumulAtLevel;
  const xpForNextLevel = getXpThreshold(level + 1);
  return {
    level,
    xpInLevel,
    xpForNextLevel,
    percent: Math.min(100, Math.round((xpInLevel / xpForNextLevel) * 100)),
    totalXp,
    isMaxLevel: false,
  };
}
