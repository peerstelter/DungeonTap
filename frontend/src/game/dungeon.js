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
  if (floor === total) return 'boss'
  if (floor % 5 === 0) return 'shop'

  const roll = rng()
  if (roll < 0.6) return 'combat'
  if (roll < 0.8) return 'combat' // still combat but could be elite later
  if (roll < 0.92) return 'rest'
  return 'treasure'
}

export const ROOM_TYPES = {
  combat:   { label: 'Kampf',    icon: '⚔️' },
  rest:     { label: 'Rast',     icon: '🔥' },
  treasure: { label: 'Schatz',   icon: '💰' },
  shop:     { label: 'Händler',  icon: '🏪' },
  boss:     { label: 'Boss',     icon: '💀' },
}
