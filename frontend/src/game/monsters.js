export const MONSTERS = {
  rat: {
    id: 'rat',
    name: 'Ratte',
    icon: '🐀',
    hp: 22,
    atk: 7,
    def: 0,
    xp: 6,
    loot: [{ item: 'gold', amount: [1, 6], chance: 0.6 }],
    attackPattern: ['quick', 'quick', 'quick', 'normal'],
    attackDelay: 1200,
  },
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    icon: '👺',
    hp: 50,
    atk: 14,
    def: 2,
    xp: 15,
    loot: [
      { item: 'gold', amount: [5, 15], chance: 1.0 },
      { item: 'potion_small', chance: 0.2 },
    ],
    attackPattern: ['normal', 'normal', 'quick'],
    attackDelay: 1800,
  },
  slime: {
    id: 'slime',
    name: 'Schleim',
    icon: '🟢',
    hp: 38,
    atk: 10,
    def: 0,
    xp: 10,
    loot: [
      { item: 'gold', amount: [3, 10], chance: 0.7 },
      { item: 'slime_goo', chance: 0.4 },
    ],
    attackPattern: ['normal', 'quick', 'quick'],
    attackDelay: 1400,
  },
  skeleton: {
    id: 'skeleton',
    name: 'Skelett',
    icon: '💀',
    hp: 70,
    atk: 20,
    def: 5,
    xp: 25,
    loot: [
      { item: 'gold', amount: [8, 20], chance: 1.0 },
      { item: 'bone_shield', chance: 0.15 },
    ],
    attackPattern: ['normal', 'heavy', 'normal'],
    attackDelay: 2200,
  },
  dark_elf: {
    id: 'dark_elf',
    name: 'Dunkelelfe',
    icon: '🧝',
    hp: 85,
    atk: 24,
    def: 6,
    xp: 35,
    loot: [
      { item: 'gold', amount: [12, 28], chance: 1.0 },
      { item: 'elven_blade', chance: 0.2 },
    ],
    attackPattern: ['quick', 'normal', 'quick', 'heavy'],
    attackDelay: 1600,
  },
  orc: {
    id: 'orc',
    name: 'Ork',
    icon: '👹',
    hp: 110,
    atk: 28,
    def: 8,
    xp: 40,
    loot: [
      { item: 'gold', amount: [15, 35], chance: 1.0 },
      { item: 'orc_axe', chance: 0.2 },
      { item: 'potion_medium', chance: 0.15 },
    ],
    attackPattern: ['normal', 'normal', 'heavy', 'rage'],
    attackDelay: 2600,
  },
  stone_golem: {
    id: 'stone_golem',
    name: 'Steingolem',
    icon: '🗿',
    hp: 220,
    atk: 30,
    def: 8,   // High HP compensates; DEF 18 made it nearly unkillable
    xp: 60,
    loot: [
      { item: 'gold', amount: [20, 45], chance: 1.0 },
      { item: 'stone_core', chance: 0.25 },
    ],
    attackPattern: ['heavy', 'normal', 'heavy', 'heavy', 'rage'],
    attackDelay: 3000,
  },
  vampire: {
    id: 'vampire',
    name: 'Vampir',
    icon: '🧛',
    hp: 130,
    atk: 30,
    def: 8,
    xp: 65,
    loot: [
      { item: 'gold', amount: [25, 50], chance: 1.0 },
      { item: 'blood_vial', chance: 0.3 },
    ],
    attackPattern: ['normal', 'quick', 'drain', 'normal', 'heavy'],
    attackDelay: 2000,
  },
  dragon_whelp: {
    id: 'dragon_whelp',
    name: 'Drachenjunges',
    icon: '🐉',
    hp: 170,
    atk: 38,
    def: 12,
    xp: 80,
    loot: [
      { item: 'gold', amount: [30, 60], chance: 1.0 },
      { item: 'dragon_scale', chance: 0.35 },
      { item: 'potion_large', chance: 0.25 },
    ],
    attackPattern: ['normal', 'heavy', 'fire_breath', 'normal', 'heavy'],
    attackDelay: 2800,
  },
  boss_dragon: {
    id: 'boss_dragon',
    name: 'DRACHENLORD',
    icon: '🔥',
    hp: 350,
    atk: 32,   // Reduced from 45; fire_breath still brutal but survivable when blocked
    def: 14,
    xp: 200,
    isBoss: true,
    loot: [{ item: 'gold', amount: [80, 150], chance: 1.0 }],
    attackPattern: ['normal', 'heavy', 'fire_breath', 'normal', 'rage', 'fire_breath'],
    attackDelay: 2400,
  },
  // ─── Deep Floor Monsters (floors 15+) ──────────────────────────────────────
  wraith: {
    id: 'wraith',
    name: 'Geist',
    icon: '👻',
    hp: 160,
    atk: 42,
    def: 4,
    xp: 90,
    loot: [{ item: 'gold', amount: [35, 65], chance: 1.0 }],
    attackPattern: ['quick', 'normal', 'quick', 'heavy'],
    attackDelay: 1800,
  },
  lich: {
    id: 'lich',
    name: 'Lich',
    icon: '🧟',
    hp: 200,
    atk: 48,
    def: 6,
    xp: 110,
    loot: [{ item: 'gold', amount: [45, 80], chance: 1.0 }],
    attackPattern: ['normal', 'drain', 'fire_breath', 'heavy', 'drain'],
    attackDelay: 2200,
  },
  demon: {
    id: 'demon',
    name: 'Dämon',
    icon: '😈',
    hp: 240,
    atk: 55,
    def: 10,
    xp: 140,
    loot: [{ item: 'gold', amount: [60, 100], chance: 1.0 }],
    attackPattern: ['normal', 'rage', 'fire_breath', 'heavy', 'rage'],
    attackDelay: 2600,
  },
  // ─── Mid-Boss Pool ───────────────────────────────────────────────────────────
  cave_troll: {
    id: 'cave_troll',
    name: 'Höhlentroll',
    icon: '👾',
    hp: 320,
    atk: 36,
    def: 12,
    xp: 150,
    isMidBoss: true,
    loot: [{ item: 'gold', amount: [50, 90], chance: 1.0 }],
    attackPattern: ['heavy', 'normal', 'rage', 'heavy', 'normal', 'rage'],
    attackDelay: 2800,
  },
  crypt_lord: {
    id: 'crypt_lord',
    name: 'Gruftherr',
    icon: '💀',
    hp: 400,
    atk: 42,
    def: 14,
    xp: 200,
    isMidBoss: true,
    loot: [{ item: 'gold', amount: [70, 110], chance: 1.0 }],
    attackPattern: ['normal', 'drain', 'heavy', 'rage', 'drain', 'fire_breath'],
    attackDelay: 2600,
  },
  shadow_mage: {
    id: 'shadow_mage',
    name: 'Schattenmagier',
    icon: '🧙',
    hp: 360,
    atk: 50,
    def: 8,
    xp: 250,
    isMidBoss: true,
    loot: [{ item: 'gold', amount: [90, 140], chance: 1.0 }],
    attackPattern: ['quick', 'fire_breath', 'normal', 'fire_breath', 'heavy', 'drain'],
    attackDelay: 2200,
  },
  infernal_knight: {
    id: 'infernal_knight',
    name: 'Infernokrieger',
    icon: '🔱',
    hp: 500,
    atk: 58,
    def: 18,
    xp: 320,
    isMidBoss: true,
    loot: [{ item: 'gold', amount: [110, 180], chance: 1.0 }],
    attackPattern: ['heavy', 'rage', 'fire_breath', 'heavy', 'rage', 'normal', 'fire_breath'],
    attackDelay: 2400,
  },
}

