import { useState, useEffect, useReducer, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CLASSES } from '../game/classes'
import { STORY, saveStoryProgress } from '../game/story'
import { getMonsterForFloor, getEliteMonsterForFloor, getMidBossForFloor } from '../game/monsters'
import { generateDungeon, generateBranchingDungeon, generateInfiniteDungeon, getRoomAtFloor, getDailySeed, getDailyModifier, getDailyChallenge, ROOM_TYPES, getBiome, BIOMES } from '../game/dungeon'
import { checkAndUnlockAchievements, ACHIEVEMENTS, loadAchievements } from '../game/achievements'
import { applyPrestigeBonuses, earnPrestigePoints, addPrestigePoints } from '../game/prestige'
import { updateStats } from '../game/stats'
import { createCombatState, applyPlayerAction, applyBlock, applyDodge, resolveEnemyAttack, ATTACK_LABELS } from '../game/combat'
import { attachSwipeListener } from '../game/swipe'
import { sfx, unlockAudio } from '../game/sound'
import MonsterSprite from '../components/MonsterSprite'
import AnimatedSprite from '../components/AnimatedSprite'
import VfxCanvas from '../components/VfxCanvas'
import BiomeBg from '../components/BiomeBg'
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
  return shuffled.slice(0, Math.min(count, available.length)).map(p => p.id)
}

// ─── Events & Traps ───────────────────────────────────────────────────────────

export const EVENTS = [
  { id: 'healing_spring', icon: '💧', title: 'Heilquelle',       text: 'Eine magische Quelle sprudelt aus dem Fels.',    apply: p => ({ ...p, hp: Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.25)) }), reward: '+25% HP' },
  { id: 'ancient_tome',   icon: '📖', title: 'Uraltes Buch',     text: 'Du liest schnell ein paar Seiten. Weisheit strömt ein.', apply: p => ({ ...p, xp: p.xp + 40 }), reward: '+40 XP' },
  { id: 'gold_stash',     icon: '💰', title: 'Verborgenes Gold', text: 'Hinter einem losen Stein schimmert es golden.', apply: p => ({ ...p, gold: p.gold + 35 }), reward: '+35 Gold' },
  { id: 'weapon_grind',   icon: '⚒️', title: 'Schleifstein',    text: 'Du wetze deine Waffe auf einem alten Stein.', apply: p => ({ ...p, atk: p.atk + 4 }), reward: '+4 ATK' },
  { id: 'iron_rations',   icon: '🍖', title: 'Eiserne Rationen', text: 'Stale but nutritious. You feel a bit tougher.', apply: p => ({ ...p, def: p.def + 3 }), reward: '+3 DEF' },
  { id: 'cursed_idol',    icon: '🗿', title: 'Verfluchtes Idol', text: 'Eine häßliche Statue... du spürst dunkle Energie.', apply: p => ({ ...p, hp: Math.max(1, p.hp - Math.round(p.maxHp * 0.12)) }), reward: '-12% HP' },
  { id: 'mysterious_fog', icon: '🌫️', title: 'Mystischer Nebel', text: 'Der Nebel füllt deine Seele mit neuer Energie.',   apply: p => ({ ...p, xp: p.xp + 25, gold: p.gold + 15 }), reward: '+25 XP, +15 Gold' },
]

export const TRAPS = [
  { id: 'spike_pit',     icon: '🔩', title: 'Stachelgrube',  text: 'Der Boden gibt nach — Stacheln schießen empor!', damage: 0.20 },
  { id: 'poison_dart',   icon: '🎯', title: 'Giftpfeil',     text: 'Ein Klick. Ein Pfeil schnellt aus der Wand!',     damage: 0.15 },
  { id: 'falling_rocks', icon: '🪨', title: 'Steinschlag',   text: 'Die Decke bricht — Felsbrocken prasseln nieder!', damage: 0.25 },
  { id: 'fire_jet',      icon: '🔥', title: 'Feuerstoß',     text: 'Eine verborgene Rune zündet — Flammen!',          damage: 0.18 },
]

function rollEvent() { return EVENTS[Math.floor(Math.random() * EVENTS.length)] }
function rollTrap()  { return TRAPS[Math.floor(Math.random() * TRAPS.length)] }

// ─── Daily Hero Persistence ───────────────────────────────────────────────────
// Daily runs keep level/perks/stats across attempts; only HP resets each try.
// Hero is synced to the backend so it carries across devices.
// localStorage is used as an offline cache / anonymous fallback.

const DAILY_HERO_KEY = 'dungeontap_daily_hero'
const TODAY = new Date().toISOString().slice(0, 10)

// Extract the fields that should persist across attempts
function buildHeroSnapshot(player) {
  return {
    class:       player.class,
    maxHp:       player.maxHp,
    atk:         player.atk,
    def:         player.def,
    level:       player.level,
    xp:          player.xp,
    xpToNext:    player.xpToNext,
    activePerks: player.activePerks ?? [],
    lifesteal:   player.lifesteal,
    fastSpecial: player.fastSpecial,
    toughBlock:  player.toughBlock,
    goldBonus:   player.goldBonus,
    alwaysDodge: player.alwaysDodge,
  }
}

// localStorage only (sync, used as fallback)
export function loadDailyHero() {
  try {
    const saved = JSON.parse(localStorage.getItem(DAILY_HERO_KEY) || 'null')
    if (saved?.date === TODAY) return saved.player
  } catch {}
  return null
}

export function saveDailyHero(player) {
  localStorage.setItem(DAILY_HERO_KEY, JSON.stringify({ date: TODAY, player: buildHeroSnapshot(player) }))
}

// Backend-aware async versions used by the game components
export async function loadDailyHeroAsync() {
  const profile = JSON.parse(localStorage.getItem('dungeontap_profile') || 'null')

  if (profile?.name) {
    try {
      const r = await fetch(`/api/daily-dungeon/hero?name=${encodeURIComponent(profile.name)}`)
      if (r.ok) {
        const data = await r.json()
        if (data.hero) {
          saveDailyHero(data.hero) // cache locally
          return data.hero
        }
      }
    } catch {} // offline — fall through to localStorage
  }

  return loadDailyHero()
}

export async function saveDailyHeroAsync(player) {
  saveDailyHero(player) // always persist locally first

  const profile = JSON.parse(localStorage.getItem('dungeontap_profile') || 'null')
  if (!profile?.name || !profile?.pin) return // anonymous user — localStorage only

  try {
    await fetch('/api/daily-dungeon/hero', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profile.name, pin: profile.pin, hero: buildHeroSnapshot(player) }),
    })
  } catch {} // silent — localStorage is the safety net
}

// ─── Run History ──────────────────────────────────────────────────────────────

const RUN_HISTORY_KEY = 'dungeontap_run_history'
const MAX_HISTORY = 5

export function saveRunToHistory(player, won) {
  try {
    const history = JSON.parse(localStorage.getItem(RUN_HISTORY_KEY) || '[]')
    const entry = {
      date: new Date().toLocaleDateString('de-DE'),
      class: player.class,
      floor: player.floor,
      level: player.level,
      kills: player.kills,
      gold: player.gold,
      perks: player.activePerks ?? [],
      won,
    }
    const updated = [entry, ...history].slice(0, MAX_HISTORY)
    localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(updated))
  } catch {}
}

export function loadRunHistory() {
  try {
    return JSON.parse(localStorage.getItem(RUN_HISTORY_KEY) || '[]')
  } catch { return [] }
}

// ─── Init & State ─────────────────────────────────────────────────────────────

