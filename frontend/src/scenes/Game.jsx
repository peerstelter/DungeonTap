import { useState, useEffect, useReducer, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CLASSES } from '../game/classes'
import { getMonsterForFloor } from '../game/monsters'
import { generateDungeon, getDailySeed, ROOM_TYPES } from '../game/dungeon'
import { createCombatState, applyPlayerAction, applyBlock, applyDodge, resolveEnemyAttack, ATTACK_LABELS } from '../game/combat'
import { attachSwipeListener } from '../game/swipe'
import { sfx } from '../game/sound'
import MonsterSprite from '../components/MonsterSprite'
import RoomTile from '../components/RoomTile'

const TELEGRAPH_MS = 850 // time player has to block/dodge before hit lands

// ─── Perk System ──────────────────────────────────────────────────────────────

export const PERKS = [
  // Stat boosts
  { id: 'hp_up',     icon: '❤️',  title: '+30 Max HP',         desc: 'Erhöht dein Maximum',               apply: p => ({ ...p, maxHp: p.maxHp + 30, hp: Math.min(p.hp + 30, p.maxHp + 30) }) },
  { id: 'atk_up',   icon: '⚔️', title: '+8 Angriff',          desc: 'Mehr Schaden pro Treffer',           apply: p => ({ ...p, atk: p.atk + 8 }) },
  { id: 'def_up',   icon: '🛡️', title: '+6 Verteidigung',     desc: 'Reduziert eingehenden Schaden',      apply: p => ({ ...p, def: p.def + 6 }) },
  { id: 'heal',     icon: '💊', title: 'Vollheilung',         desc: 'Stellt alle HP wieder her',          apply: p => ({ ...p, hp: p.maxHp }) },
  { id: 'atk_def',  icon: '⚡', title: '+5 ATK / +4 DEF',    desc: 'Ausgewogener Boost',                 apply: p => ({ ...p, atk: p.atk + 5, def: p.def + 4 }) },
  // Passives (one-time flags, not repeated)
  { id: 'lifesteal',icon: '🩸', title: 'Lebensraub',          desc: 'Treffer heilen 8% HP', passive: true, apply: p => ({ ...p, lifesteal: true }) },
  { id: 'fast_sp',  icon: '💜', title: 'Spezialist',          desc: 'Special füllt 35% schneller', passive: true, apply: p => ({ ...p, fastSpecial: true }) },
  { id: 'tough_bl', icon: '🔰', title: 'Eisenblock',          desc: 'Block absorbiert 65%', passive: true,  apply: p => ({ ...p, toughBlock: true }) },
  { id: 'goldnose', icon: '💰', title: 'Goldnase',            desc: '+60% Gold aus Kämpfen', passive: true,  apply: p => ({ ...p, goldBonus: true }) },
  { id: 'nimble',   icon: '🌪️', title: 'Gewandtheit',        desc: 'Ausweichen ignoriert Wuchttreffer', passive: true, apply: p => ({ ...p, alwaysDodge: true }) },
]

function rollPerks(count = 3, activePerks = []) {
  // Passives can only be picked once; stat boosts always available
  const available = PERKS.filter(p => !p.passive || !activePerks.includes(p.id))
  const shuffled = [...available].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map(p => p.id)
}

// ─── Init & State ─────────────────────────────────────────────────────────────

// ─── Daily Hero Persistence ───────────────────────────────────────────────────
// Daily runs keep level/perks/stats across attempts; only HP resets each try.
// A new calendar day resets the hero entirely.

const DAILY_HERO_KEY = 'dungeontap_daily_hero'
const TODAY = new Date().toISOString().slice(0, 10)

export function loadDailyHero() {
  try {
    const saved = JSON.parse(localStorage.getItem(DAILY_HERO_KEY) || 'null')
    if (saved?.date === TODAY) return saved.player
  } catch {}
  return null
}

export function saveDailyHero(player) {
  localStorage.setItem(DAILY_HERO_KEY, JSON.stringify({
    date: TODAY,
    player: {
      class:       player.class,
      maxHp:       player.maxHp,
      atk:         player.atk,
      def:         player.def,
      level:       player.level,
      xp:          player.xp,
      xpToNext:    player.xpToNext,
      activePerks: player.activePerks ?? [],
      // passives
      lifesteal:   player.lifesteal,
      fastSpecial: player.fastSpecial,
      toughBlock:  player.toughBlock,
      goldBonus:   player.goldBonus,
      alwaysDodge: player.alwaysDodge,
    },
  }))
}

// ─── Init & State ─────────────────────────────────────────────────────────────

