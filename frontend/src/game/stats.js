const STATS_KEY = 'dungeontap_stats'

export function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || '{}')
  } catch {
    return {}
  }
}

export function updateStats(player, won) {
  const s = loadStats()
  const updated = {
    totalRuns:   (s.totalRuns  ?? 0) + 1,
    totalKills:  (s.totalKills ?? 0) + (player.kills ?? 0),
    totalGold:   (s.totalGold  ?? 0) + (player.gold  ?? 0),
    totalDeaths: (s.totalDeaths ?? 0) + (won ? 0 : 1),
    totalWins:   (s.totalWins  ?? 0) + (won ? 1 : 0),
    maxFloor:    Math.max(s.maxFloor ?? 0, player.floor ?? 0),
    classCounts: {
      ...(s.classCounts ?? {}),
      [player.class]: ((s.classCounts ?? {})[player.class] ?? 0) + 1,
    },
  }
  localStorage.setItem(STATS_KEY, JSON.stringify(updated))
}

export function mostPlayedClass(classCounts = {}) {
  const entries = Object.entries(classCounts)
  if (entries.length === 0) return null
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
}
