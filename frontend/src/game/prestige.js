// Prestige / Meta-Progression
// Points earned each run, spent on permanent bonuses that carry across all future runs.

const PRESTIGE_KEY = 'dungeontap_prestige'

export const PRESTIGE_UPGRADES = [
  {
    id: 'veteran',
    icon: '❤️',
    title: 'Veteran',
    desc: '+15 Start-HP',
    maxLevel: 2,
    cost: [3, 7],
    apply: (player, level) => ({
      ...player,
      hp: player.hp + level * 15,
      maxHp: player.maxHp + level * 15,
    }),
  },
  {
    id: 'goldgier',
    icon: '💰',
    title: 'Goldgier',
    desc: '+25 Start-Gold',
    maxLevel: 2,
    cost: [3, 7],
    apply: (player, level) => ({ ...player, gold: player.gold + level * 25 }),
  },
  {
    id: 'kampfgeist',
    icon: '⚔️',
    title: 'Kampfgeist',
    desc: '+5 Start-ATK',
    maxLevel: 2,
    cost: [3, 7],
    apply: (player, level) => ({ ...player, atk: player.atk + level * 5 }),
  },
  {
    id: 'haertung',
    icon: '🛡️',
    title: 'Härtung',
    desc: '+4 Start-DEF',
    maxLevel: 2,
    cost: [3, 7],
    apply: (player, level) => ({ ...player, def: player.def + level * 4 }),
  },
  {
    id: 'studium',
    icon: '📚',
    title: 'Studium',
    desc: '4 Perk-Optionen statt 3 beim Level-Up',
    maxLevel: 1,
    cost: [6],
    apply: (player, level) => ({ ...player, perkOptions: level > 0 ? 4 : 3 }),
  },
]

export function loadPrestige() {
  try {
    return JSON.parse(localStorage.getItem(PRESTIGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function savePrestige(data) {
  localStorage.setItem(PRESTIGE_KEY, JSON.stringify(data))
}

export function getPrestigePoints() {
  return loadPrestige().points ?? 0
}

// Calculate points earned for a run (does not save — call addPrestigePoints separately)
export function earnPrestigePoints(player, won) {
  const floorPoints = Math.max(1, Math.floor(player.floor / 3))
  const winBonus = won ? 3 : 0
  const milestoneBonus = player.floor >= 20 ? 2 : player.floor >= 10 ? 1 : 0
  return floorPoints + winBonus + milestoneBonus
}

export function addPrestigePoints(points) {
  const data = loadPrestige()
  data.points = (data.points ?? 0) + points
  savePrestige(data)
  return data.points
}

// Returns false if insufficient points or already maxed
export function buyPrestigeUpgrade(upgradeId) {
  const upgrade = PRESTIGE_UPGRADES.find(u => u.id === upgradeId)
  if (!upgrade) return false

  const data = loadPrestige()
  const currentLevel = data[upgradeId] ?? 0
  if (currentLevel >= upgrade.maxLevel) return false

  const cost = upgrade.cost[currentLevel]
  if ((data.points ?? 0) < cost) return false

  data[upgradeId] = currentLevel + 1
  data.points = (data.points ?? 0) - cost
  savePrestige(data)
  return true
}

// Apply all purchased prestige bonuses to a fresh player object
export function applyPrestigeBonuses(player) {
  const data = loadPrestige()
  let p = { ...player }
  for (const upgrade of PRESTIGE_UPGRADES) {
    const level = data[upgrade.id] ?? 0
    if (level > 0) {
      p = upgrade.apply(p, level)
    }
  }
  return p
}