// Tier 1: floor 1–3   → easy intro
// Tier 2: floor 4–8   → medium difficulty
// Tier 3: floor 9–14  → hard, all powerful monsters
export const FLOOR_ENCOUNTERS = [
  { floors: [1, 2], pool: ['rat', 'rat', 'slime'] },
  { floors: [3, 4], pool: ['goblin', 'slime', 'skeleton'] },
  { floors: [5, 7], pool: ['skeleton', 'dark_elf', 'goblin'] },
  { floors: [8, 10], pool: ['orc', 'stone_golem', 'dark_elf'] },
  { floors: [11, 13], pool: ['vampire', 'dragon_whelp', 'stone_golem'] },
  { floors: [14, 19], pool: ['dragon_whelp', 'vampire', 'dragon_whelp'] },
  { floors: [20, 24], pool: ['wraith', 'dragon_whelp', 'lich'] },
  { floors: [25, 29], pool: ['lich', 'demon', 'wraith'] },
  { floors: [30, 99], pool: ['demon', 'lich', 'demon'] },
]

// ─── Scaling helpers ──────────────────────────────────────────────────────────
// Floors 1–15: +7 % per floor (same as before)
// Floors 15+:  extra +3 % per floor — no hard cap so the daily dungeon keeps escalating
function floorScale(floor) {
  const base = 1 + (floor - 1) * 0.07
  const deep = floor > 15 ? (floor - 15) * 0.03 : 0
  return Math.min(5.0, base + deep)
}
// XP multiplier grows a little faster so deeper floors feel rewarding
function floorXpScale(floor) {
  const base = 1 + (floor - 1) * 0.08
  const deep = floor > 15 ? (floor - 15) * 0.04 : 0
  return Math.min(6.0, base + deep)
}

