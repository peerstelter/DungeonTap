// Combat state machine
// States: player_turn | enemy_telegraph | resolve | victory | defeat

// Attacks that can't be fully dodged (too powerful)
// unless player has the 'alwaysDodge' perk
const UNDODGEABLE = new Set(['heavy', 'rage', 'fire_breath'])

export function createCombatState(player, monster) {
  return {
    phase: 'player_turn',
    player: { ...player, maxHp: player.maxHp },
    monster: { ...monster },
    log: [],
    specialBar: 0,          // 0–100
    lastPlayerAction: null, // 'attack' | 'block' | 'dodge' | 'special'
    pendingEnemyMove: null, // 'normal' | 'heavy' | 'quick' | 'rage' | 'fire_breath' | 'drain'
    enemyMoveIndex: 0,
    dodgeBonus: false,
  }
}

// timingBonus: 1.0 = normal, 2.0 = perfect timing (Guitar Hero)
export function applyPlayerAction(state, action, timingBonus = 1.0) {
  if (state.phase !== 'player_turn') return state

  let { player, monster, log, specialBar } = state

  // fastSpecial perk: +35% special charge per hit
  const specialGain = player.fastSpecial ? 30 : 22

  switch (action) {
    case 'attack': {
      const dmg = Math.max(1, player.atk - Math.floor(monster.def * 0.5) + randInt(-2, 3))
      monster = { ...monster, hp: monster.hp - dmg }
      log = [...log, { type: 'player_attack', dmg }]
      specialBar = Math.min(100, specialBar + specialGain)

      // lifesteal perk: heal 8% of damage dealt
      if (player.lifesteal) {
        const heal = Math.max(1, Math.round(dmg * 0.08))
        player = { ...player, hp: Math.min(player.maxHp, player.hp + heal) }
      }
      break
    }
    case 'special': {
      if (specialBar < 100) return state
      const perfect = timingBonus > 1.0
      const dmg = Math.max(1,
        Math.round(player.atk * player.specialEffect.damage * timingBonus)
        - Math.floor(monster.def * 0.5)
      )
      monster = { ...monster, hp: monster.hp - dmg }
      log = [...log, { type: 'player_special', dmg, perfect }]
      specialBar = 0

      // lifesteal also applies to special
      if (player.lifesteal) {
        const heal = Math.max(1, Math.round(dmg * 0.08))
        player = { ...player, hp: Math.min(player.maxHp, player.hp + heal) }
      }
      break
    }
    default:
      return state
  }

  if (monster.hp <= 0) {
    return { ...state, phase: 'victory', player, monster: { ...monster, hp: 0 }, log, specialBar }
  }

  return {
    ...state,
    phase: 'enemy_telegraph',
    player,
    monster,
    log,
    specialBar,
    lastPlayerAction: action,
    pendingEnemyMove: nextEnemyMove(state),
    dodgeBonus: action === 'dodge',
  }
}

export function applyBlock(state) {
  if (state.phase !== 'enemy_telegraph') return state
  return { ...state, lastPlayerAction: 'block' }
}

export function applyDodge(state) {
  if (state.phase !== 'enemy_telegraph') return state
  return { ...state, lastPlayerAction: 'dodge', dodgeBonus: true }
}

export function resolveEnemyAttack(state) {
  if (state.phase !== 'enemy_attack' && state.phase !== 'enemy_telegraph') return state

  let { player, monster, log, pendingEnemyMove, lastPlayerAction, dodgeBonus } = state

  const move = pendingEnemyMove
  let rawDmg = calcEnemyDamage(monster, move)

  // Player DEF mitigates incoming damage (40% effectiveness)
  const defMitigation = Math.floor(player.def * 0.4)
  let dmg = Math.max(1, rawDmg - defMitigation)

  // alwaysDodge perk makes every attack dodgeable
  const canDodge = !UNDODGEABLE.has(move) || (player.alwaysDodge ?? false)

  // toughBlock perk: block absorbs 65% instead of 55%
  const blockReduction = player.toughBlock ? 0.30 : 0.45

  let monsterHeal = 0

  if (lastPlayerAction === 'block') {
    dmg = Math.max(1, Math.round(dmg * blockReduction))
    log = [...log, { type: 'player_blocked', move, dmg }]
  } else if (lastPlayerAction === 'dodge' && dodgeBonus && canDodge) {
    dmg = 0
    log = [...log, { type: 'player_dodged', move }]
  } else if (lastPlayerAction === 'dodge' && dodgeBonus && !canDodge) {
    // Glancing blow against undodgeable without alwaysDodge
    dmg = Math.max(1, Math.round(dmg * 0.6))
    log = [...log, { type: 'player_grazed', move, dmg }]
  } else {
    log = [...log, { type: 'enemy_attack', move, dmg }]
  }

  // Drain: monster heals 50% of dealt damage
  if (move === 'drain' && dmg > 0) {
    monsterHeal = Math.round(dmg * 0.5)
  }

  player  = { ...player,  hp: player.hp - dmg }
  monster = { ...monster, hp: Math.min(monster.maxHp, monster.hp + monsterHeal) }

  if (player.hp <= 0) {
    return { ...state, phase: 'defeat', player: { ...player, hp: 0 }, monster, log }
  }

  return {
    ...state,
    phase: 'player_turn',
    player,
    monster,
    log,
    pendingEnemyMove: null,
    lastPlayerAction: null,
    dodgeBonus: false,
    enemyMoveIndex: state.enemyMoveIndex + 1,
  }
}

function nextEnemyMove(state) {
  const pattern = state.monster.attackPattern
  return pattern[state.enemyMoveIndex % pattern.length]
}

function calcEnemyDamage(monster, move) {
  const base = monster.atk + randInt(-1, 4)
  switch (move) {
    case 'heavy':       return Math.round(base * 2.0)
    case 'quick':       return Math.round(base * 0.7)
    case 'rage':        return Math.round(base * 2.4)
    case 'fire_breath': return Math.round(base * 2.8)
    case 'drain':       return Math.round(base * 1.2)
    default:            return base
  }
}

export const ATTACK_LABELS = {
  normal:      { label: 'Angriff',           color: 'text-orange-400', warn: false, dodgeable: true  },
  heavy:       { label: '⚠ WUCHT',           color: 'text-red-500',    warn: true,  dodgeable: false },
  quick:       { label: 'Schnell!',          color: 'text-yellow-400', warn: false, dodgeable: true  },
  rage:        { label: '⚠⚠ WUTANFALL',     color: 'text-red-600',    warn: true,  dodgeable: false },
  fire_breath: { label: '🔥 FEUERATEM',      color: 'text-orange-500', warn: true,  dodgeable: false },
  drain:       { label: '🩸 LEBENSENTZUG',   color: 'text-pink-400',   warn: false, dodgeable: true  },
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
