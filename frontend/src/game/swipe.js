// Swipe gesture detection via Pointer Events
// Returns a cleanup function

const MIN_DISTANCE = 40  // px
const MAX_TIME = 500     // ms

export function attachSwipeListener(element, onSwipe) {
  let startX = 0
  let startY = 0
  let startTime = 0
  let active = false

  function onPointerDown(e) {
    startX = e.clientX
    startY = e.clientY
    startTime = Date.now()
    active = true
    element.setPointerCapture(e.pointerId)
  }

  function onPointerUp(e) {
    if (!active) return
    active = false

    const dx = e.clientX - startX
    const dy = e.clientY - startY
    const dt = Date.now() - startTime
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < MIN_DISTANCE || dt > MAX_TIME) return

    const angle = Math.atan2(-dy, dx) * (180 / Math.PI) // positive Y = down

    let direction
    if (angle >= 45 && angle < 135) {
      direction = 'up'
    } else if (angle >= -45 && angle < 45) {
      direction = 'right'
    } else if (angle >= -135 && angle < -45) {
      direction = 'down'
    } else {
      direction = 'left'
    }

    onSwipe(direction, { dx, dy, dist, dt })
  }

  function onPointerCancel() {
    active = false
  }

  element.addEventListener('pointerdown', onPointerDown)
  element.addEventListener('pointerup', onPointerUp)
  element.addEventListener('pointercancel', onPointerCancel)

  return () => {
    element.removeEventListener('pointerdown', onPointerDown)
    element.removeEventListener('pointerup', onPointerUp)
    element.removeEventListener('pointercancel', onPointerCancel)
  }
}
