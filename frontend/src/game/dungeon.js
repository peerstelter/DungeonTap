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
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return hashSeed(`dungeontap-daily-${today}`)
}

export function generateDungeon(seed) {
  const rng = mulberry32(seed)

  const rooms = []
  const totalFloors = 10 + Math.floor(rng() * 5) // 10–14 floors per run

  for (let floor = 1; floor <= totalFloors; floor++) {
    const type = pickRoomType(rng, floor, totalFloors)
    rooms.push({ floor, type, cleared: false })
  }

  return { seed, rooms, totalFloors }
}

function pickRoomType(rng, floor, total) {
  // Fixed rooms
  if (floor === total) return 'boss'
  if (floor % 5 === 0) return 'shop'
  // Elite every 3rd floor (after floor 3), guaranteed challenge
  if (floor > 3 && floor % 3 === 0) return 'elite'

  const roll = rng()
  if (roll < 0.48) return 'combat'
  if (roll < 0.60) return 'elite'
  if (roll < 0.70) return 'event'
  if (roll < 0.76) return 'trap'
  if (roll < 0.88) return 'rest'
  return 'treasure'
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
}