function initRun(playerClass, seed, savedHero = null, isInfinite = false, isStory = false, modifier = null, isBranching = false, challenge = null) {
  const cls = CLASSES[playerClass]

  // Branching mode uses an empty room list — rooms added dynamically as player picks nodes
  const dungeon = isStory
    ? { seed: null, rooms: [], storyMode: true }
    : isInfinite
      ? generateInfiniteDungeon(seed)
      : isBranching
        ? { seed, rooms: [] }
        : generateDungeon(seed)

  let player
  if (savedHero) {
    player = {
      ...savedHero,
      hp: savedHero.maxHp,
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
      xpToNext: xpNeeded(1),
      floor: 1,
      kills: 0,
      items: [],
      activePerks: [],
      perkOptions: 3,
    }
    // Apply prestige bonuses (permanent upgrades from previous runs)
    player = applyPrestigeBonuses(player)
  }

  const branchingMap = isBranching
    ? { ...generateBranchingDungeon(seed), currentNodeId: null, visitedNodeIds: [] }
    : null

  return {
    dungeon, player,
    phase: isStory ? 'act_intro' : isBranching ? 'branching_map' : 'dungeon_map',
    combat: null, floorIndex: 0, pendingPerkIds: null,
    modifier: modifier ?? { id: 'none' },
    branchingMap,
    challenge: challenge ?? null,
    _afterLevelUp: null,
    // Story-specific
    storyAct: 1,
    storySegmentIndex: -1,
    storyPendingSegIdx: null,
  }
}

