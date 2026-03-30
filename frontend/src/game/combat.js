// Combat state machine
// States: player_turn | enemy_telegraph | resolve | victory | defeat

// Attacks that can't be fully dodged (too powerful)
const UNDODGEABLE = new Set(['heavy', 'rage', 'fire_breath'])

export function createCombatState(player, monster) {
  return {
    phase: 'player_turn',
    player: { ...player, maxHp: player.maxHp },
    monster: { ...monster },
    log: [],
    specialBar: 0,          // 0–100
    lastPlayerAction: null, // 'attack' | 'block' | 'dodge' | 'special'
    pendingEnemyMove: null, // 'normal' | 'heavy' | 'quick' | 'rage' | 'fire_breath'
    enemyMoveIndex: 0,
    dodgeBonus: false,
  }
}

export function applyPlayerAction(state, action) {
  if (state.phase !== 'player_turn') return state

  let { player, monster, log, specialBar } = state

  switch (action) {
    case 'attack': {
      const dmg = Math.max(1, player.atk - Math.floor(monster.def * 0.5) + randInt(-2, 3))
      monster = { ...monster, hp: monster.hp - dmg }
      log = [...log, { type: 'player_attack', dmg }]
      specialBar = Math.min(100, specialBar + 14)
      break
    }
    case 'dodge': {
      log = [...log, { type: 'player_dodge' }]
      specialBar = Math.min(100, specialBar + 6)
      break
    }
    case 'special': {
      if (specialBar < 100) return state
      const dmg = Math.max(1, Math.round(player.atk * player.specialEffect.damage) - Math.floor(monster.def * 0.5))
      monster = { ...monster, hp: monster.hp - dmg }
      log = [...log, { type: 'player_special', dmg }]
      specialBar = 0
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

export function resolveEnemyAttack(state) {
  if (state.phase !== 'enemy_attack' && state.phase !== 'enemy_telegraph') return state

  let { player, monster, log, pendingEnemyMove, lastPlayerAction, dodgeBonus } = state

  const move = pendingEnemyMove
  let dmg = calcEnemyDamage(monster, move)
  const canDodge = !UNDODGEABLE.has(move)

  if (lastPlayerAction === 'block') {
    // Block absorbs 55% – player still takes 45%
    dmg = Math.max(1, Math.round(dmg * 0.45))
    log = [...log, { type: 'player_blocked', move, dmg }]
  } else if (lastPlayerAction === 'dodge' && dodgeBonus && canDodge) {
    dmg = 0
    log = [...log, { type: 'player_dodged', move }]
  } else if (lastPlayerAction === 'dodge' && dodgeBonus && !canDodge) {
    // Can't dodge heavy hits – glancing blow instead
    dmg = Math.max(1, Math.round(dmg * 0.6))
    log = [...log, { type: 'player_grazed', move, dmg }]
  } else {
    log = [...log, { type: 'enemy_attack', move, dmg }]
  }

  player = { ...player, hp: player.hp - dmg }

  if (player.hp <= 0) {
    return { ...state, phase: 'defeat', player: { ...player, hp: 0 }, log }
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
    default:            return base
  }
}

export const ATTACK_LABELS = {
  normal:      { label: 'Angriff',        color: 'text-orange-400', warn: false, dodgeable: true  },
  heavy:       { label: '⚠ WUCHT',        color: 'text-red-500',    warn: true,  dodgeable: false },
  quick:       { label: 'Schnell!',       color: 'text-yellow-400', warn: false, dodgeable: true  },
  rage:        { label: '⚠⚠ WUTANFALL',  color: 'text-red-600',    warn: true,  dodgeable: false },
  fire_breath: { label: '🔥 FEUERATEM',   color: 'text-orange-500', warn: true,  dodgeable: false },
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
