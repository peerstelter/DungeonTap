// ─── Achievement Definitions ─────────────────────────────────────────────────

export const ACHIEVEMENTS = [
  { id: 'first_kill',     icon: '⚔️',  title: 'Erster Kill',       desc: 'Besiege deinen ersten Gegner' },
  { id: 'floor_10',       icon: '🪨',  title: 'Tiefer steigen',    desc: 'Erreiche Etage 10' },
  { id: 'floor_20',       icon: '🌑',  title: 'Abgrundläufer',     desc: 'Erreiche Etage 20' },
  { id: 'floor_30',       icon: '🔥',  title: 'Inferno-Bezwinger', desc: 'Erreiche Etage 30' },
  { id: 'level_5',        icon: '⬆️',  title: 'Veteran',           desc: 'Erreiche Level 5' },
  { id: 'level_10',       icon: '🌟',  title: 'Legende',           desc: 'Erreiche Level 10' },
  { id: 'win_run',        icon: '🏅',  title: 'Dungeon-Meister',   desc: 'Schließe einen normalen Run ab' },
  { id: 'boss_slayer',    icon: '💀',  title: 'Boss-Besieger',     desc: 'Besiege einen Endgegner' },
  { id: 'class_warrior',  icon: '🛡️', title: 'Krieger',           desc: 'Spiele als Krieger' },
  { id: 'class_mage',     icon: '🔮',  title: 'Magier',            desc: 'Spiele als Magier' },
  { id: 'class_rogue',    icon: '🗡️', title: 'Schurke',           desc: 'Spiele als Schurke' },
  { id: 'all_classes',    icon: '🎭',  title: 'Alleskönner',       desc: 'Spiele alle 3 Klassen' },
  { id: 'daily_hero',     icon: '📅',  title: 'Täglich dabei',     desc: 'Spiele den täglichen Dungeon' },
  { id: 'perk_collector', icon: '✨',  title: 'Perk-Sammler',      desc: 'Sammle 5 Perks in einem Run' },
]

const KEY         = 'dungeontap_achievements'
const CLASSES_KEY = 'dungeontap_classes_played'

export function loadAchievements() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

function unlockAchievement(id) {
  const current = loadAchievements()
  if (current[id]) return false
  current[id] = { unlockedAt: Date.now() }
  localStorage.setItem(KEY, JSON.stringify(current))
  return true
}

// Track which classes have ever been played (across all runs)
function trackClass(cls) {
  try {
    const played = JSON.parse(localStorage.getItem(CLASSES_KEY) || '[]')
    if (!played.includes(cls)) {
      played.push(cls)
      localStorage.setItem(CLASSES_KEY, JSON.stringify(played))
    }
    return played
  } catch { return [cls] }
}

// Called at the end of each run — returns IDs of newly unlocked achievements
export function checkAndUnlockAchievements(player, won, isDaily) {
  const newlyUnlocked = []

  function check(id, condition) {
    if (condition && unlockAchievement(id)) newlyUnlocked.push(id)
  }

  check('first_kill',     player.kills >= 1)
  check('floor_10',       player.floor >= 10)
  check('floor_20',       player.floor >= 20)
  check('floor_30',       player.floor >= 30)
  check('level_5',        player.level >= 5)
  check('level_10',       player.level >= 10)
  check('win_run',        won && !isDaily)
  // boss_slayer: won a normal run (final boss) OR passed floor 10 (mid-boss) in daily
  check('boss_slayer',    (won && !isDaily) || player.floor >= 11)
  check('daily_hero',     isDaily)
  check('perk_collector', (player.activePerks?.length ?? 0) >= 5)

  // Class achievements
  check(`class_${player.class}`, true)
  const classesPlayed = trackClass(player.class)
  check('all_classes', ['warrior', 'mage', 'rogue'].every(c => classesPlayed.includes(c)))

  return newlyUnlocked
}
