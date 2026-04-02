// Shared pixel-art sprite data — 16×16 grid, [x, y, w, h, color]
// Used by both MonsterSprite.jsx (SVG) and AnimatedSprite.jsx (Canvas)

export const C = {
  black:  '#0a0a0f',
  dkgray: '#1e1e2e',
  gray:   '#4a4a6a',
  ltgray: '#8888aa',
  white:  '#e5e5f5',
  red:    '#c0392b',
  dkred:  '#7a1a10',
  orange: '#e67e22',
  yellow: '#f0c040',
  green:  '#27ae60',
  dkgreen:'#145a32',
  blue:   '#2980b9',
  purple: '#8e44ad',
  ltpur:  '#c39bd3',
  bone:   '#f0e6c8',
  gold:   '#c9a227',
  teal:   '#1abc9c',
  brown:  '#6e3b1e',
}

export const SPRITES = {
  goblin: [
    [5,8,6,5, C.green],
    [5,3,6,5, C.green],
    [3,4,2,2, C.green], [11,4,2,2, C.green],
    [3,3,1,1, C.dkgreen], [12,3,1,1, C.dkgreen],
    [6,5,2,2, C.red], [10,5,2,2, C.red],
    [7,5,1,1, C.dkred], [11,5,1,1, C.dkred],
    [8,7,1,1, C.dkgreen],
    [6,8,1,1, C.white], [9,8,1,1, C.white],
    [3,9,2,3, C.green], [11,9,2,3, C.green],
    [3,12,1,1, C.yellow], [4,12,1,1, C.yellow],
    [11,12,1,1, C.yellow],[12,12,1,1, C.yellow],
    [6,13,2,3, C.dkgreen], [9,13,2,3, C.dkgreen],
    [5,15,2,1, C.dkgreen],[9,15,2,1, C.dkgreen],
    [6,11,4,2, C.brown],
  ],

  skeleton: [
    [5,2,6,5, C.bone],
    [4,3,1,3, C.bone], [11,3,1,3, C.bone],
    [5,4,2,2, C.black], [9,4,2,2, C.black],
    [6,4,1,1, C.ltgray],[10,4,1,1, C.ltgray],
    [8,6,1,1, C.black],
    [6,7,1,1, C.white],[8,7,1,1, C.white],[10,7,1,1, C.white],
    [8,8,1,5, C.bone],
    [5,9,3,1, C.bone],[9,9,3,1, C.bone],
    [5,11,3,1, C.bone],[9,11,3,1, C.bone],
    [5,13,6,2, C.bone],
    [3,8,2,5, C.bone],[11,8,2,5, C.bone],
    [3,13,1,1, C.bone],[4,13,1,1, C.bone],
    [11,13,1,1, C.bone],[12,13,1,1, C.bone],
    [6,15,2,1, C.bone],[9,15,2,1, C.bone],
  ],

  orc: [
    [4,8,8,6, C.green],
    [5,3,6,5, C.green],
    [4,3,8,1, C.dkgreen],
    [5,5,2,1, C.red],[9,5,2,1, C.red],
    [6,8,1,2, C.bone],[10,8,1,2, C.bone],
    [7,7,2,1, C.dkgreen],
    [2,9,3,4, C.green],[11,9,3,4, C.green],
    [12,12,2,1, C.gray],
    [13,10,1,3, C.gray],
    [5,14,3,2, C.dkgreen],[8,14,3,2, C.dkgreen],
    [4,15,3,1, C.dkgreen],[9,15,3,1, C.dkgreen],
    [5,9,6,4, C.gray],
    [6,9,4,1, C.ltgray],
    [4,12,8,1, C.brown],
  ],

  slime: [
    [4,8,8,5, C.teal],
    [3,9,1,3, C.teal],[12,9,1,3, C.teal],
    [4,13,8,2, C.teal],
    [3,12,1,1, C.teal],[12,12,1,1, C.teal],
    [5,9,2,2, C.white], [5,9,1,1, '#e0fffc'],
    [7,6,2,3, C.teal],[8,5,1,2, C.teal],
    [6,10,2,2, C.black],[9,10,2,2, C.black],
    [6,10,1,1, C.white],[9,10,1,1, C.white],
    [7,12,3,1, C.dkgreen],
    [7,12,1,1, C.black],[9,12,1,1, C.black],
    [5,15,1,1, C.teal],[8,15,2,1, C.teal],[11,15,1,1, C.teal],
  ],

  rat: [
    [4,9,7,4, C.brown],
    [8,7,5,4, C.brown],
    [11,8,3,2, C.ltgray],
    [5,6,2,3, C.brown],[4,6,1,2, C.dkred],
    [8,6,2,3, C.brown],[9,6,1,2, C.dkred],
    [10,8,1,1, C.black],[10,8,1,1, C.red],
    [13,9,1,1, C.dkred],
    [11,9,3,1, C.ltgray],[11,10,2,1, C.ltgray],
    [5,13,2,2, C.brown],[8,13,2,2, C.brown],
    [4,14,3,1, C.brown],[8,14,3,1, C.brown],
    [2,11,3,1, C.brown],[1,12,2,1, C.ltgray],[1,13,1,1, C.ltgray],
  ],

  dark_elf: [
    [5,8,6,6, '#2d1b4e'],
    [5,3,6,5, '#c8a882'],
    [3,4,2,3, '#c8a882'],[2,4,1,4, '#c8a882'],
    [13,4,2,3, '#c8a882'],[14,4,1,4, '#c8a882'],
    [5,3,6,2, '#4a1a7a'],[4,3,2,3, '#4a1a7a'],[11,3,2,3, '#4a1a7a'],
    [6,5,2,1, C.purple],[9,5,2,1, C.purple],
    [6,5,1,1, C.ltpur],[9,5,1,1, C.ltpur],
    [5,8,6,4, '#1a0a2e'],
    [6,8,4,1, C.purple],
    [5,10,1,2, C.purple],[10,10,1,2, C.purple],
    [3,9,2,5, '#2d1b4e'],[11,9,2,5, '#2d1b4e'],
    [6,14,2,2, '#2d1b4e'],[9,14,2,2, '#2d1b4e'],
    [5,15,3,1, '#1a0a2e'],[9,15,3,1, '#1a0a2e'],
    [12,7,1,5, C.ltgray],[12,6,1,2, C.white],[13,8,1,1, C.ltgray],
  ],

  stone_golem: [
    [3,7,10,7, C.gray],
    [4,3,8,5, C.gray],
    [6,4,1,3, C.dkgray],[10,5,1,2, C.dkgray],
    [5,8,1,2, C.dkgray],[9,9,3,1, C.dkgray],
    [5,5,3,2, C.black],[5,5,2,1, C.orange],
    [9,5,3,2, C.black],[9,5,2,1, C.orange],
    [6,7,5,1, C.dkgray],
    [7,7,1,1, C.black],[9,7,1,1, C.black],
    [1,8,3,5, C.gray],[12,8,3,5, C.gray],
    [1,12,3,1, C.ltgray],[12,12,3,1, C.ltgray],
    [0,9,2,3, C.ltgray],[14,9,2,3, C.ltgray],
    [4,14,4,2, C.gray],[9,14,4,2, C.gray],
    [4,7,10,1, C.ltgray],[3,8,1,3, C.ltgray],
  ],

  vampire: [
    [3,8,10,7, '#5a0a14'],
    [3,8,1,6, '#3a0008'],[12,8,1,6, '#3a0008'],
    [5,9,6,5, '#1a0508'],
    [6,10,4,3, C.white],
    [5,3,6,5, '#c8b4b4'],
    [5,3,6,2, '#1a0508'],
    [7,2,2,2, '#1a0508'],[8,2,1,3, '#1a0508'],
    [6,5,2,2, C.black],[6,5,1,1, C.red],
    [9,5,2,2, C.black],[9,5,1,1, C.red],
    [7,8,1,2, C.white],[9,8,1,2, C.white],
    [3,10,2,3, '#c8b4b4'],[11,10,2,3, '#c8b4b4'],
    [2,12,2,1, C.white],[12,12,2,1, C.white],
    [6,14,2,2, '#1a0508'],[9,14,2,2, '#1a0508'],
    [5,15,3,1, '#1a0508'],[9,15,3,1, '#1a0508'],
    [5,8,6,1, '#5a0a14'],
    [6,8,1,1, C.white],[10,8,1,1, C.white],
  ],

  boss_dragon: [
    [4,7,9,6, C.dkred],
    [7,5,4,3, C.dkred],
    [5,2,7,4, C.dkred],
    [9,4,4,2, C.red],
    [5,1,1,2, C.gold],[7,0,1,3, C.gold],[9,0,1,3, C.gold],[11,1,1,2, C.gold],
    [6,3,2,2, C.black],[6,3,2,1, C.yellow],
    [10,3,2,2, C.black],[10,3,2,1, C.yellow],
    [11,5,1,1, C.black],[12,5,1,1, C.black],
    [8,6,1,2, C.bone],[10,6,1,2, C.bone],
    [0,7,5,5, C.dkred],[0,7,1,6, C.red],[1,6,2,1, C.dkred],
    [12,7,5,5, C.dkred],[15,7,1,6, C.red],[13,6,2,1, C.dkred],
    [1,8,3,4, '#7a1a10'],[13,8,3,4, '#7a1a10'],
    [5,9,7,4, C.orange],
    [6,9,1,1, C.yellow],[8,9,1,1, C.yellow],[10,9,1,1, C.yellow],
    [5,11,1,1, C.yellow],[7,11,1,1, C.yellow],[9,11,1,1, C.yellow],[11,11,1,1, C.yellow],
    [4,12,2,2, C.dkred],[11,12,2,2, C.dkred],
    [3,14,2,1, C.gold],[12,14,2,1, C.gold],
    [5,13,3,2, C.dkred],[9,13,3,2, C.dkred],
    [4,15,4,1, C.gold],[9,15,4,1, C.gold],
    [2,10,3,1, C.dkred],[1,11,2,1, C.dkred],[0,12,2,1, C.red],
  ],

  dragon_whelp: [
    [5,7,7,6, C.purple],
    [8,5,3,3, C.purple],
    [7,2,5,4, C.purple],
    [10,4,3,2, C.ltpur],
    [8,3,2,2, C.yellow],[9,3,1,1, C.orange],
    [11,5,1,1, C.dkgray],
    [8,1,1,2, C.gold],[9,0,1,2, C.gold],
    [2,7,4,4, C.ltpur],[2,7,1,5, C.purple],[3,6,2,1, C.ltpur],
    [11,7,4,4, C.ltpur],[14,7,1,5, C.purple],[12,6,2,1, C.ltpur],
    [3,8,2,3, '#b39dce'],[12,8,2,3, '#b39dce'],
    [5,12,2,2, C.purple],[10,12,2,2, C.purple],
    [4,14,2,1, C.gold],[11,14,2,1, C.gold],
    [6,13,2,2, C.purple],[9,13,2,2, C.purple],
    [5,15,3,1, C.gold],[9,15,3,1, C.gold],
    [3,10,3,1, C.purple],[2,11,2,1, C.purple],[1,12,2,1, C.ltpur],
    [6,9,5,3, C.ltpur],
    [7,9,1,1, C.purple],[9,9,1,1, C.purple],
    [6,11,1,1, C.purple],[10,11,1,1, C.purple],
  ],

  // Mid-bosses and deep floor monsters fallback to nearest sprite
  wraith:         null, // falls back to vampire
  lich:           null, // falls back to skeleton
  demon:          null, // falls back to dark_elf
  cave_troll:     null, // falls back to orc
  crypt_lord:     null, // falls back to skeleton
  shadow_mage:    null, // falls back to dark_elf
  infernal_knight:null, // falls back to orc
}

// Resolve sprite data — follows null fallbacks
const FALLBACKS = {
  wraith: 'vampire', lich: 'skeleton', demon: 'dark_elf',
  cave_troll: 'orc', crypt_lord: 'skeleton', shadow_mage: 'dark_elf',
  infernal_knight: 'orc',
}

export function getSpriteRects(id) {
  if (SPRITES[id]) return SPRITES[id]
  const fb = FALLBACKS[id]
  return fb ? SPRITES[fb] : SPRITES.goblin
}