// Elite rooms: same pool as normal but ×1.5 stats + 1.5× XP/gold + rage attack injected
export function getEliteMonsterForFloor(floor) {
  const entry = FLOOR_ENCOUNTERS.findLast(e => floor >= e.floors[0]) ?? FLOOR_ENCOUNTERS[0]
  const id = entry.pool[Math.floor(Math.random() * entry.pool.length)]
  const base = MONSTERS[id]
  const scale = floorScale(floor) * 1.5  // Elite: 1.5× on top of floor scaling
  const xpScale = floorXpScale(floor) * 1.5
  // Inject rage into attack pattern if not already present
  const pattern = base.attackPattern.includes('rage')
    ? base.attackPattern
    : [...base.attackPattern, 'rage']
  return {
    ...base,
    name: `Elite-${base.name}`,
    isElite: true,
    hp:    Math.round(base.hp * scale),
    maxHp: Math.round(base.hp * scale),
    atk:   Math.round(base.atk * scale),
    def:   Math.round(base.def * scale),
    xp:    Math.round(base.xp * xpScale),
    loot:  base.loot.map(l => l.item === 'gold'
      ? { ...l, amount: [Math.round(l.amount[0] * 1.5), Math.round(l.amount[1] * 1.5)] }
      : l
    ),
    attackPattern: pattern,
  }
}

// Mid-boss pool: rotates by (floor / 10) index
const MID_BOSS_POOL = ['cave_troll', 'crypt_lord', 'shadow_mage', 'infernal_knight']

export function getMidBossForFloor(floor, bossId = null) {
  const idx = Math.floor(floor / 10) - 1
  const id = bossId ?? MID_BOSS_POOL[Math.max(0, idx) % MID_BOSS_POOL.length]
  const base = MONSTERS[id]
  const scale = floorScale(floor) * 1.1      // Mid-boss: slightly above normal scaling
  const xpScale = floorXpScale(floor) * 1.2
  return {
    ...base,
    hp:    Math.round(base.hp * scale),
    maxHp: Math.round(base.hp * scale),
    atk:   Math.round(base.atk * scale),
    def:   Math.round(base.def * scale),
    xp:    Math.round(base.xp * xpScale),
    isMidBoss: true,
  }
}

export function getMonsterForFloor(floor, isBoss = false) {
  if (isBoss) {
    const base = MONSTERS.boss_dragon
    const scale = floorScale(floor)
    return {
      ...base,
      hp:    Math.round(base.hp * scale),
      maxHp: Math.round(base.hp * scale),
      atk:   Math.round(base.atk * scale),
      def:   Math.round(base.def * scale),
      xp:    Math.round(base.xp * floorXpScale(floor)),
    }
  }

  const entry = FLOOR_ENCOUNTERS.findLast(e => floor >= e.floors[0]) ?? FLOOR_ENCOUNTERS[0]
  const id = entry.pool[Math.floor(Math.random() * entry.pool.length)]
  const base = MONSTERS[id]

  const scale = floorScale(floor)
  const xpScale = floorXpScale(floor)
  return {
    ...base,
    hp:    Math.round(base.hp * scale),
    maxHp: Math.round(base.hp * scale),
    atk:   Math.round(base.atk * scale),
    def:   Math.round(base.def * scale),
    xp:    Math.round(base.xp * xpScale),
  }
}
