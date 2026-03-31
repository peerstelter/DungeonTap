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
    shieldActive: false,    // warrior block_counter: auto-blocks next hit
  }
}

// timingBonus: 1.0 = normal, 2.0 = perfect timing (Guitar Hero)
export function applyPlayerAction(state, action, timingBonus = 1.0) {
  if (state.phase !== 'player_turn') return state

  let { player, monster, log, specialBar, dodgeBonus } = state

  // fastSpecial perk: +35% special charge per hit
  const specialGain = player.fastSpecial ? 30 : 22

  switch (action) {
    case 'attack': {
      const dmg = Math.max(1, player.atk - Math.floor(monster.def * 0.5) + randInt(-2, 3))
      monster = { ...monster, hp: monster.hp - dmg }
      log = [...log, { type: 'player_attack', dmg }]
      specialBar = Math.min(100, specialBar + specialGain)

      if (player.lifesteal) {
        const heal = Math.max(1, Math.round(dmg * 0.08))
        player = { ...player, hp: Math.min(player.maxHp, player.hp + heal) }
      }
      break
    }

    case 'special': {
      if (specialBar < 100) return state
      const perfect = timingBonus > 1.0
      const effect = player.specialEffect

      switch (effect.type) {

        // ─── Warrior: Schildstoß ────────────────────────────────────────────
        // Hits for 1.5× ATK + auto-blocks the next enemy attack (shieldActive)
        case 'block_counter': {
          const dmg = Math.max(1,
            Math.round(player.atk * effect.damage * (perfect ? 1.4 : 1.0))
            - Math.floor(monster.def * 0.5)
          )
          monster = { ...monster, hp: monster.hp - dmg }
          log = [...log, { type: 'player_special', dmg, perfect, label: 'SCHILDSTOSS' }]
          specialBar = 0
          if (player.lifesteal) {
            const heal = Math.max(1, Math.round(dmg * 0.08))
            player = { ...player, hp: Math.min(player.maxHp, player.hp + heal) }
          }
          if (monster.hp <= 0) {
            return { ...state, phase: 'victory', player, monster: { ...monster, hp: 0 }, log, specialBar }
          }
          // Transition to telegraph with shieldActive flag — next hit auto-blocked
          return {
            ...state,
            phase: 'enemy_telegraph',
            player, monster, log, specialBar,
            lastPlayerAction: 'block',
            pendingEnemyMove: nextEnemyMove(state),
            dodgeBonus: false,
            shieldActive: true,
          }
        }

        // ─── Mage: Feuerball ────────────────────────────────────────────────
        // Two hits: first for full 2.0× ATK, second for 0.8× (echo burst)
        case 'aoe': {
          const dmg1 = Math.max(1,
            Math.round(player.atk * effect.damage * (perfect ? 1.5 : 1.0))
            - Math.floor(monster.def * 0.5)
          )
          const dmg2 = Math.max(1,
            Math.round(player.atk * effect.damage * 0.5)
            - Math.floor(monster.def * 0.3)
          )
          const totalDmg = dmg1 + dmg2
          monster = { ...monster, hp: monster.hp - totalDmg }
          log = [...log, { type: 'player_special', dmg: totalDmg, hits: [dmg1, dmg2], perfect, label: 'FEUERBALL' }]
          specialBar = 0
          if (player.lifesteal) {
            const heal = Math.max(1, Math.round(totalDmg * 0.08))
            player = { ...player, hp: Math.min(player.maxHp, player.hp + heal) }
          }
          break
        }

        // ─── Rogue: Dolchsturm ──────────────────────────────────────────────
        // Two hits at 0.8× each. If player last dodged (dodgeBonus): ×2.0 bonus
        case 'double_strike': {
          const strikeBonus = (dodgeBonus || perfect) ? effect.dodgeBonus : 1.0
          const dmg1 = Math.max(1,
            Math.round(player.atk * effect.damage * strikeBonus)
            - Math.floor(monster.def * 0.5)
          )
          const dmg2 = Math.max(1,
            Math.round(player.atk * effect.damage * strikeBonus)
            - Math.floor(monster.def * 0.5)
          )
          const totalDmg = dmg1 + dmg2
          monster = { ...monster, hp: monster.hp - totalDmg }
          log = [...log, { type: 'player_special', dmg: totalDmg, hits: [dmg1, dmg2], perfect: strikeBonus > 1, label: 'DOLCHSTURM' }]
          specialBar = 0
          if (player.lifesteal) {
            const heal = Math.max(1, Math.round(totalDmg * 0.08))
            player = { ...player, hp: Math.min(player.maxHp, player.hp + heal) }
          }
          break
        }

        // ─── Fallback ────────────────────────────────────────────────────────
        default: {
          const dmg = Math.max(1,
            Math.round(player.atk * (effect.damage ?? 1.5) * timingBonus)
            - Math.floor(monster.def * 0.5)
          )
          monster = { ...monster, hp: monster.hp - dmg }
          log = [...log, { type: 'player_special', dmg, perfect }]
          specialBar = 0
          if (player.lifesteal) {
            const heal = Math.max(1, Math.round(dmg * 0.08))
            player = { ...player, hp: Math.min(player.maxHp, player.hp + heal) }
          }
        }
      }

      if (monster.hp <= 0) {
        return { ...state, phase: 'victory', player, monster: { ...monster, hp: 0 }, log, specialBar }
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
    shieldActive: false,
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

  let { player, monster, log, pendingEnemyMove, lastPlayerAction, dodgeBonus, shieldActive } = state

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

  // shieldActive (warrior special) auto-blocks regardless of input
  const effectiveBlock = lastPlayerAction === 'block' || shieldActive

  if (effectiveBlock) {
    dmg = Math.max(1, Math.round(dmg * blockReduction))
    log = [...log, { type: shieldActive ? 'shield_counter' : 'player_blocked', move, dmg }]
    // Shield counter: warrior deals 30% of blocked damage back
    if (shieldActive) {
      const counter = Math.max(1, Math.round(rawDmg * 0.3))
      monster = { ...monster, hp: monster.hp - counter }
      log = [...log, { type: 'shield_counter_dmg', dmg: counter }]
    }
  } else if (lastPlayerAction === 'dodge' && dodgeBonus && canDodge) {
    dmg = 0
    log = [...log, { type: 'player_dodged', move }]
  } else if (lastPlayerAction === 'dodge' && dodgeBonus && !canDodge) {
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
  monster = { ...monster, hp: Math.min(monster.maxHp, Math.max(0, monster.hp + monsterHeal)) }

  // Shield counter may have finished the monster
  if (monster.hp <= 0 && shieldActive) {
    return { ...state, phase: 'victory', player, monster: { ...monster, hp: 0 }, log, shieldActive: false }
  }

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
    shieldActive: false,
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
    case 'fire_breath': return Math.round(base * 2.0)
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