function initRun(playerClass, seed, savedHero = null) {
  const cls = CLASSES[playerClass]
  const dungeon = generateDungeon(seed)

  let player
  if (savedHero) {
    // Returning daily attempt: restore character, reset run-specific stats
    player = {
      ...savedHero,
      hp: savedHero.maxHp,     // full HP for fresh attempt
      energy: cls.baseEnergy,
      maxEnergy: cls.baseEnergy,
      specialEffect: cls.specialEffect,
      specialName: cls.specialName,
      gold: 0,
      floor: 1,
      kills: 0,
      items: [],
    }
  } else {
    player = {
      class: playerClass,
      hp: cls.baseHp,
      maxHp: cls.baseHp,
      atk: cls.baseAtk,
      def: cls.baseDef,
      energy: cls.baseEnergy,
      maxEnergy: cls.baseEnergy,
      specialEffect: cls.specialEffect,
      specialName: cls.specialName,
      gold: 0,
      xp: 0,
      level: 1,
      xpToNext: 100,
      floor: 1,
      kills: 0,
      items: [],
      activePerks: [],
    }
  }
  return { dungeon, player, phase: 'dungeon_map', combat: null, floorIndex: 0, pendingPerkIds: null }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ENTER_ROOM': {
      const room = state.dungeon.rooms[state.floorIndex]
      if (room.type === 'combat' || room.type === 'boss') {
        const monster = getMonsterForFloor(state.player.floor, room.type === 'boss')
        const combat = createCombatState(state.player, monster)
        return { ...state, phase: 'combat', combat }
      }
      if (room.type === 'rest') {
        const heal = Math.round(state.player.maxHp * 0.3)
        const healed = Math.min(state.player.maxHp, state.player.hp + heal) - state.player.hp
        return {
          ...state,
          phase: 'rest',
          restHeal: healed,
          player: { ...state.player, hp: state.player.hp + healed },
        }
      }
      if (room.type === 'treasure') {
        const loot = rollTreasure(state.player.floor)
        return {
          ...state,
          phase: 'treasure',
          treasureLoot: loot,
          player: applyTreasure(state.player, loot),
        }
      }
      if (room.type === 'shop') {
        return {
          ...state,
          phase: 'shop',
          shopItems: rollShopItems(state.player),
        }
      }
      return { ...state, phase: 'dungeon_map', floorIndex: state.floorIndex + 1 }
    }

    case 'PLAYER_ACTION': {
      if (state.phase !== 'combat') return state
      const combat = applyPlayerAction(state.combat, action.action, action.timingBonus ?? 1.0)
      if (combat.phase === 'victory') {
        const xpGain = state.combat.monster.xp
        const goldGain = rollLootGold(state.combat.monster, state.player)
        const player = { ...state.player, hp: combat.player.hp, xp: state.player.xp + xpGain, gold: state.player.gold + goldGain, kills: state.player.kills + 1 }
        // go through monster_dying phase first so the death animation can play
        return { ...state, phase: 'monster_dying', combat, player, lastLoot: { xp: xpGain, gold: goldGain } }
      }
      return { ...state, combat }
    }

    case 'CONFIRM_KILL': {
      return { ...state, phase: 'loot' }
    }

    case 'BLOCK_INPUT': {
      if (state.phase !== 'combat') return state
      return { ...state, combat: applyBlock(state.combat) }
    }

    case 'DODGE_INPUT': {
      if (state.phase !== 'combat') return state
      return { ...state, combat: applyDodge(state.combat) }
    }

    case 'RESOLVE_ENEMY': {
      if (state.phase !== 'combat') return state
      const combat = resolveEnemyAttack(state.combat)
      if (combat.phase === 'defeat') {
        return { ...state, phase: 'game_over', combat }
      }
      return { ...state, combat }
    }

    case 'NEXT_FLOOR': {
      return advanceFloor(state)
    }

    case 'DISMISS_LEVEL_UP': {
      // Fallback safety — pick first available perk automatically
      const perkId = state.pendingPerkIds?.[0]
      if (perkId) {
        const perk = PERKS.find(p => p.id === perkId)
        const player = { ...perk.apply(state.player), activePerks: [...(state.player.activePerks ?? []), perkId] }
        return { ...state, phase: 'dungeon_map', pendingPerkIds: null, player }
      }
      return { ...state, phase: 'dungeon_map', pendingPerkIds: null }
    }

    case 'PICK_PERK': {
      const perk = PERKS.find(p => p.id === action.perkId)
      if (!perk || !state.pendingPerkIds?.includes(action.perkId)) return state
      const player = { ...perk.apply(state.player), activePerks: [...(state.player.activePerks ?? []), action.perkId] }
      return { ...state, phase: 'dungeon_map', pendingPerkIds: null, player }
    }

    case 'BUY_ITEM': {
      const item = action.item
      if (state.player.gold < item.cost) return state
      const player = applyItemEffect({ ...state.player, gold: state.player.gold - item.cost }, item)
      const shopItems = state.shopItems.filter(i => i.id !== item.id)
      return { ...state, player, shopItems }
    }

    case 'LEAVE_SHOP': {
      return { ...advanceFloor(state), shopItems: null }
    }

    case 'LEAVE_ROOM': {
      return advanceFloor(state)
    }

    default:
      return state
  }
}

function markCleared(dungeon, idx) {
  const rooms = dungeon.rooms.map((r, i) => i === idx ? { ...r, cleared: true } : r)
  return { ...dungeon, rooms }
}

function rollLootGold(monster, player) {
  const loot = monster.loot?.find(l => l.item === 'gold')
  if (!loot) return 0
  const [min, max] = loot.amount
  const base = min + Math.floor(Math.random() * (max - min + 1))
  return player?.goldBonus ? Math.round(base * 1.6) : base
}

const SHOP_POOL = [
  { id: 'potion_small',  name: 'Kleiner Trank',    icon: '🧪', cost: 30,  effect: { type: 'heal',      amount: 0.25 }, desc: 'Heilt 25% HP' },
  { id: 'potion_medium', name: 'Mittlerer Trank',   icon: '⚗️', cost: 60,  effect: { type: 'heal',      amount: 0.50 }, desc: 'Heilt 50% HP' },
  { id: 'potion_large',  name: 'Großer Trank',      icon: '🍶', cost: 100, effect: { type: 'heal',      amount: 1.00 }, desc: 'Volle HP' },
  { id: 'atk_ring',      name: 'Angriffsring',      icon: '💍', cost: 55,  effect: { type: 'atk_bonus', amount: 6  },  desc: '+6 Angriff' },
  { id: 'shield_charm',  name: 'Schutzamulett',     icon: '🔮', cost: 50,  effect: { type: 'def_bonus', amount: 5  },  desc: '+5 Verteidigung' },
  { id: 'energy_gem',    name: 'Energiekristall',   icon: '💎', cost: 45,  effect: { type: 'energy',    amount: 25 },  desc: '+25 Max-Energie' },
  { id: 'max_hp_scroll', name: 'Vitalitätsschrift', icon: '📜', cost: 70,  effect: { type: 'max_hp',    amount: 25 },  desc: '+25 Max-HP (+ Heilung)' },
]

