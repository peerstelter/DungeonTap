// Pixel-art monster sprites — 16×16 grid, each cell = 1 unit
// Rendered as SVG rects for crisp pixel look at any size

const C = {
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

// Each sprite is a list of [x, y, w, h, color] rects on a 16×16 grid
const SPRITES = {
  goblin: [
    // body
    [5,8,6,5, C.green],
    // head
    [5,3,6,5, C.green],
    // ears
    [3,4,2,2, C.green], [11,4,2,2, C.green],
    // ear tips
    [3,3,1,1, C.dkgreen], [12,3,1,1, C.dkgreen],
    // eyes
    [6,5,2,2, C.red], [10,5,2,2, C.red],
    // pupils
    [7,5,1,1, C.dkred], [11,5,1,1, C.dkred],
    // nose
    [8,7,1,1, C.dkgreen],
    // mouth
    [6,8,1,1, C.white], [9,8,1,1, C.white],
    // arms
    [3,9,2,3, C.green], [11,9,2,3, C.green],
    // claws
    [3,12,1,1, C.yellow], [4,12,1,1, C.yellow],
    [11,12,1,1, C.yellow],[12,12,1,1, C.yellow],
    // legs
    [6,13,2,3, C.dkgreen], [9,13,2,3, C.dkgreen],
    // feet
    [5,15,2,1, C.dkgreen],[9,15,2,1, C.dkgreen],
    // loincloth
    [6,11,4,2, C.brown],
  ],

  skeleton: [
    // skull
    [5,2,6,5, C.bone],
    [4,3,1,3, C.bone], [11,3,1,3, C.bone],
    // eye sockets
    [5,4,2,2, C.black], [9,4,2,2, C.black],
    // eye glow
    [6,4,1,1, C.ltgray],[10,4,1,1, C.ltgray],
    // nose cavity
    [8,6,1,1, C.black],
    // teeth
    [6,7,1,1, C.white],[8,7,1,1, C.white],[10,7,1,1, C.white],
    // spine
    [8,8,1,5, C.bone],
    // ribcage
    [5,9,3,1, C.bone],[9,9,3,1, C.bone],
    [5,11,3,1, C.bone],[9,11,3,1, C.bone],
    // pelvis
    [5,13,6,2, C.bone],
    // arms
    [3,8,2,5, C.bone],[11,8,2,5, C.bone],
    // hands
    [3,13,1,1, C.bone],[4,13,1,1, C.bone],
    [11,13,1,1, C.bone],[12,13,1,1, C.bone],
    // legs
    [6,15,2,1, C.bone],[9,15,2,1, C.bone],
  ],

  orc: [
    // massive body
    [4,8,8,6, C.green],
    // head
    [5,3,6,5, C.green],
    // brow ridge
    [4,3,8,1, C.dkgreen],
    // eyes
    [5,5,2,1, C.red],[9,5,2,1, C.red],
    // tusks
    [6,8,1,2, C.bone],[10,8,1,2, C.bone],
    // nose
    [7,7,2,1, C.dkgreen],
    // arms (thick)
    [2,9,3,4, C.green],[11,9,3,4, C.green],
    // weapon hand
    [12,12,2,1, C.gray],
    [13,10,1,3, C.gray],
    // legs
    [5,14,3,2, C.dkgreen],[8,14,3,2, C.dkgreen],
    // feet
    [4,15,3,1, C.dkgreen],[9,15,3,1, C.dkgreen],
    // armor plate
    [5,9,6,4, C.gray],
    [6,9,4,1, C.ltgray],
    // belt
    [4,12,8,1, C.brown],
  ],

  slime: [
    // body blob
    [4,8,8,5, C.teal],
    [3,9,1,3, C.teal],[12,9,1,3, C.teal],
    [4,13,8,2, C.teal],
    [3,12,1,1, C.teal],[12,12,1,1, C.teal],
    // shine
    [5,9,2,2, C.white], [5,9,1,1, '#e0fffc'],
    // top drip
    [7,6,2,3, C.teal],[8,5,1,2, C.teal],
    // eyes
    [6,10,2,2, C.black],[9,10,2,2, C.black],
    [6,10,1,1, C.white],[9,10,1,1, C.white],
    // mouth
    [7,12,3,1, C.dkgreen],
    [7,12,1,1, C.black],[9,12,1,1, C.black],
    // drips on floor
    [5,15,1,1, C.teal],[8,15,2,1, C.teal],[11,15,1,1, C.teal],
  ],

  rat: [
    // body
    [4,9,7,4, C.brown],
    // head (pointy snout)
    [8,7,5,4, C.brown],
    [11,8,3,2, C.ltgray],
    // ears
    [5,6,2,3, C.brown],[4,6,1,2, C.dkred],
    [8,6,2,3, C.brown],[9,6,1,2, C.dkred],
    // eye
    [10,8,1,1, C.black],[10,8,1,1, C.red],
    // nose
    [13,9,1,1, C.dkred],
    // whiskers
    [11,9,3,1, C.ltgray],[11,10,2,1, C.ltgray],
    // legs
    [5,13,2,2, C.brown],[8,13,2,2, C.brown],
    // feet
    [4,14,3,1, C.brown],[8,14,3,1, C.brown],
    // tail
    [2,11,3,1, C.brown],[1,12,2,1, C.ltgray],[1,13,1,1, C.ltgray],
  ],

  dark_elf: [
    // body
    [5,8,6,6, '#2d1b4e'],
    // head
    [5,3,6,5, '#c8a882'],
    // long pointed ear
    [3,4,2,3, '#c8a882'],[2,4,1,4, '#c8a882'],
    [13,4,2,3, '#c8a882'],[14,4,1,4, '#c8a882'],
    // hair (dark purple)
    [5,3,6,2, '#4a1a7a'],[4,3,2,3, '#4a1a7a'],[11,3,2,3, '#4a1a7a'],
    // eyes (glowing violet)
    [6,5,2,1, C.purple],[9,5,2,1, C.purple],
    [6,5,1,1, C.ltpur],[9,5,1,1, C.ltpur],
    // armor
    [5,8,6,4, '#1a0a2e'],
    [6,8,4,1, C.purple],
    [5,10,1,2, C.purple],[10,10,1,2, C.purple],
    // cloak
    [3,9,2,5, '#2d1b4e'],[11,9,2,5, '#2d1b4e'],
    // legs
    [6,14,2,2, '#2d1b4e'],[9,14,2,2, '#2d1b4e'],
    // boots
    [5,15,3,1, '#1a0a2e'],[9,15,3,1, '#1a0a2e'],
    // blade
    [12,7,1,5, C.ltgray],[12,6,1,2, C.white],[13,8,1,1, C.ltgray],
  ],

  stone_golem: [
    // massive body
    [3,7,10,7, C.gray],
    // head (large cube)
    [4,3,8,5, C.gray],
    // cracks
    [6,4,1,3, C.dkgray],[10,5,1,2, C.dkgray],
    [5,8,1,2, C.dkgray],[9,9,3,1, C.dkgray],
    // eyes (glowing orange)
    [5,5,3,2, C.black],[5,5,2,1, C.orange],
    [9,5,3,2, C.black],[9,5,2,1, C.orange],
    // mouth
    [6,7,5,1, C.dkgray],
    [7,7,1,1, C.black],[9,7,1,1, C.black],
    // arms (thick)
    [1,8,3,5, C.gray],[12,8,3,5, C.gray],
    [1,12,3,1, C.ltgray],[12,12,3,1, C.ltgray],
    // fists
    [0,9,2,3, C.ltgray],[14,9,2,3, C.ltgray],
    // legs
    [4,14,4,2, C.gray],[9,14,4,2, C.gray],
    // stone detail
    [4,7,10,1, C.ltgray],[3,8,1,3, C.ltgray],
  ],

  vampire: [
    // cape (dark red)
    [3,8,10,7, '#5a0a14'],
    [3,8,1,6, '#3a0008'],[12,8,1,6, '#3a0008'],
    // body
    [5,9,6,5, '#1a0508'],
    // white shirt
    [6,10,4,3, C.white],
    // head
    [5,3,6,5, '#c8b4b4'],
    // widow's peak hair
    [5,3,6,2, '#1a0508'],
    [7,2,2,2, '#1a0508'],[8,2,1,3, '#1a0508'],
    // eyes (red glow)
    [6,5,2,2, C.black],[6,5,1,1, C.red],
    [9,5,2,2, C.black],[9,5,1,1, C.red],
    // fangs
    [7,8,1,2, C.white],[9,8,1,2, C.white],
    // hands (clawed)
    [3,10,2,3, '#c8b4b4'],[11,10,2,3, '#c8b4b4'],
    [2,12,2,1, C.white],[12,12,2,1, C.white],
    // legs/boots
    [6,14,2,2, '#1a0508'],[9,14,2,2, '#1a0508'],
    [5,15,3,1, '#1a0508'],[9,15,3,1, '#1a0508'],
    // collar
    [5,8,6,1, '#5a0a14'],
    [6,8,1,1, C.white],[10,8,1,1, C.white],
  ],

  boss_dragon: [
    // body (dark red, massive)
    [4,7,9,6, C.dkred],
    // neck
    [7,5,4,3, C.dkred],
    // head (wide, imposing)
    [5,2,7,4, C.dkred],
    // snout
    [9,4,4,2, C.red],
    // crown / horns
    [5,1,1,2, C.gold],[7,0,1,3, C.gold],[9,0,1,3, C.gold],[11,1,1,2, C.gold],
    // eyes (glowing gold)
    [6,3,2,2, C.black],[6,3,2,1, C.yellow],
    [10,3,2,2, C.black],[10,3,2,1, C.yellow],
    // nostril
    [11,5,1,1, C.black],[12,5,1,1, C.black],
    // fangs
    [8,6,1,2, C.bone],[10,6,1,2, C.bone],
    // wings (huge, dark)
    [0,7,5,5, C.dkred],[0,7,1,6, C.red],[1,6,2,1, C.dkred],
    [12,7,5,5, C.dkred],[15,7,1,6, C.red],[13,6,2,1, C.dkred],
    // wing membrane
    [1,8,3,4, '#7a1a10'],[13,8,3,4, '#7a1a10'],
    // belly (orange-gold scales)
    [5,9,7,4, C.orange],
    [6,9,1,1, C.yellow],[8,9,1,1, C.yellow],[10,9,1,1, C.yellow],
    [5,11,1,1, C.yellow],[7,11,1,1, C.yellow],[9,11,1,1, C.yellow],[11,11,1,1, C.yellow],
    // arms/claws
    [4,12,2,2, C.dkred],[11,12,2,2, C.dkred],
    [3,14,2,1, C.gold],[12,14,2,1, C.gold],
    // legs
    [5,13,3,2, C.dkred],[9,13,3,2, C.dkred],
    [4,15,4,1, C.gold],[9,15,4,1, C.gold],
    // tail
    [2,10,3,1, C.dkred],[1,11,2,1, C.dkred],[0,12,2,1, C.red],
  ],

  dragon_whelp: [
    // body
    [5,7,7,6, C.purple],
    // neck
    [8,5,3,3, C.purple],
    // head
    [7,2,5,4, C.purple],
    // snout
    [10,4,3,2, C.ltpur],
    // eye
    [8,3,2,2, C.yellow],[9,3,1,1, C.orange],
    // nostril
    [11,5,1,1, C.dkgray],
    // horn
    [8,1,1,2, C.gold],[9,0,1,2, C.gold],
    // wing left
    [2,7,4,4, C.ltpur],[2,7,1,5, C.purple],[3,6,2,1, C.ltpur],
    // wing right
    [11,7,4,4, C.ltpur],[14,7,1,5, C.purple],[12,6,2,1, C.ltpur],
    // membrane detail
    [3,8,2,3, '#b39dce'],[12,8,2,3, '#b39dce'],
    // arms/claws
    [5,12,2,2, C.purple],[10,12,2,2, C.purple],
    [4,14,2,1, C.gold],[11,14,2,1, C.gold],
    // legs
    [6,13,2,2, C.purple],[9,13,2,2, C.purple],
    [5,15,3,1, C.gold],[9,15,3,1, C.gold],
    // tail
    [3,10,3,1, C.purple],[2,11,2,1, C.purple],[1,12,2,1, C.ltpur],
    // belly scales
    [6,9,5,3, C.ltpur],
    [7,9,1,1, C.purple],[9,9,1,1, C.purple],
    [6,11,1,1, C.purple],[10,11,1,1, C.purple],
  ],
}

export default function MonsterSprite({ id, size = 96, flash = false }) {
  const rects = SPRITES[id] ?? SPRITES.goblin
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      style={{
        imageRendering: 'pixelated',
        filter: flash ? 'brightness(3) saturate(0)' : undefined,
        transition: 'filter 0.05s',
      }}
      shapeRendering="crispEdges"
    >
      {rects.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
    </svg>
  )
}
