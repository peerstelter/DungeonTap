export const MONSTERS = {
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
    isBoss: false,
  },
}

// Which monsters appear per dungeon floor range
export const FLOOR_ENCOUNTERS = [
  { floors: [1, 3], pool: ['goblin', 'slime'] },
  { floors: [4, 6], pool: ['goblin', 'slime', 'skeleton'] },
  { floors: [7, 10], pool: ['skeleton', 'orc'] },
  { floors: [11, 99], pool: ['orc', 'dragon_whelp'] },
]

export function getMonsterForFloor(floor) {
  const entry = FLOOR_ENCOUNTERS.findLast(e => floor >= e.floors[0]) ?? FLOOR_ENCOUNTERS[0]
  const id = entry.pool[Math.floor(Math.random() * entry.pool.length)]
  const base = MONSTERS[id]
  // Scale stats with floor
  const scale = 1 + (floor - 1) * 0.12
  return {
    ...base,
    hp: Math.round(base.hp * scale),
    maxHp: Math.round(base.hp * scale),
    atk: Math.round(base.atk * scale),
    def: Math.round(base.def * scale),
  }
}
