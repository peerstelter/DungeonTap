// Story mode: 3 acts, each with segments (fixed rooms or junctions)
// A "junction" shows 2 path options; player picks one before proceeding.

export const STORY = {
  acts: [
    {
      id: 1,
      title: 'Die Höhlen',
      subtitle: 'Akt I',
      icon: '🪨',
      startFloor: 1,
      intro: [
        'Eine alte Legende berichtet von Monstern tief im Berg.',
        'Die umliegenden Dörfer leben in Angst.',
        'Du wirst ausgesandt, ihrem Treiben ein Ende zu setzen.',
      ],
      segments: [
        { type: 'fixed',    room: { type: 'combat',   label: 'Eingangshöhle' } },
        { type: 'junction', options: [
          { roomType: 'rest',     icon: '🔥', label: 'Alte Lagerstelle',    desc: 'Raste und heile 30% HP' },
          { roomType: 'treasure', icon: '💰', label: 'Verborgene Kammer',   desc: 'Schatz aus vergangenen Zeiten' },
        ]},
        { type: 'fixed',    room: { type: 'elite',    label: 'Wachkammer' } },
        { type: 'junction', options: [
          { roomType: 'shop',  icon: '🏪', label: 'Händlerversteck', desc: 'Kaufe Ausrüstung und Tränke' },
          { roomType: 'event', icon: '❓', label: 'Alte Inschrift',  desc: 'Rätselhafter Segen wartet' },
        ]},
        { type: 'fixed',    room: { type: 'mid_boss', bossId: 'cave_troll', label: 'Trollkammer' } },
      ],
      victoryText: 'Der Höhlentroll liegt besiegt. Der Weg in die Gruft ist frei.',
    },
    {
      id: 2,
      title: 'Die Gruft',
      subtitle: 'Akt II',
      icon: '🏚',
      startFloor: 6,
      intro: [
        'Hinter dem gefallenen Troll öffnet sich eine uralte Gruft.',
        'Kalte Luft. Der Geruch von Tod und Magie.',
        'Unruhige Seelen wachen über die Gräber der Alten.',
      ],
      segments: [
        { type: 'fixed',    room: { type: 'combat',   label: 'Grabkammer' } },
        { type: 'junction', options: [
          { roomType: 'combat', icon: '⚔️', label: 'Katakomben',       desc: 'Dunkle Gänge, mehr XP' },
          { roomType: 'trap',   icon: '⚠️', label: 'Verfluchter Pfad', desc: 'Riskant, aber schnell' },
        ]},
        { type: 'fixed',    room: { type: 'rest',     label: 'Heilige Flamme' } },
        { type: 'junction', options: [
          { roomType: 'elite',    icon: '💢', label: 'Grabwächter', desc: 'Elitekampf, hohe Belohnung' },
          { roomType: 'treasure', icon: '💰', label: 'Königsgrab',  desc: 'Gold der alten Könige' },
        ]},
        { type: 'fixed',    room: { type: 'mid_boss', bossId: 'crypt_lord', label: 'Thronsaal der Toten' } },
      ],
      victoryText: 'Der Gruftherr ist gefallen. Eine Treppe führt tiefer... ins Feuer.',
    },
    {
      id: 3,
      title: 'Das Herz des Feuers',
      subtitle: 'Akt III',
      icon: '🔥',
      startFloor: 11,
      intro: [
        'Tief unter der Erde. Das Herz des Berges.',
        'Die Wände glühen vor Hitze. Überall Drachenschuppen.',
        'Hier lebt er. Der DRACHENLORD.',
      ],
      segments: [
        { type: 'fixed',    room: { type: 'combat',   label: 'Lavahöhle' } },
        { type: 'junction', options: [
          { roomType: 'shop',  icon: '🏪', label: 'Ruinen-Händler', desc: 'Letzter Halt vor dem Boss' },
          { roomType: 'event', icon: '🐉', label: 'Drachenrelikt',  desc: 'Alte Magie der Drachen' },
        ]},
        { type: 'fixed',    room: { type: 'elite',    label: 'Wächter des Drachen' } },
        { type: 'junction', options: [
          { roomType: 'rest',     icon: '🔥', label: 'Letzte Rast',   desc: 'Sammle Kräfte vor dem Kampf' },
          { roomType: 'treasure', icon: '💰', label: 'Drachenschatz', desc: 'Gold vor dem finalen Kampf' },
        ]},
        { type: 'fixed',    room: { type: 'boss', isFinalBoss: true, label: 'Kammer des Drachen' } },
      ],
      victoryText: '🏆 DRACHENLORD BESIEGT! Die Dunkelheit ist gebannt. Du bist der Held!',
    },
  ]
}

// Save/load story progress
const STORY_PROGRESS_KEY = 'dungeontap_story_progress'

export function loadStoryProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORY_PROGRESS_KEY) || 'null') ?? { highestAct: 0, completed: false }
  } catch { return { highestAct: 0, completed: false } }
}

export function saveStoryProgress(act, completed = false) {
  try {
    const current = loadStoryProgress()
    const updated = {
      highestAct: Math.max(current.highestAct, act),
      completed: current.completed || completed,
    }
    localStorage.setItem(STORY_PROGRESS_KEY, JSON.stringify(updated))
  } catch {}
}
