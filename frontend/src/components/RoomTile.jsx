// Dungeon map room tile with SVG icon

const ICONS = {
  elite: (
    <svg viewBox="0 0 16 16" width="22" height="22" shapeRendering="crispEdges">
      {/* two crossed swords */}
      <rect x="4" y="3"  width="2" height="10" fill="#c0392b" transform="rotate(40 8 8)"/>
      <rect x="10" y="3" width="2" height="10" fill="#c0392b" transform="rotate(-40 8 8)"/>
      {/* red glow dots */}
      <rect x="7" y="3"  width="2" height="2" fill="#e74c3c"/>
      <rect x="7" y="11" width="2" height="2" fill="#e74c3c"/>
      <rect x="3" y="7"  width="2" height="2" fill="#e74c3c"/>
      <rect x="11" y="7" width="2" height="2" fill="#e74c3c"/>
    </svg>
  ),
  event: (
    <svg viewBox="0 0 16 16" width="22" height="22" shapeRendering="crispEdges">
      {/* question mark */}
      <rect x="6"  y="2"  width="4" height="2" fill="#8e44ad"/>
      <rect x="10" y="4"  width="2" height="2" fill="#8e44ad"/>
      <rect x="8"  y="6"  width="2" height="2" fill="#8e44ad"/>
      <rect x="7"  y="8"  width="2" height="3" fill="#8e44ad"/>
      <rect x="7"  y="12" width="2" height="2" fill="#8e44ad"/>
      {/* sparkles */}
      <rect x="2"  y="3"  width="1" height="1" fill="#c39bd3"/>
      <rect x="13" y="5"  width="1" height="1" fill="#c39bd3"/>
      <rect x="12" y="12" width="1" height="1" fill="#c39bd3"/>
    </svg>
  ),
  trap: (
    <svg viewBox="0 0 16 16" width="22" height="22" shapeRendering="crispEdges">
      {/* warning triangle */}
      <rect x="7"  y="2"  width="2" height="2" fill="#e67e22"/>
      <rect x="6"  y="4"  width="4" height="2" fill="#e67e22"/>
      <rect x="5"  y="6"  width="6" height="2" fill="#e67e22"/>
      <rect x="4"  y="8"  width="8" height="2" fill="#e67e22"/>
      <rect x="3"  y="10" width="10" height="2" fill="#e67e22"/>
      {/* exclamation inside */}
      <rect x="7"  y="5"  width="2" height="4" fill="#0a0a0f"/>
      <rect x="7"  y="10" width="2" height="2" fill="#0a0a0f"/>
      {/* spikes bottom */}
      <rect x="4"  y="13" width="2" height="2" fill="#e67e22"/>
      <rect x="7"  y="13" width="2" height="2" fill="#e67e22"/>
      <rect x="10" y="13" width="2" height="2" fill="#e67e22"/>
    </svg>
  ),
  combat: (
    <svg viewBox="0 0 16 16" width="22" height="22" shapeRendering="crispEdges">
      {/* sword */}
      <rect x="7" y="2" width="2" height="9" fill="#c9a227"/>
      <rect x="4" y="6" width="8" height="2" fill="#c9a227"/>
      <rect x="7" y="11" width="2" height="3" fill="#8b6914"/>
      <rect x="6" y="13" width="4" height="1" fill="#6e4f0a"/>
      {/* shine */}
      <rect x="8" y="2" width="1" height="3" fill="#f0c040"/>
    </svg>
  ),
  rest: (
    <svg viewBox="0 0 16 16" width="22" height="22" shapeRendering="crispEdges">
      {/* flame */}
      <rect x="7" y="12" width="2" height="2" fill="#e67e22"/>
      <rect x="6" y="9"  width="4" height="4" fill="#e67e22"/>
      <rect x="7" y="7"  width="2" height="3" fill="#f0c040"/>
      <rect x="5" y="8"  width="2" height="4" fill="#c0392b"/>
      <rect x="9" y="8"  width="2" height="4" fill="#c0392b"/>
      <rect x="6" y="6"  width="1" height="2" fill="#f0c040"/>
      <rect x="9" y="6"  width="1" height="2" fill="#f0c040"/>
      <rect x="7" y="5"  width="2" height="2" fill="#f5f5f5"/>
      {/* log */}
      <rect x="4" y="13" width="8" height="2" fill="#6e3b1e"/>
      <rect x="5" y="13" width="2" height="1" fill="#8b4d26"/>
    </svg>
  ),
  treasure: (
    <svg viewBox="0 0 16 16" width="22" height="22" shapeRendering="crispEdges">
      {/* chest */}
      <rect x="3" y="8"  width="10" height="6" fill="#8b4513"/>
      <rect x="3" y="6"  width="10" height="3" fill="#a0522d"/>
      <rect x="3" y="8"  width="10" height="1" fill="#4a2208"/>
      {/* lid detail */}
      <rect x="4" y="7"  width="8" height="1" fill="#cd853f"/>
      {/* lock */}
      <rect x="7" y="9"  width="2" height="2" fill="#c9a227"/>
      <rect x="7" y="8"  width="2" height="1" fill="#c9a227"/>
      {/* coins spilling */}
      <rect x="6" y="5"  width="2" height="2" fill="#c9a227"/>
      <rect x="9" y="4"  width="2" height="2" fill="#c9a227"/>
      <rect x="4" y="5"  width="1" height="1" fill="#f0c040"/>
    </svg>
  ),
  shop: (
    <svg viewBox="0 0 16 16" width="22" height="22" shapeRendering="crispEdges">
      {/* stall roof */}
      <rect x="2" y="4"  width="12" height="2" fill="#c0392b"/>
      <rect x="1" y="5"  width="14" height="1" fill="#e74c3c"/>
      {/* awning stripes */}
      <rect x="3" y="4"  width="2" height="2" fill="#e74c3c"/>
      <rect x="7" y="4"  width="2" height="2" fill="#e74c3c"/>
      <rect x="11" y="4" width="2" height="2" fill="#e74c3c"/>
      {/* counter */}
      <rect x="3" y="7"  width="10" height="5" fill="#8b4513"/>
      <rect x="3" y="7"  width="10" height="1" fill="#cd853f"/>
      {/* potion on counter */}
      <rect x="6" y="8"  width="2" height="3" fill="#8e44ad"/>
      <rect x="6" y="7"  width="2" height="1" fill="#c39bd3"/>
      {/* coin */}
      <rect x="9" y="9"  width="2" height="2" fill="#c9a227"/>
    </svg>
  ),
  boss: (
    <svg viewBox="0 0 16 16" width="22" height="22" shapeRendering="crispEdges">
      {/* skull */}
      <rect x="4" y="4"  width="8" height="6" fill="#e8dcc8"/>
      <rect x="3" y="5"  width="1" height="4" fill="#e8dcc8"/>
      <rect x="12" y="5" width="1" height="4" fill="#e8dcc8"/>
      {/* eyes */}
      <rect x="5" y="6"  width="2" height="2" fill="#c0392b"/>
      <rect x="9" y="6"  width="2" height="2" fill="#c0392b"/>
      {/* nose */}
      <rect x="8" y="8"  width="1" height="1" fill="#c0b090"/>
      {/* teeth */}
      <rect x="5" y="10" width="1" height="2" fill="#ffffff"/>
      <rect x="7" y="10" width="1" height="2" fill="#ffffff"/>
      <rect x="9" y="10" width="1" height="2" fill="#ffffff"/>
      <rect x="11" y="10"width="1" height="2" fill="#ffffff"/>
      {/* crown */}
      <rect x="4" y="2"  width="2" height="3" fill="#c9a227"/>
      <rect x="7" y="1"  width="2" height="4" fill="#c9a227"/>
      <rect x="10" y="2" width="2" height="3" fill="#c9a227"/>
      <rect x="5" y="2"  width="6" height="2" fill="#c9a227"/>
      {/* gems */}
      <rect x="8" y="1"  width="1" height="1" fill="#c0392b"/>
    </svg>
  ),
}

// Per-type accent colours for the tile border
const TYPE_BORDER = {
  boss:  'border-red-700',
  elite: 'border-red-900',
  trap:  'border-orange-900',
  event: 'border-purple-900',
}

export default function RoomTile({ room, isCurrent, isPast }) {
  const icon = ICONS[room.type] ?? ICONS.combat
  const accentBorder = TYPE_BORDER[room.type] ?? 'border-dungeon-border'

  return (
    <div
      className={`
        flex items-center justify-center w-12 h-12 border-2 transition-all duration-200
        ${isCurrent  ? 'border-yellow-400 bg-dungeon-gray shadow-lg shadow-yellow-900/40 scale-110' : ''}
        ${isPast     ? 'border-dungeon-border bg-dungeon opacity-40' : ''}
        ${!isCurrent && !isPast ? `${accentBorder} bg-dungeon-dark` : ''}
      `}
      style={isCurrent ? { boxShadow: '0 0 12px 2px rgba(201,162,39,0.3)' } : undefined}
    >
      {isPast
        ? <span className="text-green-600 text-lg">✓</span>
        : icon
      }
    </div>
  )
}
