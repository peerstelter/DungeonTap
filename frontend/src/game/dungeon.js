// Seeded PRNG (mulberry32)
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function hashSeed(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function getDailySeed() {
  const today = new Date().toISOString().slice(0, 10)
  return hashSeed(`dungeontap-daily-${today}`)
}

// Per-floor deterministic seed — floor N is always the same for a given daily seed
function floorSeed(seed, floor) {
  return (seed ^ (floor * 0x9E3779B9)) >>> 0
}

// Get a single deterministic room for any floor number
export function getRoomAtFloor(seed, floor) {
  const rng = mulberry32(floorSeed(seed, floor))
  return { floor, type: pickInfiniteRoomType(rng, floor), cleared: false }
}

// Infinite daily dungeon room types — no fixed final boss floor
function pickInfiniteRoomType(rng, floor) {
  if (floor % 10 === 0) return 'mid_boss' // Named boss every 10 floors
  if (floor % 5  === 0) return 'shop'     // Shop every 5 (not on boss floors)
  if (floor > 3 && floor % 3 === 0) return 'elite'

  const roll = rng()
  if (roll < 0.48) return 'combat'
  if (roll < 0.60) return 'elite'
  if (roll < 0.70) return 'event'
  if (roll < 0.76) return 'trap'
  if (roll < 0.88) return 'rest'
  return 'treasure'
}

const DAILY_PREVIEW = 14 // Pre-generate this many rooms for the map

// Infinite seeded dungeon for daily mode — extends on demand
export function generateInfiniteDungeon(seed) {
  const rooms = []
  for (let f = 1; f <= DAILY_PREVIEW; f++) {
    rooms.push(getRoomAtFloor(seed, f))
  }
  return { seed, rooms, infinite: true }
}

// Standard finite dungeon for normal runs (unchanged)
export function generateDungeon(seed) {
  const rng = mulberry32(seed)
  const rooms = []
  const totalFloors = 10 + Math.floor(rng() * 5) // 10–14 floors

  for (let floor = 1; floor <= totalFloors; floor++) {
    const type = pickRoomType(rng, floor, totalFloors)
    rooms.push({ floor, type, cleared: false })
  }

  return { seed, rooms, totalFloors }
}

function pickRoomType(rng, floor, total) {
  if (floor === total) return 'boss'
  if (floor % 5 === 0) return 'shop'
  if (floor > 3 && floor % 3 === 0) return 'elite'

  const roll = rng()
  if (roll < 0.48) return 'combat'
  if (roll < 0.60) return 'elite'
  if (roll < 0.70) return 'event'
  if (roll < 0.76) return 'trap'
  if (roll < 0.88) return 'rest'
  return 'treasure'
}

// Biome theming based on floor depth
export function getBiome(floor) {
  if (floor < 10)  return 'cave'
  if (floor < 20)  return 'crypt'
  if (floor < 30)  return 'abyss'
  return 'inferno'
}

export const BIOMES = {
  cave:    { label: 'Höhle',   accent: 'text-gray-400',   border: 'border-gray-700',   glow: '' },
  crypt:   { label: 'Gruft',   accent: 'text-purple-400', border: 'border-purple-900', glow: 'shadow-purple-900/40' },
  abyss:   { label: 'Abgrund', accent: 'text-blue-400',   border: 'border-blue-900',   glow: 'shadow-blue-900/40' },
  inferno: { label: 'Inferno', accent: 'text-red-400',    border: 'border-red-900',    glow: 'shadow-red-900/40' },
}

export const ROOM_TYPES = {
  combat:   { label: 'Kampf',    icon: '⚔️' },
  elite:    { label: 'Elite',    icon: '💢' },
  rest:     { label: 'Rast',     icon: '🔥' },
  treasure: { label: 'Schatz',   icon: '💰' },
  shop:     { label: 'Händler',  icon: '🏪' },
  event:    { label: 'Ereignis', icon: '❓' },
  trap:     { label: 'Falle',    icon: '⚠️' },
  boss:     { label: 'BOSS',     icon: '💀' },
  mid_boss: { label: 'BOSS',     icon: '👑' },
}
