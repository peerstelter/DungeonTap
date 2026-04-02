// Pixel-art monster sprites — 16×16 grid, each cell = 1 unit
// Rendered as SVG rects for crisp pixel look at any size
// Sprite data lives in spriteData.js (shared with AnimatedSprite.jsx)
import { getSpriteRects } from '../game/spriteData'

export default function MonsterSprite({ id, size = 96, flash = false }) {
  const rects = getSpriteRects(id)
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