function rollShopItems(player) {
  const shuffled = [...SHOP_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

const TREASURE_POOL = [
  { type: 'gold',    icon: '💰', label: (v) => `+${v} Gold`,          roll: (floor) => 20 + floor * 8 + Math.floor(Math.random() * 20) },
  { type: 'heal',    icon: '❤️',  label: (v) => `+${v} HP geheilt`,    roll: (floor) => Math.round(0.4 * (floor * 10 + 50)) },
  { type: 'atk',     icon: '⚔️', label: (v) => `+${v} Angriff`,       roll: () => 3 + Math.floor(Math.random() * 4) },
  { type: 'def',     icon: '🛡️', label: (v) => `+${v} Verteidigung`,  roll: () => 2 + Math.floor(Math.random() * 3) },
  { type: 'max_hp',  icon: '💗', label: (v) => `+${v} Max-HP`,        roll: () => 10 + Math.floor(Math.random() * 16) },
]

function rollTreasure(floor) {
  const entry = TREASURE_POOL[Math.floor(Math.random() * TREASURE_POOL.length)]
  const value = entry.roll(floor)
  return { type: entry.type, icon: entry.icon, label: entry.label(value), value }
}

function applyTreasure(player, loot) {
  switch (loot.type) {
    case 'gold':   return { ...player, gold: player.gold + loot.value }
    case 'heal':   return { ...player, hp: Math.min(player.maxHp, player.hp + loot.value) }
    case 'atk':    return { ...player, atk: player.atk + loot.value }
    case 'def':    return { ...player, def: player.def + loot.value }
    case 'max_hp': return { ...player, maxHp: player.maxHp + loot.value, hp: Math.min(player.maxHp + loot.value, player.hp + loot.value) }
    default:       return player
  }
}

// XP needed per level: L2:70, L3:90, L4:110 ...
// Expect 4–7 level-ups per full run → plenty of perk choices
function xpNeeded(level) { return level * 20 + 50 }

function checkLevelUp(player) {
  if (player.xp < player.xpToNext) return { player, didLevel: false }
  const newLevel = player.level + 1
  const leveled = { ...player, level: newLevel, xpToNext: xpNeeded(newLevel) }
  // Stat gains are now chosen via the perk system (no auto-apply here)
  return { player: leveled, didLevel: true }
}

function advanceFloor(state) {
  const nextIndex = state.floorIndex + 1
  if (nextIndex >= state.dungeon.rooms.length) {
    return { ...state, phase: 'victory_run' }
  }
  const dungeon = markCleared(state.dungeon, state.floorIndex)
  const basePlayer = { ...state.player, floor: state.player.floor + 1 }
  const { player, didLevel } = checkLevelUp(basePlayer)
  if (didLevel) {
    const pendingPerkIds = rollPerks(3, player.activePerks ?? [])
    return { ...state, phase: 'level_up', floorIndex: nextIndex, dungeon, player, pendingPerkIds }
  }
  return { ...state, phase: 'dungeon_map', floorIndex: nextIndex, dungeon, player }
}

function applyItemEffect(player, item) {
  const e = item.effect
  switch (e.type) {
    case 'heal':      return { ...player, hp: Math.min(player.maxHp, Math.round(player.hp + player.maxHp * e.amount)) }
    case 'atk_bonus': return { ...player, atk: player.atk + e.amount }
    case 'def_bonus': return { ...player, def: player.def + e.amount }
    case 'energy':    return { ...player, maxEnergy: player.maxEnergy + e.amount }
    case 'max_hp':    return { ...player, maxHp: player.maxHp + e.amount, hp: Math.min(player.maxHp + e.amount, player.hp + e.amount) }
    default:          return player
  }
}

// Outer shell: fetches daily seed + loads saved daily hero before starting
export default function Game() {
  const [params] = useSearchParams()
  const isDaily = params.get('mode') === 'daily'
  const playerClass = sessionStorage.getItem('playerClass') || 'warrior'
  const [seed, setSeed] = useState(null)

  useEffect(() => {
    if (isDaily) {
      fetch('/api/daily-dungeon/seed')
        .then(r => r.json())
        .then(d => setSeed(d.seed))
        .catch(() => setSeed(getDailySeed()))
    } else {
      setSeed(Math.floor(Math.random() * 0xFFFFFF))
    }
  }, []) // eslint-disable-line

  if (seed === null) {
    return (
      <div className="flex items-center justify-center h-full bg-dungeon">
        <div className="pixel text-gold text-xs animate-pulse">LADE DUNGEON...</div>
      </div>
    )
  }

  const savedHero = isDaily ? loadDailyHero() : null
  return <GameInner playerClass={playerClass} seed={seed} isDaily={isDaily} savedHero={savedHero} />
}

function GameInner({ playerClass, seed, isDaily, savedHero }) {
  const navigate = useNavigate()
  const isReturningDaily = isDaily && savedHero !== null
  const [state, dispatch] = useReducer(reducer, null, () => initRun(playerClass, seed, savedHero))

  // Save daily hero whenever the run ends
  useEffect(() => {
    if (isDaily && (state.phase === 'game_over' || state.phase === 'victory_run')) {
      saveDailyHero(state.player)
    }
  }, [state.phase]) // eslint-disable-line
  const swipeZoneRef = useRef(null)
  const telegraphTimerRef = useRef(null)

  // Auto-resolve enemy attack after telegraph window
  useEffect(() => {
    if (state.phase === 'combat' && state.combat?.phase === 'enemy_telegraph') {
      telegraphTimerRef.current = setTimeout(() => {
        dispatch({ type: 'RESOLVE_ENEMY' })
      }, TELEGRAPH_MS)
    }
    return () => clearTimeout(telegraphTimerRef.current)
  }, [state.combat?.phase, state.combat?.pendingEnemyMove])

  const handleSwipe = useCallback((direction) => {
    if (state.phase !== 'combat') return
    const combatPhase = state.combat?.phase

    if (combatPhase === 'player_turn') {
      if (direction === 'up') { sfx.attack(); dispatch({ type: 'PLAYER_ACTION', action: 'attack' }) }
    }
    if (combatPhase === 'enemy_telegraph') {
      if (direction === 'left')  { sfx.block(); dispatch({ type: 'BLOCK_INPUT' }) }
      if (direction === 'right') { sfx.dodge(); dispatch({ type: 'DODGE_INPUT' }) }
    }
  }, [state.phase, state.combat?.phase])

  useEffect(() => {
    const el = swipeZoneRef.current
    if (!el) return
    return attachSwipeListener(el, handleSwipe)
  }, [handleSwipe])

  // Keyboard controls (desktop)
  useEffect(() => {
    function onKey(e) {
      if (state.phase !== 'combat') return
      const combatPhase = state.combat?.phase
      const specialReady = state.combat?.specialBar >= 100

      if (combatPhase === 'player_turn') {
        if (e.key === 'ArrowUp')   { e.preventDefault(); sfx.attack(); dispatch({ type: 'PLAYER_ACTION', action: 'attack' }) }
        if ((e.key === ' ' || e.key === 'ArrowDown') && specialReady) {
          e.preventDefault()
          dispatch({ type: 'PLAYER_ACTION', action: 'special', timingBonus: 1.0, fromKeyboard: true })
        }
      }
      if (combatPhase === 'enemy_telegraph') {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); sfx.block(); dispatch({ type: 'BLOCK_INPUT' }) }
        if (e.key === 'ArrowRight') { e.preventDefault(); sfx.dodge(); dispatch({ type: 'DODGE_INPUT' }) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.phase, state.combat?.phase, state.combat?.specialBar])

  if (state.phase === 'dungeon_map') {
    return <DungeonMap state={state} onEnter={() => dispatch({ type: 'ENTER_ROOM' })} onQuit={() => navigate('/')} isReturningDaily={isReturningDaily} />
  }
  if (state.phase === 'combat' || state.phase === 'monster_dying') {
    return (
      <CombatScreen
        state={state}
        swipeZoneRef={swipeZoneRef}
        dying={state.phase === 'monster_dying'}
        onDeathDone={() => dispatch({ type: 'CONFIRM_KILL' })}
        onSpecial={(timingBonus) => dispatch({ type: 'PLAYER_ACTION', action: 'special', timingBonus })}
      />
    )
  }
  if (state.phase === 'loot') {
    return <LootScreen state={state} onNext={() => dispatch({ type: 'NEXT_FLOOR' })} />
  }
  if (state.phase === 'level_up') {
    return <LevelUpScreen state={state} onPick={perkId => dispatch({ type: 'PICK_PERK', perkId })} />
  }
  if (state.phase === 'rest') {
    return <RestScreen state={state} onNext={() => dispatch({ type: 'LEAVE_ROOM' })} />
  }
  if (state.phase === 'treasure') {
    return <TreasureScreen state={state} onNext={() => dispatch({ type: 'LEAVE_ROOM' })} />
  }
  if (state.phase === 'shop') {
    return (
      <ShopScreen
        state={state}
        onBuy={item => dispatch({ type: 'BUY_ITEM', item })}
        onLeave={() => dispatch({ type: 'LEAVE_SHOP' })}
      />
    )
  }
  if (state.phase === 'game_over') {
    return (
      <RunEnd
        state={state}
        won={false}
        isDaily={isDaily}
        onRetry={() => isDaily ? navigate('/game?mode=daily') : navigate('/class-select')}
        onLeaderboard={() => navigate('/leaderboard')}
        onMenu={() => navigate('/')}
      />
    )
  }
  if (state.phase === 'victory_run') {
    return (
      <RunEnd
        state={state}
        won={true}
        isDaily={isDaily}
        onRetry={() => isDaily ? navigate('/game?mode=daily') : navigate('/class-select')}
        onLeaderboard={() => navigate('/leaderboard')}
        onMenu={() => navigate('/')}
      />
    )
  }
}

// ─── Dungeon Map ──────────────────────────────────────────────────────────────

function DungeonMap({ state, onEnter, onQuit, isReturningDaily }) {
  const { dungeon, player, floorIndex } = state
  const currentRoom = dungeon.rooms[floorIndex]
  const currentRef = useRef(null)

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [floorIndex])

  return (
    <div className="flex flex-col h-full safe-top safe-bottom bg-dungeon px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <button onClick={onQuit} className="text-gray-600 text-xs pixel">✕ AUFGEBEN</button>
        <div className="pixel text-xs text-center">
          <span className="text-gold-light">ETAGE {player.floor}</span>
          <span className="text-gray-700 mx-2">·</span>
          <span className="text-purple-400">LV{player.level}</span>
          <span className="text-gray-700 mx-2">·</span>
          <span className="text-yellow-500">💰 {player.gold}</span>
        </div>
        <div className="pixel text-xs text-gray-600">⚔ {player.kills}</div>
      </div>

      <HpBar hp={player.hp} maxHp={player.maxHp} />

      {/* Daily returning-hero banner */}
      {isReturningDaily && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 px-3 py-1.5 border border-purple-900 bg-purple-950/50 text-purple-400 text-xs text-center"
        >
          ⚡ Dein Held von heute – LV{player.level} · {player.activePerks?.length ?? 0} Perks
        </motion.div>
      )}

      {/* Path */}
      <div className="flex-1 overflow-y-auto mt-5 pr-1">
        <div className="flex flex-col items-center gap-0">
          {dungeon.rooms.map((room, i) => {
            const isCurrent = i === floorIndex
            const isPast = i < floorIndex
            const label = ROOM_TYPES[room.type]?.label ?? room.type

            return (
              <div key={i} className="flex flex-col items-center w-full max-w-xs">
                <div
                  ref={isCurrent ? currentRef : null}
                  className="flex items-center gap-4 w-full"
                >
                  {/* tile + connector column */}
                  <div className="flex flex-col items-center">
                    <RoomTile room={room} isCurrent={isCurrent} isPast={isPast} />
                    {i < dungeon.rooms.length - 1 && (
                      <div className={`w-0.5 h-4 ${isPast ? 'bg-green-900' : 'bg-dungeon-border'}`} />
                    )}
                  </div>

                  {/* label */}
                  <div className={`transition-opacity ${isPast ? 'opacity-30' : ''}`}>
                    <div className={`pixel text-xs ${isCurrent ? 'text-gold' : isPast ? 'text-gray-600' : 'text-gray-500'}`}>
                      {label}
                    </div>
                    {isCurrent && (
                      <div className="text-yellow-600 text-xs mt-0.5 animate-pulse">← hier</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {currentRoom && (
        <motion.button
          onClick={onEnter}
          whileTap={{ scale: 0.97 }}
          className="mt-4 py-4 pixel text-sm border-2 border-gold bg-dungeon-gold text-dungeon-black"
        >
          RAUM BETRETEN
        </motion.button>
      )}
    </div>
  )
}

// ─── Combat Screen ────────────────────────────────────────────────────────────

const SWEET_SPOT = 18

function CombatScreen({ state, swipeZoneRef, onSpecial, dying = false, onDeathDone }) {
  const { combat, player } = state
  const { monster, phase, pendingEnemyMove, specialBar } = combat
  const atk = pendingEnemyMove ? ATTACK_LABELS[pendingEnemyMove] : null
  const specialReady = specialBar >= 100 && phase === 'player_turn'

  // Play monster death sound once when dying starts
  useEffect(() => { if (dying) sfx.monsterDeath() }, [dying])

  // Hit flash states
  const [monsterFlash, setMonsterFlash] = useState(false)
  const [playerFlash,  setPlayerFlash]  = useState(false)

  // Floating damage numbers [{id, text, color, forMonster}]
  const [floats, setFloats] = useState([])

  // Guitar Hero cursor
  const cursorRef = useRef(50)
  const dirRef    = useRef(1)
  const animRef   = useRef(null)
  const [cursor, setCursor] = useState(50)

  // React to new log entries: flash + sound + float
  useEffect(() => {
    const entry = combat.log[combat.log.length - 1]
    if (!entry) return

    switch (entry.type) {
      case 'player_attack':
      case 'player_special':
        setMonsterFlash(true)
        setTimeout(() => setMonsterFlash(false), 120)
        sfx.hit()
        addFloat(`-${entry.dmg}`, entry.type === 'player_special' ? 'text-purple-400' : 'text-orange-400', true)
        break
      case 'enemy_attack':
        setPlayerFlash(true)
        setTimeout(() => setPlayerFlash(false), 300)
        sfx.hit()
        addFloat(`-${entry.dmg}`, 'text-red-500', false)
        break
      case 'player_blocked':
        setPlayerFlash(true)
        setTimeout(() => setPlayerFlash(false), 200)
        addFloat(`-${entry.dmg}`, 'text-blue-400', false)
        break
      case 'player_grazed':
        setPlayerFlash(true)
        setTimeout(() => setPlayerFlash(false), 200)
        addFloat(`-${entry.dmg}`, 'text-yellow-500', false)
        break
      case 'player_dodged':
        addFloat('DODGE!', 'text-green-400', false)
        break
      default: break
    }

    if (combat.phase === 'victory') sfx.victory()
    if (combat.phase === 'defeat')  sfx.death()
  }, [combat.log.length]) // eslint-disable-line

  function addFloat(text, color, forMonster) {
    const id = Date.now() + Math.random()
    setFloats(prev => [...prev, { id, text, color, forMonster }])
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 900)
  }

  // Special cursor animation
  useEffect(() => {
    if (!specialReady) {
      cancelAnimationFrame(animRef.current)
      cursorRef.current = 50; setCursor(50)
      return
    }
    function tick() {
      cursorRef.current += 1.4 * dirRef.current
      if (cursorRef.current >= 100) { cursorRef.current = 100; dirRef.current = -1 }
      if (cursorRef.current <= 0)   { cursorRef.current = 0;   dirRef.current =  1 }
      setCursor(Math.round(cursorRef.current))
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [specialReady])

  function handleSpecial() {
    if (!specialReady) return
    const perfect = Math.abs(cursorRef.current - 50) <= SWEET_SPOT
    sfx.special()
    onSpecial(perfect ? 2.0 : 1.0)
  }

  return (
    <div className="flex flex-col h-full safe-top safe-bottom bg-dungeon select-none">
      {/* Player hit flash overlay */}
      <AnimatePresence>
        {playerFlash && (
          <motion.div
            className="fixed inset-0 bg-red-900 pointer-events-none z-50"
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Monster area */}
      <div className="relative flex flex-col items-center pt-8 px-4 gap-3">
        {/* Floating numbers above monster */}
        <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none">
          <AnimatePresence>
            {floats.filter(f => f.forMonster).map(f => (
              <motion.div
                key={f.id}
                className={`pixel text-sm absolute ${f.color}`}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -50, opacity: 0 }}
                exit={{}}
                transition={{ duration: 0.8 }}
                style={{ left: `${40 + Math.random() * 20}%` }}
              >
                {f.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {dying ? (
          <motion.div
            initial={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
            animate={{
              scale:   [1, 1.15, 0.85, 1.2,  0.1, 0],
              opacity: [1, 1,    1,    0.8,   0.3, 0],
              y:       [0, -8,   4,    -12,   20,  50],
              rotate:  [0, -8,   8,    -15,   20,  0],
            }}
            transition={{ duration: 0.75, ease: 'easeIn' }}
            onAnimationComplete={onDeathDone}
          >
            <MonsterSprite id={monster.id} size={96} flash />
          </motion.div>
        ) : (
          <motion.div
            animate={phase === 'enemy_telegraph' ? { x: [0, -8, 8, -8, 0] } : {}}
            transition={{ duration: 0.35 }}
          >
            <MonsterSprite id={monster.id} size={96} flash={monsterFlash} />
          </motion.div>
        )}

        <div className="pixel text-white text-xs">{monster.name}</div>
        <div className="w-full max-w-xs">
          <HpBar hp={monster.hp} maxHp={monster.maxHp} color="bg-red-700" />
        </div>

        <AnimatePresence mode="wait">
          {atk && (
            <motion.div
              key={pendingEnemyMove}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`pixel text-xs ${atk.color} text-center`}
            >
              {atk.label}
              {atk.warn
                ? <span className="ml-2 animate-pulse">← BLOCK!</span>
                : <span className="ml-2 text-gray-600">← Block &nbsp; → Dodge</span>
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Swipe zone */}
      <div
        ref={swipeZoneRef}
        className="flex-1 flex flex-col items-center justify-center cursor-pointer touch-none relative"
      >
        {/* Floating numbers for player damage */}
        <div className="absolute inset-0 pointer-events-none flex justify-center items-center">
          <AnimatePresence>
            {floats.filter(f => !f.forMonster).map(f => (
              <motion.div
                key={f.id}
                className={`pixel text-sm absolute ${f.color}`}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -40, opacity: 0 }}
                exit={{}}
                transition={{ duration: 0.7 }}
              >
                {f.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="text-gray-700 text-xs pixel text-center leading-loose">
          {phase === 'player_turn' && !specialReady && <>↑ Angriff <span className="text-gray-800">[↑]</span></>}
          {phase === 'player_turn' && specialReady  && <span className="text-purple-300 animate-pulse">SPEZIAL BEREIT!<br/>Tippen / [Space]</span>}
          {phase === 'enemy_telegraph' && !atk?.warn && <span className="text-gray-500">← Block [←] &nbsp; → Dodge [→]</span>}
          {phase === 'enemy_telegraph' &&  atk?.warn && <span className="text-red-400 animate-pulse">← BLOCKEN! [←]<br/>(nicht ausweichbar)</span>}
        </div>
      </div>

      {/* Player HUD */}
      <div className="px-4 pb-6 safe-bottom flex flex-col gap-3">
        <HpBar hp={combat.player.hp} maxHp={combat.player.maxHp} />

        <div className="flex items-center gap-3">
          <span className="pixel text-xs text-purple-400">SPEZIAL</span>
          <div className="flex-1 relative bar-track">
            <div
              className={`bar-fill ${specialReady ? 'bg-purple-500' : 'bg-purple-900'}`}
              style={{ width: `${specialBar}%` }}
            />
            {specialReady && (
              <div className="absolute top-0 h-full bg-yellow-400 opacity-30 rounded"
                style={{ left: `${50 - SWEET_SPOT}%`, width: `${SWEET_SPOT * 2}%` }} />
            )}
            {specialReady && (
              <div className="absolute top-0 h-full w-1 bg-white rounded"
                style={{ left: `${cursor}%`, transform: 'translateX(-50%)' }} />
            )}
          </div>
          <button
            onClick={handleSpecial}
            disabled={!specialReady}
            className={`pixel text-xs px-3 py-2 border transition-all
              ${specialReady
                ? 'border-purple-400 text-purple-200 bg-purple-900 active:scale-95'
                : 'border-dungeon-border text-gray-700 cursor-not-allowed'}`}
          >
            {CLASSES[player.class]?.specialName ?? 'SPEZIAL'}
          </button>
        </div>

        {combat.log.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={combat.log.length}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-gray-500 text-center"
            >
              <LogEntry entry={combat.log[combat.log.length - 1]} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

function LogEntry({ entry }) {
  switch (entry.type) {
    case 'player_attack':   return <>Du triffst für <span className="text-orange-400">{entry.dmg}</span> Schaden</>
    case 'player_special':  return <>{entry.perfect ? '✨ PERFEKT! ' : ''}<span className="text-purple-400">{entry.dmg}</span> Spezialschaden</>
    case 'player_dodge':    return <span className="text-green-400">Ausgewichen!</span>
    case 'player_blocked':  return <>Geblockt! Nur <span className="text-blue-400">{entry.dmg}</span> Schaden</>
    case 'player_dodged':   return <span className="text-green-400">Perfekt ausgewichen!</span>
    case 'player_grazed':   return <>Treffer! Ausweichen half wenig – <span className="text-yellow-500">{entry.dmg}</span> Schaden</>
    case 'enemy_attack':    return <>Gegner trifft dich für <span className="text-red-400">{entry.dmg}</span></>
    default: return null
  }
}

// ─── Shop Screen ──────────────────────────────────────────────────────────────

function ShopScreen({ state, onBuy, onLeave }) {
  const { player, shopItems } = state
  return (
    <div className="flex flex-col h-full safe-top safe-bottom bg-dungeon px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="pixel text-gold text-sm">🏪 HÄNDLER</div>
          <div className="text-gray-500 text-xs mt-1">Was darf's sein, Abenteurer?</div>
        </div>
        <div className="pixel text-yellow-400 text-sm">💰 {player.gold}</div>
      </div>

      <HpBar hp={player.hp} maxHp={player.maxHp} />

      <div className="flex flex-col gap-3 mt-6 flex-1">
        {shopItems?.map(item => {
          const canAfford = player.gold >= item.cost
          return (
            <motion.button
              key={item.id}
              onClick={() => canAfford && onBuy(item)}
              whileTap={canAfford ? { scale: 0.97 } : {}}
              className={`
                flex items-center gap-4 p-4 border-2 text-left transition-all
                ${canAfford
                  ? 'border-dungeon-border bg-dungeon-dark hover:border-gold active:bg-dungeon-gray'
                  : 'border-dungeon-border bg-dungeon-dark opacity-40 cursor-not-allowed'
                }
              `}
            >
              <span className="text-3xl">{item.icon}</span>
              <div className="flex-1">
                <div className="text-white text-sm">{item.name}</div>
                <div className="text-gray-500 text-xs mt-0.5">{item.desc}</div>
              </div>
              <div className={`pixel text-xs ${canAfford ? 'text-yellow-400' : 'text-gray-600'}`}>
                {item.cost}g
              </div>
            </motion.button>
          )
        })}

        {shopItems?.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
            Alles verkauft!
          </div>
        )}
      </div>

      <button
        onClick={onLeave}
        className="mt-6 py-4 pixel text-sm border-2 border-dungeon-border text-gray-400 active:scale-95 hover:border-gray-500"
      >
        WEITERZIEHEN →
      </button>
    </div>
  )
}

// ─── Rest Screen ─────────────────────────────────────────────────────────────

function RestScreen({ state, onNext }) {
  const { player, restHeal } = state
  useEffect(() => { sfx.heal() }, [])
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 bg-dungeon safe-top safe-bottom">
      <div className="text-6xl">🔥</div>
      <div className="pixel text-gold text-sm">LAGERFEUER</div>
      <p className="text-gray-400 text-sm text-center">Du rastest kurz und verbindest deine Wunden.</p>
      <div className="flex flex-col items-center gap-2">
        <div className="text-3xl">❤️</div>
        <div className="pixel text-xs text-green-400">+{restHeal} HP geheilt</div>
        <div className="text-gray-500 text-xs">{player.hp} / {player.maxHp} HP</div>
      </div>
      <button
        onClick={onNext}
        className="w-full max-w-xs py-4 pixel text-sm border-2 border-gold bg-dungeon-gold text-dungeon-black active:scale-95"
      >
        WEITER →
      </button>
    </div>
  )
}

// ─── Treasure Screen ──────────────────────────────────────────────────────────

function TreasureScreen({ state, onNext }) {
  const { treasureLoot } = state
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 bg-dungeon safe-top safe-bottom">
      <div className="text-6xl">💰</div>
      <div className="pixel text-gold text-sm">SCHATZ!</div>
      <p className="text-gray-400 text-sm text-center">Du entdeckst eine vergessene Truhe im Dunkel.</p>
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="flex flex-col items-center gap-2 border-2 border-gold px-8 py-5 bg-dungeon-gray"
      >
        <div className="text-4xl">{treasureLoot?.icon}</div>
        <div className="pixel text-xs text-gold-light mt-1">{treasureLoot?.label}</div>
      </motion.div>
      <button
        onClick={onNext}
        className="w-full max-w-xs py-4 pixel text-sm border-2 border-gold bg-dungeon-gold text-dungeon-black active:scale-95"
      >
        WEITER →
      </button>
    </div>
  )
}

// ─── Loot Screen ──────────────────────────────────────────────────────────────

function LootScreen({ state, onNext }) {
  const { lastLoot } = state
  useEffect(() => { sfx.coin() }, [])
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 bg-dungeon safe-top safe-bottom">
      <div className="text-5xl">🏆</div>
      <div className="pixel text-gold text-sm">SIEG!</div>
      <div className="flex gap-8 text-center">
        <div>
          <div className="text-2xl">⭐</div>
          <div className="pixel text-xs text-yellow-400 mt-1">+{lastLoot?.xp} XP</div>
        </div>
        <div>
          <div className="text-2xl">💰</div>
          <div className="pixel text-xs text-yellow-400 mt-1">+{lastLoot?.gold} Gold</div>
        </div>
      </div>
      <button
        onClick={onNext}
        className="w-full max-w-xs py-4 pixel text-sm border-2 border-gold bg-dungeon-gold text-dungeon-black active:scale-95"
      >
        WEITER →
      </button>
    </div>
  )
}

// ─── Level Up Screen ──────────────────────────────────────────────────────────

function LevelUpScreen({ state, onPick }) {
  const { player, pendingPerkIds } = state
  const perks = (pendingPerkIds ?? []).map(id => PERKS.find(p => p.id === id)).filter(Boolean)

  useEffect(() => { sfx.victory() }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-5 bg-dungeon safe-top safe-bottom">
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 14 }}
        className="text-5xl"
      >
        ⬆️
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <div className="pixel text-gold text-sm">LEVEL UP!</div>
        <div className="pixel text-purple-300 text-xs mt-1">LEVEL {player.level}</div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-500 text-xs text-center"
      >
        Wähle eine Verbesserung:
      </motion.p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {perks.map((perk, i) => (
          <motion.button
            key={perk.id}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.1 }}
            onClick={() => onPick(perk.id)}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-4 border-2 border-dungeon-border bg-dungeon-dark px-4 py-4 text-left hover:border-gold active:bg-dungeon-gray transition-all"
          >
            <span className="text-2xl">{perk.icon}</span>
            <div className="flex-1">
              <div className="pixel text-xs text-gold-light">{perk.title}</div>
              <div className="text-gray-500 text-xs mt-0.5">{perk.desc}</div>
            </div>
            <span className="text-gray-600 text-xs">→</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ─── Run End (Game Over + Victory) ───────────────────────────────────────────

function RunEnd({ state, won, isDaily, onRetry, onLeaderboard, onMenu }) {
  const { player, dungeon } = state
  const profile = JSON.parse(localStorage.getItem('dungeontap_profile') || 'null')

  const [name, setName]       = useState(profile?.name || '')
  const [submitted, setSubmitted]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore]     = useState(null)
  const [pinError, setPinError]     = useState(null)

  async function submitScore() {
    if (submitting || submitted) return
    setSubmitting(true)
    setPinError(false)
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Anonym',
          pin: profile?.pin ?? '',
          class: player.class,
          floor: player.floor,
          xp: player.xp,
          gold: player.gold,
          kills: player.kills,
          level: player.level,
          seed: dungeon.seed,
          isDaily,
        }),
      })
      const data = await res.json()
      if (data.error === 'wrong_pin') {
        setPinError('wrong_pin')
        return
      }
      if (data.error === 'name_taken') {
        setPinError('name_taken')
        return
      }
      setScore(data.score)
      setSubmitted(true)
      if (data.id) sessionStorage.setItem('lastRunId', String(data.id))
    } catch {
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    won ? sfx.victory() : sfx.death()
  }, []) // eslint-disable-line

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6 bg-dungeon safe-top safe-bottom">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className={`pixel text-sm ${won ? 'text-gold-light' : 'text-red-500'}`}
      >
        {won ? '🏅 DUNGEON BEZWUNGEN!' : '💀 TOD'}
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3 w-full max-w-xs"
      >
        {[
          { icon: '🏰', label: 'Etage',  value: player.floor },
          { icon: '⚔️', label: 'Kills',  value: player.kills },
          { icon: '⭐', label: 'XP',     value: player.xp   },
          { icon: '💰', label: 'Gold',   value: player.gold  },
        ].map(s => (
          <div key={s.label} className="border border-dungeon-border bg-dungeon-dark p-3 text-center">
            <div className="text-lg">{s.icon}</div>
            <div className="pixel text-gold text-sm mt-1">{s.value}</div>
            <div className="text-gray-600 text-xs">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {score != null && <div className="text-gold pixel text-xs">Score: {score}</div>}

      {!submitted ? (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <input
            type="text"
            maxLength={20}
            placeholder="Dein Name (optional)"
            value={name}
            onChange={e => { setName(e.target.value); setPinError(null) }}
            onKeyDown={e => e.key === 'Enter' && submitScore()}
            className="w-full px-4 py-3 bg-dungeon-dark border border-dungeon-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold"
          />
          {pinError === 'wrong_pin' && (
            <div className="text-red-400 text-xs text-center leading-relaxed">
              Falscher PIN für diesen Namen.{' '}
              <button onClick={() => { window.location.href = '/profile?next=/game' }} className="underline">PIN ändern</button>
            </div>
          )}
          {pinError === 'name_taken' && (
            <div className="text-red-400 text-xs text-center leading-relaxed">
              Dieser Name ist vergeben.{' '}
              <button onClick={() => { window.location.href = '/profile?next=/game' }} className="underline">Profil öffnen</button>
            </div>
          )}
          <button
            onClick={submitScore}
            disabled={submitting}
            className="py-4 pixel text-xs border-2 border-gold bg-dungeon-gold text-dungeon-black active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'SPEICHERT...' : 'SCORE EINTRAGEN'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={onLeaderboard} className="py-4 pixel text-xs border-2 border-gold text-gold active:scale-95">
            BESTENLISTE
          </button>
          <button onClick={onRetry} className="py-4 pixel text-xs border border-dungeon-border text-gray-400 active:scale-95">
            {isDaily ? 'NOCHMAL (HELD BLEIBT)' : 'NOCHMAL'}
          </button>
          {isDaily && !won && (
            <div className="text-purple-500 text-xs text-center leading-relaxed">
              Dein LV{player.level}-Held bleibt bis Mitternacht.
            </div>
          )}
          <button onClick={onMenu} className="py-4 pixel text-xs text-gray-600 active:scale-95">
            HAUPTMENÜ
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Shared Components ────────────────────────────────────────────────────────

function HpBar({ hp, maxHp, color = 'bg-green-700' }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const barColor = pct > 50 ? 'bg-green-700' : pct > 25 ? 'bg-yellow-600' : 'bg-red-700'

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>HP</span>
        <span>{hp}/{maxHp}</span>
      </div>
      <div className="bar-track">
        <div className={`bar-fill ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