// Advances story to the next segment (or junction/victory)
// Called after: act_intro dismissed, room completed in story mode, perk picked in story mode
function resolveStoryContinue(state) {
  const nextSegIdx = (state.storySegmentIndex ?? -1) + 1
  const act = STORY.acts[(state.storyAct ?? 1) - 1]

  // Act complete?
  if (nextSegIdx >= act.segments.length) {
    const isLastAct = state.storyAct >= STORY.acts.length
    saveStoryProgress(state.storyAct, isLastAct)
    return { ...state, phase: isLastAct ? 'story_complete' : 'act_victory', storySegmentIndex: nextSegIdx }
  }

  const nextSeg = act.segments[nextSegIdx]

  // Junction: let player choose
  if (nextSeg.type === 'junction') {
    return { ...state, phase: 'story_junction', storySegmentIndex: nextSegIdx }
  }

  // Fixed room: add to dungeon and show map
  const nextFloor = (act.startFloor ?? 1) + nextSegIdx
  const newRoom = { ...nextSeg.room, floor: nextFloor, cleared: false }
  const newDungeon = { ...state.dungeon, rooms: [...state.dungeon.rooms, newRoom] }
  const newFloorIndex = newDungeon.rooms.length - 1
  return {
    ...state,
    dungeon: newDungeon,
    floorIndex: newFloorIndex,
    phase: 'story_map',
    storySegmentIndex: nextSegIdx,
    player: { ...state.player, floor: nextFloor },
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ENTER_ROOM': {
      const rawRoom = state.dungeon.rooms[state.floorIndex]
      // noShop challenge: close all shops → become combat rooms
      const room = (state.challenge?.noShop && rawRoom?.type === 'shop')
        ? { ...rawRoom, type: 'combat' }
        : rawRoom
      const mod = state.modifier ?? {}
      // Apply monster ATK modifier if active
      function scaledMonster(m) {
        if (!mod.monsterAtkMult) return m
        return { ...m, atk: Math.round(m.atk * mod.monsterAtkMult) }
      }
      if (room.type === 'combat') {
        const monster = scaledMonster(getMonsterForFloor(state.player.floor))
        const combat = createCombatState(state.player, monster)
        return { ...state, phase: 'combat', combat }
      }
      if (room.type === 'elite') {
        const monster = scaledMonster(getEliteMonsterForFloor(state.player.floor))
        const combat = createCombatState(state.player, monster)
        return { ...state, phase: 'combat', combat }
      }
      if (room.type === 'mid_boss') {
        const monster = scaledMonster(room.bossId
          ? getMidBossForFloor(state.player.floor, room.bossId)
          : getMidBossForFloor(state.player.floor))
        const combat = createCombatState(state.player, monster)
        return { ...state, phase: 'boss_intro', combat, isMidBoss: true }
      }
      if (room.type === 'boss') {
        const monster = scaledMonster(getMonsterForFloor(state.player.floor, true))
        const combat = createCombatState(state.player, monster)
        return { ...state, phase: 'boss_intro', combat, isMidBoss: false }
      }
      if (room.type === 'event') {
        const event = rollEvent()
        const player = event.apply(state.player)
        return { ...state, phase: 'event', currentEvent: event, player }
      }
      if (room.type === 'trap') {
        const trap = rollTrap()
        const dmg = Math.round(state.player.maxHp * trap.damage)
        const player = { ...state.player, hp: Math.max(1, state.player.hp - dmg) }
        return { ...state, phase: 'trap', currentTrap: trap, trapDmg: dmg, player }
      }
      if (room.type === 'rest') {
        const restPct = mod.healPct ?? 0.3
        const heal = Math.round(state.player.maxHp * restPct)
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
        const mod     = state.modifier ?? {}
        const rawXp   = state.combat.monster.xp
        const xpGain  = mod.xpMult   ? Math.round(rawXp * mod.xpMult)   : rawXp
        const rawGold = rollLootGold(state.combat.monster, state.player)
        const goldGain = mod.goldMult ? Math.round(rawGold * mod.goldMult) : rawGold
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

    case 'DISMISS_BOSS_INTRO': {
      return { ...state, phase: 'combat' }
    }

    case 'DISMISS_LEVEL_UP': {
      const perkId = state.pendingPerkIds?.[0]
      let player = state.player
      if (perkId) {
        const perk = PERKS.find(p => p.id === perkId)
        player = { ...perk.apply(state.player), activePerks: [...(state.player.activePerks ?? []), perkId] }
      }
      if (state.dungeon?.storyMode && state.storyPendingSegIdx != null) {
        return resolveStoryContinue({
          ...state, player, pendingPerkIds: null,
          storySegmentIndex: state.storyPendingSegIdx - 1,
          storyPendingSegIdx: null,
        })
      }
      const nextPhase = state._afterLevelUp ?? 'dungeon_map'
      return { ...state, phase: nextPhase, pendingPerkIds: null, player, _afterLevelUp: null }
    }

    case 'PICK_PERK': {
      const perk = PERKS.find(p => p.id === action.perkId)
      if (!perk || !state.pendingPerkIds?.includes(action.perkId)) return state
      const player = { ...perk.apply(state.player), activePerks: [...(state.player.activePerks ?? []), action.perkId] }
      // Story mode: resume story after perk selection
      if (state.dungeon?.storyMode && state.storyPendingSegIdx != null) {
        return resolveStoryContinue({
          ...state, player, pendingPerkIds: null,
          storySegmentIndex: state.storyPendingSegIdx - 1,
          storyPendingSegIdx: null,
        })
      }
      const nextPhase = state._afterLevelUp ?? 'dungeon_map'
      return { ...state, phase: nextPhase, pendingPerkIds: null, player, _afterLevelUp: null }
    }

    case 'CHOOSE_NODE': {
      const { nodeId } = action
      const bm = state.branchingMap
      if (!bm) return state
      const node = bm.nodes[nodeId]
      if (!node) return state
      // Validate: must be an available next node
      const available = bm.currentNodeId
        ? bm.nodes[bm.currentNodeId]?.next ?? []
        : bm.layers[0]
      if (!available.includes(nodeId)) return state

      const newRoom = { type: node.type, floor: state.player.floor, cleared: false }
      const newRooms = [...state.dungeon.rooms, newRoom]
      const newFloorIndex = newRooms.length - 1
      const newDungeon = { ...state.dungeon, rooms: newRooms }
      const newBranchingMap = {
        ...bm,
        currentNodeId: nodeId,
        visitedNodeIds: [...(bm.visitedNodeIds ?? []), nodeId],
      }
      return {
        ...state,
        dungeon: newDungeon,
        floorIndex: newFloorIndex,
        branchingMap: newBranchingMap,
        phase: 'dungeon_map',
      }
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

    case 'DISMISS_ACT_INTRO': {
      return resolveStoryContinue(state)
    }

    case 'STORY_CHOOSE_PATH': {
      const act = STORY.acts[(state.storyAct ?? 1) - 1]
      const segment = act.segments[state.storySegmentIndex]
      const chosen = segment.options.find(o => o.roomType === action.roomType)
      const floor = (act.startFloor ?? 1) + state.storySegmentIndex
      const newRoom = { type: action.roomType, label: chosen?.label, floor, cleared: false }
      const dungeon = { ...state.dungeon, rooms: [...state.dungeon.rooms, newRoom] }
      const floorIndex = dungeon.rooms.length - 1
      return { ...state, dungeon, floorIndex, phase: 'story_map', player: { ...state.player, floor } }
    }

    case 'NEXT_ACT': {
      const nextAct = (state.storyAct ?? 1) + 1
      if (nextAct > STORY.acts.length) {
        return { ...state, phase: 'story_complete' }
      }
      return { ...state, storyAct: nextAct, storySegmentIndex: -1, phase: 'act_intro' }
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

// XP needed per level — quadratic so early levels come fast, later ones require real effort:
//   L1→2: 70   L2→3: 100  L3→4: 140  L5→6: 250  L8→9: 490  L10→11: 700
function xpNeeded(level) { return Math.round(50 + level * 15 + level * level * 5) }

function checkLevelUp(player) {
  if (player.xp < player.xpToNext) return { player, didLevel: false }
  const newLevel = player.level + 1
  const leveled = { ...player, level: newLevel, xpToNext: xpNeeded(newLevel) }
  // Stat gains are now chosen via the perk system (no auto-apply here)
  return { player: leveled, didLevel: true }
}

function advanceFloor(state) {
  // Story mode: delegate to story segment advancement
  if (state.dungeon?.storyMode) {
    const dungeon = markCleared(state.dungeon, state.floorIndex)
    const basePlayer = { ...state.player }
    const { player, didLevel } = checkLevelUp(basePlayer)
    if (didLevel) {
      const pendingPerkIds = rollPerks(state.player.perkOptions ?? 3, player.activePerks ?? [])
      const nextSegIdx = (state.storySegmentIndex ?? -1) + 1
      return { ...state, dungeon, phase: 'level_up', player, pendingPerkIds, storyPendingSegIdx: nextSegIdx }
    }
    return resolveStoryContinue({ ...state, dungeon })
  }

  const nextIndex = state.floorIndex + 1
  let dungeon = markCleared(state.dungeon, state.floorIndex)

  // ── Branching map mode (normal runs) ──────────────────────────────────────
  if (state.branchingMap) {
    const bm = state.branchingMap
    const currentNode = bm.nodes[bm.currentNodeId]
    const isLastLayer = currentNode?.layer === bm.totalLayers - 1

    const basePlayer = { ...state.player, floor: state.player.floor + 1 }
    const { player, didLevel } = checkLevelUp(basePlayer)
    const perkCount = state.player.perkOptions ?? 3

    if (isLastLayer) {
      if (didLevel) {
        return { ...state, dungeon, phase: 'level_up', player,
          pendingPerkIds: rollPerks(perkCount, player.activePerks ?? []),
          _afterLevelUp: 'victory_run' }
      }
      return { ...state, dungeon, phase: 'victory_run', player }
    }

    if (didLevel) {
      return { ...state, dungeon, phase: 'level_up', floorIndex: nextIndex, player,
        pendingPerkIds: rollPerks(perkCount, player.activePerks ?? []),
        _afterLevelUp: 'branching_map' }
    }
    return { ...state, dungeon, phase: 'branching_map', floorIndex: nextIndex, player }
  }

  // ── Infinite daily dungeon ────────────────────────────────────────────────
  if (dungeon.infinite && nextIndex >= dungeon.rooms.length) {
    const nextFloor = nextIndex + 1
    const newRoom = getRoomAtFloor(dungeon.seed, nextFloor)
    dungeon = { ...dungeon, rooms: [...dungeon.rooms, newRoom] }
  }

  if (nextIndex >= dungeon.rooms.length && !dungeon.infinite) {
    return { ...state, phase: 'victory_run' }
  }

  const basePlayer = { ...state.player, floor: state.player.floor + 1 }
  const { player, didLevel } = checkLevelUp(basePlayer)
  if (didLevel) {
    const pendingPerkIds = rollPerks(state.player.perkOptions ?? 3, player.activePerks ?? [])
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

// Outer shell: fetches daily seed + hero (backend → localStorage fallback) before starting
export default function Game() {
  // Unlock Web Audio + prime Vibration API on first interaction anywhere in the game.
  // Must run once globally so it fires even if the player taps a menu button before
  // reaching the swipe combat zone.
  useEffect(() => {
    const handler = () => {
      unlockAudio()
      document.removeEventListener('pointerdown', handler, true)
    }
    document.addEventListener('pointerdown', handler, true) // capture phase — catches everything
    return () => document.removeEventListener('pointerdown', handler, true)
  }, [])

  const [params] = useSearchParams()
  const mode        = params.get('mode')       // 'daily' | 'story' | 'custom' | 'challenge' | null
  const urlSeed     = params.get('seed')        // set for shared custom runs
  const urlClass    = params.get('class')       // set for shared custom runs
  const isDaily     = mode === 'daily'
  const isChallenge = mode === 'challenge'

  // Challenge may force a class; otherwise use sessionStorage / URL
  const dailyChallenge = isChallenge ? getDailyChallenge() : null
  const playerClass    = dailyChallenge?.forcedClass
    || urlClass
    || sessionStorage.getItem('playerClass')
    || 'warrior'

  const [ready, setReady]         = useState(false)
  const [seed, setSeed]           = useState(null)
  const [savedHero, setSavedHero] = useState(null)
  const [modifier, setModifier]   = useState(null)

  useEffect(() => {
    async function init() {
      // 1. Resolve seed
      let resolvedSeed
      if (urlSeed) {
        resolvedSeed = parseInt(urlSeed, 10) || Math.floor(Math.random() * 0xFFFFFF)
      } else if (isDaily || isChallenge) {
        // Both daily and challenge use the same shared daily seed
        try {
          const r = await fetch('/api/daily-dungeon/seed')
          const d = await r.json()
          resolvedSeed = d.seed
        } catch {
          resolvedSeed = getDailySeed()
        }
      } else {
        resolvedSeed = Math.floor(Math.random() * 0xFFFFFF)
      }
      setSeed(resolvedSeed)

      // 2. Daily modifier (derived from seed, daily only)
      if (isDaily) {
        setModifier(getDailyModifier(resolvedSeed))
      }

      // 3. Load daily hero (daily only — challenge always starts fresh)
      if (isDaily) {
        const hero = await loadDailyHeroAsync()
        setSavedHero(hero)
      }

      setReady(true)
    }
    init()
  }, []) // eslint-disable-line

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full bg-dungeon">
        <div className="pixel text-gold text-xs animate-pulse">LADE DUNGEON...</div>
      </div>
    )
  }

  // Branching map: only for fresh normal runs (not daily, not story, not challenge, not shared URL)
  const isBranching = !isDaily && !isChallenge && mode !== 'story' && !urlSeed

  return (
    <GameInner
      playerClass={playerClass}
      seed={seed}
      isDaily={isDaily}
      savedHero={savedHero}
      modifier={modifier}
      isBranching={isBranching}
      challenge={dailyChallenge}
    />
  )
}

function GameInner({ playerClass, seed, isDaily, savedHero, modifier, isBranching, challenge }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const isStory  = params.get('mode') === 'story'
  const isReturningDaily = isDaily && savedHero !== null
  const [state, dispatch] = useReducer(reducer, null, () => initRun(playerClass, seed, savedHero, isDaily && !isStory, isStory, modifier, isBranching && !isStory, challenge))

  // Speedrun timer
  const runStartRef = useRef(Date.now())
  const [elapsedSec, setElapsedSec] = useState(0)
  useEffect(() => {
    if (!challenge?.speedrun) return
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - runStartRef.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [challenge?.speedrun]) // eslint-disable-line

  // Newly unlocked achievements to show on RunEnd
  const [newAchievements, setNewAchievements] = useState([])
  const [prestigePointsEarned, setPrestigePointsEarned] = useState(0)

  // Sync daily hero to backend on every floor advance (cross-device support)
  useEffect(() => {
    if (isDaily && !isStory && state.player.floor > 1) {
      saveDailyHeroAsync(state.player)
    }
  }, [state.player.floor]) // eslint-disable-line

  // Save daily hero + run history + check achievements + earn prestige when run ends
  useEffect(() => {
    const isRunEnd = state.phase === 'game_over' || state.phase === 'victory_run' || state.phase === 'story_complete'
    if (isRunEnd) {
      if (isDaily && !isStory) saveDailyHeroAsync(state.player)
      const won = state.phase === 'victory_run' || state.phase === 'story_complete'
      saveRunToHistory(state.player, won)
      updateStats(state.player, won)
      const newly = checkAndUnlockAchievements(state.player, won, isDaily)
      if (newly.length > 0) setNewAchievements(newly)
      const pts = earnPrestigePoints(state.player, won)
      addPrestigePoints(pts)
      setPrestigePointsEarned(pts)
    }
  }, [state.phase]) // eslint-disable-line
  const swipeZoneRef = useRef(null)
  const telegraphTimerRef = useRef(null)

  // Auto-resolve enemy attack after telegraph window.
  // PWA background recovery: browsers (especially iOS Safari) throttle or
  // fully suspend setTimeout when backgrounded. We use three complementary
  // events to guarantee resolution when the app returns to the foreground:
  //   • visibilitychange — standard (Chrome Android, desktop)
  //   • pageshow          — iOS Safari PWA suspend/resume
  //   • window focus      — fallback for any remaining edge cases
  // Double-dispatch is safe: resolveEnemyAttack() returns unchanged state
  // if combat.phase is no longer 'enemy_telegraph'.
  useEffect(() => {
    if (state.phase !== 'combat' || state.combat?.phase !== 'enemy_telegraph') return

    telegraphTimerRef.current = setTimeout(() => {
      dispatch({ type: 'RESOLVE_ENEMY' })
    }, TELEGRAPH_MS)

    function resolveIfStuck() {
      clearTimeout(telegraphTimerRef.current)
      dispatch({ type: 'RESOLVE_ENEMY' })
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') resolveIfStuck()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pageshow', resolveIfStuck)       // iOS PWA resume
    window.addEventListener('focus', resolveIfStuck)          // fallback

    return () => {
      clearTimeout(telegraphTimerRef.current)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pageshow', resolveIfStuck)
      window.removeEventListener('focus', resolveIfStuck)
    }
  }, [state.combat?.phase, state.combat?.pendingEnemyMove]) // eslint-disable-line

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

  if (state.phase === 'act_intro') {
    return (
      <ActIntroScreen
        act={STORY.acts[(state.storyAct ?? 1) - 1]}
        onStart={() => dispatch({ type: 'DISMISS_ACT_INTRO' })}
        onQuit={() => navigate('/')}
      />
    )
  }
  if (state.phase === 'story_junction') {
    const act = STORY.acts[(state.storyAct ?? 1) - 1]
    const segment = act.segments[state.storySegmentIndex]
    return (
      <JunctionScreen
        options={segment?.options ?? []}
        player={state.player}
        onChoose={roomType => dispatch({ type: 'STORY_CHOOSE_PATH', roomType })}
      />
    )
  }
  if (state.phase === 'act_victory') {
    const act = STORY.acts[(state.storyAct ?? 1) - 1]
    const isLast = state.storyAct >= STORY.acts.length
    return (
      <ActVictoryScreen
        act={act}
        isLast={isLast}
        onNext={() => dispatch({ type: 'NEXT_ACT' })}
        onMenu={() => navigate('/')}
      />
    )
  }
  if (state.phase === 'story_complete') {
    return (
      <StoryCompleteScreen
        player={state.player}
        onMenu={() => navigate('/')}
        onLeaderboard={() => navigate('/leaderboard')}
      />
    )
  }
  if (state.phase === 'branching_map') {
    return (
      <BranchingMapScreen
        state={state}
        onChoose={(nodeId) => dispatch({ type: 'CHOOSE_NODE', nodeId })}
        onQuit={() => navigate('/')}
      />
    )
  }
  if (state.phase === 'dungeon_map' || state.phase === 'story_map') {
    return (
      <DungeonMap
        state={state}
        onEnter={() => dispatch({ type: 'ENTER_ROOM' })}
        onQuit={() => navigate('/')}
        isReturningDaily={isReturningDaily}
        isStory={state.dungeon?.storyMode}
      />
    )
  }
  if (state.phase === 'combat' || state.phase === 'monster_dying') {
    return (
      <CombatScreen
        state={state}
        swipeZoneRef={swipeZoneRef}
        dying={state.phase === 'monster_dying'}
        onDeathDone={() => dispatch({ type: 'CONFIRM_KILL' })}
        onSpecial={(timingBonus) => dispatch({ type: 'PLAYER_ACTION', action: 'special', timingBonus })}
        speedrunSec={state.challenge?.speedrun ? elapsedSec : null}
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
  if (state.phase === 'boss_intro') {
    return (
      <BossIntroScreen
        state={state}
        onFight={() => dispatch({ type: 'DISMISS_BOSS_INTRO' })}
      />
    )
  }
  if (state.phase === 'event') {
    return <EventScreen state={state} onNext={() => dispatch({ type: 'LEAVE_ROOM' })} />
  }
  if (state.phase === 'trap') {
    return <TrapScreen state={state} onNext={() => dispatch({ type: 'LEAVE_ROOM' })} />
  }
  const isChallenge = !!state.challenge
  if (state.phase === 'game_over') {
    return (
      <RunEnd
        state={state}
        won={false}
        isDaily={isDaily}
        newAchievements={newAchievements}
        prestigePointsEarned={prestigePointsEarned}
        elapsedSec={elapsedSec}
        onRetry={state.challenge?.permadeath ? null : () => isDaily ? navigate('/game?mode=daily') : isChallenge ? navigate('/game?mode=challenge') : navigate('/class-select')}
        onLeaderboard={() => navigate('/leaderboard')}
        onPrestige={() => navigate('/prestige')}
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
        newAchievements={newAchievements}
        prestigePointsEarned={prestigePointsEarned}
        elapsedSec={elapsedSec}
        onRetry={state.challenge?.permadeath ? null : () => isDaily ? navigate('/game?mode=daily') : isChallenge ? navigate('/game?mode=challenge') : navigate('/class-select')}
        onLeaderboard={() => navigate('/leaderboard')}
        onPrestige={() => navigate('/prestige')}
        onMenu={() => navigate('/')}
      />
    )
  }
}

// ─── Dungeon Map ──────────────────────────────────────────────────────────────

function DungeonMap({ state, onEnter, onQuit, isReturningDaily, isStory }) {
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

      {/* Biome indicator */}
      {(() => {
        const biome = getBiome(player.floor)
        const b = BIOMES[biome]
        return (
          <div className={`flex items-center justify-center gap-2 mt-2 px-3 py-1 border ${b.border} text-xs pixel ${b.accent}`}>
            {biome === 'cave' ? '🪨' : biome === 'crypt' ? '🏚' : biome === 'abyss' ? '🌑' : '🔥'} {b.label.toUpperCase()} — ETAGE {player.floor}
          </div>
        )
      })()}

      {/* Daily modifier banner */}
      {state.modifier && state.modifier.id !== 'none' && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 px-3 py-1.5 border border-amber-800 bg-amber-950/40 text-amber-400 text-xs text-center pixel"
          style={{ fontSize: '0.5rem' }}
        >
          {state.modifier.icon} {state.modifier.title.toUpperCase()} — {state.modifier.desc}
        </motion.div>
      )}

      {/* Challenge banner */}
      {state.challenge && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 px-3 py-1.5 border border-red-900 bg-red-950/30 text-red-400 text-xs text-center pixel"
          style={{ fontSize: '0.5rem' }}
        >
          {state.challenge.icon} CHALLENGE: {state.challenge.title.toUpperCase()} — {state.challenge.desc}
        </motion.div>
      )}

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

      {/* Story act banner */}
      {isStory && (() => {
        const act = STORY.acts[(state.storyAct ?? 1) - 1]
        return (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 px-3 py-2 border border-amber-900 bg-amber-950/40 text-center"
          >
            <div className="pixel text-xs text-amber-400">{act?.icon} {act?.subtitle}: {act?.title}</div>
          </motion.div>
        )
      })()}

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

function CombatScreen({ state, swipeZoneRef, onSpecial, dying = false, onDeathDone, speedrunSec = null }) {
  const { combat, player } = state
  const { monster, phase, pendingEnemyMove, specialBar } = combat
  const atk = pendingEnemyMove ? ATTACK_LABELS[pendingEnemyMove] : null
  const specialReady = specialBar >= 100 && phase === 'player_turn'

  // Play monster death sound once when dying starts
  useEffect(() => { if (dying) sfx.monsterDeath() }, [dying])

  // Hit flash states
  const [monsterFlash, setMonsterFlash] = useState(false)
  const [playerFlash,  setPlayerFlash]  = useState(false)

  // Screen shake — triggered on heavy hits
  const [shakeKey, setShakeKey] = useState(0)
  function triggerShake() { setShakeKey(k => k + 1) }

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
        break
      case 'enemy_attack':
        setPlayerFlash(true)
        setTimeout(() => setPlayerFlash(false), 300)
        sfx.hit()
        // Heavy hit shake: if damage > 20% of max HP
        if (entry.dmg >= Math.round(combat.player.maxHp * 0.20)) triggerShake()
        break
      case 'player_blocked':
        setPlayerFlash(true)
        setTimeout(() => setPlayerFlash(false), 200)
        // Shake even on blocked heavy attacks (WUCHT / power moves)
        if (entry.heavy) triggerShake()
        break
      case 'player_grazed':
        setPlayerFlash(true)
        setTimeout(() => setPlayerFlash(false), 200)
        break
      case 'player_dodged':
        break
      case 'shield_counter':
        setPlayerFlash(true)
        setTimeout(() => setPlayerFlash(false), 200)
        sfx.shieldCounter()
        break
      case 'shield_counter_dmg':
        break
      case 'status_tick':
        if (entry.effect === 'poison' && entry.target === 'player') {
          sfx.poison()
          setPlayerFlash(true)
          setTimeout(() => setPlayerFlash(false), 200)
        }
        if (entry.effect === 'burn' && entry.target === 'monster') {
          sfx.burn()
          setMonsterFlash(true)
          setTimeout(() => setMonsterFlash(false), 120)
        }
        break
      case 'status_apply':
        if (entry.effect === 'poison') sfx.poison()
        break
      default: break
    }

    if (combat.phase === 'victory') sfx.victory()
    if (combat.phase === 'defeat')  sfx.death()
  }, [combat.log.length]) // eslint-disable-line

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
    unlockAudio()
    const perfect = Math.abs(cursorRef.current - 50) <= SWEET_SPOT
    sfx.special()
    onSpecial(perfect ? 2.0 : 1.0)
  }

  const biome = getBiome(player.floor)
  const monsterAnim = dying ? 'death'
    : monsterFlash ? 'hurt'
    : phase === 'enemy_telegraph' ? 'attack'
    : 'idle'
  const lastLogEntry = combat.log[combat.log.length - 1]

  return (
    <div key={shakeKey} className={`relative flex flex-col h-full safe-top safe-bottom select-none ${shakeKey > 0 ? 'shake' : ''}`}>
      {/* Procedural biome background */}
      <BiomeBg biome={biome} />

      {/* Canvas VFX overlay — particles + floating damage numbers */}
      <VfxCanvas lastLogEntry={lastLogEntry} />

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
      <div className="relative flex flex-col items-center pt-8 px-4 gap-3" style={{ zIndex: 2 }}>
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
            <AnimatedSprite id={monster.id} size={96} anim="death" />
          </motion.div>
        ) : (
          <AnimatedSprite id={monster.id} size={96} anim={monsterAnim} />
        )}

        <div className="flex items-center gap-2">
          {monster.isElite && (
            <span className="pixel text-xs text-red-400 border border-red-800 px-1 py-0.5 bg-red-950/50">ELITE</span>
          )}
          {monster.isBoss && (
            <span className="pixel text-xs text-yellow-400 border border-yellow-700 px-1 py-0.5 bg-yellow-950/50 animate-pulse">BOSS</span>
          )}
          <div className="pixel text-white text-xs">{monster.name}</div>
        </div>
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
        style={{ zIndex: 2 }}
      >
        <div className="text-gray-700 text-xs pixel text-center leading-loose">
          {phase === 'player_turn' && !specialReady && <>↑ Angriff <span className="text-gray-800">[↑]</span></>}
          {phase === 'player_turn' && specialReady  && <span className="text-purple-300 animate-pulse">SPEZIAL BEREIT!<br/>Tippen / [Space]</span>}
          {phase === 'enemy_telegraph' && !atk?.warn && <span className="text-gray-500">← Block [←] &nbsp; → Dodge [→]</span>}
          {phase === 'enemy_telegraph' &&  atk?.warn && <span className="text-red-400 animate-pulse">← BLOCKEN! [←]<br/>(nicht ausweichbar)</span>}
        </div>
      </div>

      {/* Player HUD */}
      <div className="px-4 pb-6 safe-bottom flex flex-col gap-3" style={{ zIndex: 2 }}>
        {speedrunSec !== null && (
          <div className="text-center pixel text-amber-400" style={{ fontSize: '0.55rem' }}>
            ⏱️ {Math.floor(speedrunSec/60)}:{String(speedrunSec%60).padStart(2,'0')}
          </div>
        )}
        <HpBar hp={combat.player.hp} maxHp={combat.player.maxHp} />
        {/* Active status effects */}
        {(combat.statusEffects?.length > 0 || combat.monsterStatus?.length > 0) && (
          <div className="flex gap-3 text-xs">
            {combat.statusEffects?.map(e => (
              <span key={e.type} className="text-green-500 pixel">
                {e.type === 'poison' ? '☠' : '?'} {e.turnsLeft}
              </span>
            ))}
            {combat.monsterStatus?.map(e => (
              <span key={e.type} className="text-orange-400 pixel">
                {e.type === 'burn' ? '🔥' : '?'} {e.turnsLeft}
              </span>
            ))}
          </div>
        )}

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
    case 'player_attack':       return <>Du triffst für <span className="text-orange-400">{entry.dmg}</span> Schaden</>
    case 'player_special':      return <>{entry.perfect ? '✨ PERFEKT! ' : ''}<span className="text-purple-400">{entry.dmg}</span> Spezialschaden</>
    case 'player_dodge':        return <span className="text-green-400">Ausgewichen!</span>
    case 'player_blocked':      return <>Geblockt! Nur <span className="text-blue-400">{entry.dmg}</span> Schaden</>
    case 'player_dodged':       return <span className="text-green-400">Perfekt ausgewichen!</span>
    case 'player_grazed':       return <>Treffer! Ausweichen half wenig – <span className="text-yellow-500">{entry.dmg}</span> Schaden</>
    case 'enemy_attack':        return <>Gegner trifft dich für <span className="text-red-400">{entry.dmg}</span></>
    case 'shield_counter':      return <><span className="text-cyan-400">🛡 SCHILDBLOCK!</span> Nur <span className="text-blue-400">{entry.dmg}</span> Schaden</>
    case 'shield_counter_dmg':  return <><span className="text-cyan-300">⚡ Konter!</span> Gegner nimmt <span className="text-cyan-400">{entry.dmg}</span> Schaden</>
    case 'status_apply':
      return entry.effect === 'poison'
        ? <span className="text-green-600">☠ Vergiftet! ({entry.target === 'player' ? 'du' : 'Gegner'})</span>
        : null
    case 'status_tick':
      if (entry.effect === 'poison') return <><span className="text-green-500">☠ Gift</span> – <span className="text-red-400">-{entry.dmg} HP</span></>
      if (entry.effect === 'burn')   return <><span className="text-orange-500">🔥 Brand</span> trifft Gegner – <span className="text-orange-400">-{entry.dmg}</span></>
      return null
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

// ─── Boss Intro Screen ────────────────────────────────────────────────────────

function BossIntroScreen({ state, onFight }) {
  const { combat, isMidBoss } = state
  const monster = combat?.monster

  useEffect(() => { isMidBoss ? sfx.midBoss() : sfx.bossIntro() }, []) // eslint-disable-line

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 bg-dungeon safe-top safe-bottom overflow-hidden">
      {/* Dark vignette backdrop */}
      <motion.div
        className="absolute inset-0 bg-red-950/30 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* Boss icon */}
      <motion.div
        initial={{ scale: 0.2, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.3 }}
        className="text-8xl"
      >
        {isMidBoss ? '👑' : '🔥'}
      </motion.div>

      {/* Warning flash */}
      <motion.div
        className={`pixel text-xs tracking-widest ${isMidBoss ? 'text-yellow-500' : 'text-red-500'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0, 1, 0, 1] }}
        transition={{ delay: 0.6, duration: 1.2 }}
      >
        {isMidBoss ? '⚔ ZWISCHEN-BOSS ⚔' : '⚠ BOSS ENCOUNTER ⚠'}
      </motion.div>

      {/* Boss name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="text-center"
      >
        <div className="pixel text-gold text-lg leading-tight">{monster?.name}</div>
        <div className="text-gray-500 text-xs mt-2">
          HP: {monster?.hp} · ATK: {monster?.atk} · DEF: {monster?.def}
        </div>
      </motion.div>

      {/* Ominous flavour text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="text-gray-600 text-xs text-center max-w-xs leading-relaxed"
      >
        {isMidBoss ? 'Ein mächtiger Wächter versperrt dir den Weg. Bereit dich vor.' : 'Ein uraltes Böses erwacht. Der Boden bebt. Bereite dich auf den Kampf deines Lebens vor.'}
      </motion.p>

      {/* Fight button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.8, type: 'spring' }}
        whileTap={{ scale: 0.96 }}
        onClick={onFight}
        className={`w-full max-w-xs py-5 pixel text-sm border-2 ${isMidBoss ? 'border-yellow-700 bg-yellow-950 text-yellow-200' : 'border-red-600 bg-red-950 text-red-200'} active:bg-red-900`}
      >
        KÄMPFEN →
      </motion.button>
    </div>
  )
}

// ─── Event Screen ─────────────────────────────────────────────────────────────

function EventScreen({ state, onNext }) {
  const { currentEvent, player } = state
  useEffect(() => { sfx.event() }, [])

  const isPositive = currentEvent?.reward && !currentEvent.reward.startsWith('-')

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 bg-dungeon safe-top safe-bottom">
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        className="text-7xl"
      >
        {currentEvent?.icon}
      </motion.div>

      <div className="pixel text-purple-300 text-sm">{currentEvent?.title}</div>

      <p className="text-gray-400 text-sm text-center max-w-xs leading-relaxed">
        {currentEvent?.text}
      </p>

      {/* Reward badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`flex items-center gap-3 border-2 px-6 py-4 ${
          isPositive
            ? 'border-green-800 bg-green-950/50'
            : 'border-red-900 bg-red-950/50'
        }`}
      >
        <span className="text-2xl">{isPositive ? '✨' : '💀'}</span>
        <span className={`pixel text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {currentEvent?.reward}
        </span>
      </motion.div>

      {/* HP bar after event */}
      <div className="w-full max-w-xs">
        <HpBar hp={player.hp} maxHp={player.maxHp} />
      </div>

      <button
        onClick={onNext}
        className="w-full max-w-xs py-4 pixel text-sm border-2 border-purple-700 bg-purple-950 text-purple-200 active:scale-95"
      >
        WEITER →
      </button>
    </div>
  )
}

// ─── Trap Screen ──────────────────────────────────────────────────────────────

function TrapScreen({ state, onNext }) {
  const { currentTrap, trapDmg, player } = state
  useEffect(() => { sfx.trap() }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 bg-dungeon safe-top safe-bottom">
      {/* Screen flash */}
      <motion.div
        className="fixed inset-0 bg-orange-900 pointer-events-none"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      />

      <motion.div
        initial={{ scale: 0.4, opacity: 0, rotate: 15 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 12 }}
        className="text-7xl"
      >
        {currentTrap?.icon}
      </motion.div>

      <div className="pixel text-orange-400 text-sm">FALLE!</div>
      <div className="pixel text-white text-xs">{currentTrap?.title}</div>

      <p className="text-gray-400 text-sm text-center max-w-xs leading-relaxed">
        {currentTrap?.text}
      </p>

      {/* Damage badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="flex items-center gap-3 border-2 border-red-900 bg-red-950/50 px-6 py-4"
      >
        <span className="text-2xl">💔</span>
        <span className="pixel text-xs text-red-400">-{trapDmg} HP</span>
      </motion.div>

      {/* HP bar after trap */}
      <div className="w-full max-w-xs">
        <HpBar hp={player.hp} maxHp={player.maxHp} />
      </div>

      <button
        onClick={onNext}
        className="w-full max-w-xs py-4 pixel text-sm border-2 border-orange-800 bg-orange-950 text-orange-200 active:scale-95"
      >
        WEITER →
      </button>
    </div>
  )
}

// ─── Run End (Game Over + Victory) ───────────────────────────────────────────

function RunEnd({ state, won, isDaily, newAchievements = [], prestigePointsEarned = 0, elapsedSec = 0, onRetry, onLeaderboard, onPrestige, onMenu }) {
  const { player, dungeon } = state
  const profile = JSON.parse(localStorage.getItem('dungeontap_profile') || 'null')

  const [name, setName]             = useState(profile?.name || '')
  const [submitted, setSubmitted]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore]           = useState(null)
  const [pinError, setPinError]     = useState(null)
  const [shareMsg, setShareMsg]     = useState(null)

  async function shareRun() {
    const url = `${window.location.origin}/game?mode=custom&seed=${dungeon.seed}&class=${player.class}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'DungeonTap – Mein Run', text: `Etage ${player.floor} · LV${player.level} · ${player.kills} Kills`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareMsg('Link kopiert!')
        setTimeout(() => setShareMsg(null), 2500)
      }
    } catch {}
  }

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
    <div className="flex flex-col items-center h-full gap-5 px-6 py-8 bg-dungeon safe-top safe-bottom overflow-y-auto">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className={`pixel text-sm ${won ? 'text-gold-light' : 'text-red-500'}`}
      >
        {won ? '🏅 DUNGEON BEZWUNGEN!' : '💀 TOD'}
      </motion.div>

      {/* Challenge banner */}
      {state.challenge && (
        <div className="pixel text-xs text-red-400 border border-red-900 px-3 py-1 w-full max-w-xs text-center" style={{ fontSize: '0.5rem' }}>
          {state.challenge.icon} {state.challenge.title.toUpperCase()} CHALLENGE
        </div>
      )}

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
          ...(state.challenge?.speedrun && elapsedSec > 0
            ? [{ icon: '⏱️', label: 'Zeit', value: `${Math.floor(elapsedSec/60)}:${String(elapsedSec%60).padStart(2,'0')}` }]
            : []),
        ].map(s => (
          <div key={s.label} className="border border-dungeon-border bg-dungeon-dark p-3 text-center">
            <div className="text-lg">{s.icon}</div>
            <div className="pixel text-gold text-sm mt-1">{s.value}</div>
            <div className="text-gray-600 text-xs">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {score != null && <div className="text-gold pixel text-xs">Score: {score}</div>}

      {/* Newly unlocked achievements */}
      {newAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-xs"
        >
          <div className="text-yellow-600 text-xs pixel mb-2" style={{ fontSize: '0.5rem' }}>
            NEUE ERRUNGENSCHAFTEN!
          </div>
          <div className="flex flex-col gap-1">
            {newAchievements.map(id => {
              const a = ACHIEVEMENTS.find(x => x.id === id)
              return a ? (
                <div key={id} className="flex items-center gap-3 border border-gold/40 bg-yellow-950/30 px-3 py-2">
                  <span className="text-xl">{a.icon}</span>
                  <div>
                    <div className="pixel text-gold-light" style={{ fontSize: '0.5rem' }}>{a.title}</div>
                    <div className="text-gray-500 text-xs" style={{ fontSize: '0.55rem' }}>{a.desc}</div>
                  </div>
                </div>
              ) : null
            })}
          </div>
        </motion.div>
      )}

      {/* Prestige points earned */}
      {prestigePointsEarned > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-between w-full max-w-xs border border-amber-900/60 bg-amber-950/20 px-4 py-2"
        >
          <span className="text-amber-400 text-xs">⭐ +{prestigePointsEarned} Prestige-Punkte</span>
          <button
            onClick={onPrestige}
            className="pixel text-xs text-amber-500 border border-amber-800 px-2 py-1 active:scale-95"
            style={{ fontSize: '0.48rem' }}
          >
            SHOP
          </button>
        </motion.div>
      )}

      {/* Run History */}
      {(() => {
        const history = loadRunHistory()
        if (history.length === 0) return null
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-xs"
          >
            <div className="text-gray-700 text-xs pixel mb-2">LETZTE RUNS</div>
            <div className="flex flex-col gap-1">
              {history.slice(0, 3).map((run, i) => (
                <div key={i} className="flex items-center gap-2 text-xs border border-dungeon-border bg-dungeon-dark px-3 py-2">
                  <span className={run.won ? 'text-gold' : 'text-gray-600'}>
                    {run.won ? '🏅' : '💀'}
                  </span>
                  <span className="text-gray-500 flex-1">
                    {run.class} · Etage {run.floor} · LV{run.level}
                  </span>
                  <span className="text-gray-700">{run.date}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )
      })()}

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
          {dungeon?.seed && (
            <button
              onClick={shareRun}
              className="py-3 pixel text-xs border border-dungeon-border text-gray-400 active:scale-95 relative"
            >
              {shareMsg ? (
                <motion.span
                  key="msg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-400"
                >
                  ✓ {shareMsg}
                </motion.span>
              ) : '🔗 RUN TEILEN'}
            </button>
          )}
          {onRetry && (
            <>
              <button onClick={onRetry} className="py-4 pixel text-xs border border-dungeon-border text-gray-400 active:scale-95">
                {isDaily ? 'NOCHMAL (HELD BLEIBT)' : 'NOCHMAL'}
              </button>
              {isDaily && !won && (
                <div className="text-purple-500 text-xs text-center leading-relaxed">
                  Dein LV{player.level}-Held bleibt bis Mitternacht.
                </div>
              )}
            </>
          )}
          {state.challenge?.permadeath && !won && (
            <div className="text-red-700 text-xs text-center leading-relaxed pixel" style={{ fontSize: '0.5rem' }}>
              ☠ PERMADEATH — kein Retry
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

// ─── Act Intro Screen ─────────────────────────────────────────────────────────

function ActIntroScreen({ act, onStart, onQuit }) {
  const [lineIdx, setLineIdx] = useState(0)

  useEffect(() => {
    if (lineIdx < (act?.intro?.length ?? 0) - 1) {
      const t = setTimeout(() => setLineIdx(i => i + 1), 1800)
      return () => clearTimeout(t)
    }
  }, [lineIdx, act])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8 bg-dungeon safe-top safe-bottom">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="text-7xl"
      >
        {act?.icon}
      </motion.div>

      <div className="text-center">
        <div className="pixel text-gray-600 text-xs tracking-widest mb-1">{act?.subtitle}</div>
        <div className="pixel text-gold text-base">{act?.title}</div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs min-h-[80px]">
        {act?.intro?.slice(0, lineIdx + 1).map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-gray-400 text-sm text-center leading-relaxed"
          >
            {line}
          </motion.p>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={onStart}
          whileTap={{ scale: 0.97 }}
          className="py-4 pixel text-sm border-2 border-gold bg-dungeon-gold text-dungeon-black"
        >
          BEGINNE →
        </motion.button>
        <button onClick={onQuit} className="text-gray-700 text-xs pixel py-2">
          HAUPTMENÜ
        </button>
      </div>
    </div>
  )
}

// ─── Junction Screen (Path Choice) ────────────────────────────────────────────

function JunctionScreen({ options, player, onChoose }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 bg-dungeon safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-3xl mb-2">🔀</div>
        <div className="pixel text-gold text-sm">WÄHLE DEINEN WEG</div>
        <div className="text-gray-600 text-xs mt-1">Deine Entscheidung ist endgültig.</div>
      </motion.div>

      <HpBar hp={player.hp} maxHp={player.maxHp} />

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {options.map((opt, i) => (
          <motion.button
            key={opt.roomType}
            initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.12 }}
            onClick={() => onChoose(opt.roomType)}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-4 border-2 border-dungeon-border bg-dungeon-dark px-4 py-5 text-left hover:border-gold active:bg-dungeon-gray transition-all"
          >
            <span className="text-3xl">{opt.icon}</span>
            <div className="flex-1">
              <div className="pixel text-xs text-gold-light">{opt.label}</div>
              <div className="text-gray-500 text-xs mt-1 leading-relaxed">{opt.desc}</div>
            </div>
            <span className="text-gray-600 text-lg">→</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ─── Act Victory Screen ───────────────────────────────────────────────────────

function ActVictoryScreen({ act, isLast, onNext, onMenu }) {
  useEffect(() => { sfx.victory() }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 bg-dungeon safe-top safe-bottom">
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 12 }}
        className="text-7xl"
      >
        {isLast ? '🏆' : '✅'}
      </motion.div>

      <div className="pixel text-gold text-sm text-center">{act?.subtitle} ABGESCHLOSSEN</div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-400 text-sm text-center max-w-xs leading-relaxed"
      >
        {act?.victoryText}
      </motion.p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {!isLast && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={onNext}
            whileTap={{ scale: 0.97 }}
            className="py-4 pixel text-sm border-2 border-gold bg-dungeon-gold text-dungeon-black"
          >
            NÄCHSTER AKT →
          </motion.button>
        )}
        <button onClick={onMenu} className="py-4 pixel text-xs border border-dungeon-border text-gray-500 active:scale-95">
          HAUPTMENÜ
        </button>
      </div>
    </div>
  )
}

// ─── Story Complete Screen ────────────────────────────────────────────────────

function StoryCompleteScreen({ player, onMenu, onLeaderboard }) {
  useEffect(() => {
    sfx.victory()
    setTimeout(() => sfx.victory(), 600)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6 bg-dungeon safe-top safe-bottom overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-yellow-950/20 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 10, delay: 0.2 }}
        className="text-8xl"
      >
        🏆
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <div className="pixel text-gold text-lg">GESCHICHTE ABGESCHLOSSEN</div>
        <div className="text-gray-500 text-xs mt-2 pixel">Der Drachenlord liegt besiegt</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="grid grid-cols-2 gap-3 w-full max-w-xs"
      >
        {[
          { icon: '🏰', label: 'Etage',  value: player.floor },
          { icon: '⚔️', label: 'Kills',  value: player.kills },
          { icon: '⭐', label: 'Level',  value: player.level },
          { icon: '💰', label: 'Gold',   value: player.gold  },
        ].map(s => (
          <div key={s.label} className="border border-dungeon-border bg-dungeon-dark p-3 text-center">
            <div className="text-lg">{s.icon}</div>
            <div className="pixel text-gold text-sm mt-1">{s.value}</div>
            <div className="text-gray-600 text-xs">{s.label}</div>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <button onClick={onLeaderboard} className="py-4 pixel text-xs border-2 border-gold text-gold active:scale-95">
          BESTENLISTE
        </button>
        <button onClick={onMenu} className="py-4 pixel text-xs border border-dungeon-border text-gray-400 active:scale-95">
          HAUPTMENÜ
        </button>
      </motion.div>
    </div>
  )
}

// ─── Branching Map Screen ─────────────────────────────────────────────────────

function BranchingMapScreen({ state, onChoose, onQuit }) {
  const { branchingMap, player } = state
  const { nodes, layers, totalLayers } = branchingMap
  const currentNode = branchingMap.currentNodeId ? nodes[branchingMap.currentNodeId] : null
  const visitedIds = branchingMap.visitedNodeIds ?? []

  // Which node IDs can be chosen next
  const availableIds = currentNode
    ? currentNode.next
    : layers[0]

  const scrollRef = useRef(null)
  const availableRowRef = useRef(null)

  // Scroll to show available choices when map opens / node changes
  useEffect(() => {
    availableRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [branchingMap.currentNodeId])

  // Map layout constants
  const WIDTH = 300
  const ROW_HEIGHT = 58
  const NODE = 42
  const HALF = NODE / 2
  const svgH = totalLayers * ROW_HEIGHT + 16

  // Node x-position within a layer
  function nodeX(layerIds, idx) {
    const n = layerIds.length
    if (n === 1) return WIDTH / 2
    if (n === 2) return (WIDTH / 3) * (idx + 1)
    return (WIDTH / 4) * (idx + 1)
  }

  // Pre-compute positions: y=0 = boss layer (displayed at top)
  const pos = {}
  layers.forEach((layerIds, layerIdx) => {
    const displayRow = totalLayers - 1 - layerIdx // boss at top
    const y = displayRow * ROW_HEIGHT + ROW_HEIGHT / 2
    layerIds.forEach((id, j) => {
      pos[id] = { x: nodeX(layerIds, j), y }
    })
  })

  // Next layer for scroll target
  const nextLayer = currentNode ? currentNode.layer + 1 : 0

  return (
    <div className="flex flex-col h-full safe-top safe-bottom bg-dungeon px-4 py-4">
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
        <div className="w-12" />
      </div>

      <HpBar hp={player.hp} maxHp={player.maxHp} />

      <div className="pixel text-xs text-center mt-2 mb-1 text-gold">
        {currentNode ? 'WÄHLE DEINEN WEG' : 'BETRETE DEN DUNGEON'}
      </div>

      {/* Scrollable map */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto flex justify-center py-2">
        <div style={{ position: 'relative', width: WIDTH, height: svgH, flexShrink: 0 }}>
          {/* Connection lines */}
          <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            width={WIDTH}
            height={svgH}
          >
            {Object.values(nodes).map(node =>
              node.next.map(nextId => {
                const a = pos[node.id], b = pos[nextId]
                if (!a || !b) return null
                const isPath = visitedIds.includes(node.id) && visitedIds.includes(nextId)
                const isNext = node.id === branchingMap.currentNodeId && availableIds.includes(nextId)
                return (
                  <line
                    key={`${node.id}-${nextId}`}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={isNext ? '#d97706' : isPath ? '#166534' : '#374151'}
                    strokeWidth={isNext || isPath ? 2 : 1}
                    strokeDasharray={isNext ? '5 3' : undefined}
                  />
                )
              })
            )}
          </svg>

          {/* Nodes */}
          {Object.values(nodes).map(node => {
            const p = pos[node.id]
            if (!p) return null
            const isAvail = availableIds.includes(node.id)
            const isVisited = visitedIds.includes(node.id)
            const isCurrent = node.id === branchingMap.currentNodeId
            const isNextLayerNode = node.layer === nextLayer
            const info = ROOM_TYPES[node.type]

            return (
              <div
                key={node.id}
                ref={isAvail && isNextLayerNode && node.id === availableIds[0] ? availableRowRef : null}
                style={{ position: 'absolute', left: p.x - HALF, top: p.y - HALF, width: NODE, height: NODE }}
                className={`flex items-center justify-center border-2 transition-all duration-200 select-none
                  ${isAvail  ? 'border-amber-500 bg-amber-950/60 cursor-pointer' : ''}
                  ${isCurrent ? 'border-purple-500 bg-purple-950/60' : ''}
                  ${isVisited && !isCurrent ? 'border-gray-800 bg-gray-950/40 opacity-30' : ''}
                  ${!isAvail && !isVisited && !isCurrent ? 'border-gray-700 bg-dungeon opacity-70' : ''}
                `}
                onClick={() => isAvail && onChoose(node.id)}
              >
                <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>
                  {info?.icon ?? '?'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Available choices strip — primary interaction on mobile */}
      {availableIds.length > 0 && (
        <div className="mt-2 pt-2 border-t border-dungeon-border">
          <div className="text-gray-600 pixel mb-2" style={{ fontSize: '0.48rem' }}>
            VERFÜGBARE PFADE
          </div>
          <div className="flex gap-2">
            {availableIds.map(id => {
              const node = nodes[id]
              const info = ROOM_TYPES[node?.type]
              return (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onChoose(id)}
                  className="flex-1 flex flex-col items-center gap-1.5 border-2 border-amber-700 bg-amber-950/30 py-3 active:bg-amber-950/60 transition-colors"
                >
                  <span className="text-2xl">{info?.icon ?? '?'}</span>
                  <span className="pixel text-amber-400" style={{ fontSize: '0.48rem' }}>
                    {info?.label ?? node?.type}
                  </span>
                </motion.button>
              )
            })}
          </div>
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
