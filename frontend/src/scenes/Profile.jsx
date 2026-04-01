import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// Debounced name availability check
function useNameCheck(name) {
  const [status, setStatus] = useState(null) // null | 'checking' | 'available' | 'taken' | 'yours'
  const timerRef = useRef(null)
  const existing = JSON.parse(localStorage.getItem('dungeontap_profile') || 'null')

  useEffect(() => {
    const trimmed = name.trim()
    if (trimmed.length < 2) { setStatus(null); return }

    // Same name as already registered profile — no need to check
    if (existing?.name === trimmed) { setStatus('yours'); return }

    setStatus('checking')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      fetch(`/api/users/check?name=${encodeURIComponent(trimmed)}`)
        .then(r => r.json())
        .then(data => {
          if (data.available) setStatus('available')
          else setStatus('taken')
        })
        .catch(() => setStatus(null)) // offline — skip check
    }, 400)

    return () => clearTimeout(timerRef.current)
  }, [name]) // eslint-disable-line

  return status
}

export default function Profile() {
  const navigate  = useNavigate()
  const [params]  = useSearchParams()
  const next      = params.get('next') || '/'

  const existing  = JSON.parse(localStorage.getItem('dungeontap_profile') || 'null')
  const [name, setName]       = useState(existing?.name || '')
  const [pin, setPin]         = useState('')
  const [error, setError]     = useState(null)
  const [saving, setSaving]   = useState(false)

  const nameStatus = useNameCheck(name)

  // Login (taken) is also allowed — PIN is verified server-side
  const canSave = name.trim().length >= 2
    && pin.length === 4
    && (nameStatus === 'available' || nameStatus === 'taken' || nameStatus === 'yours')
    && !saving

  async function save() {
    if (!canSave) return
    const trimName = name.trim()
    if (!/^\d{4}$/.test(pin)) return setError('PIN muss genau 4 Ziffern sein')

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimName, pin }),
      })
      const data = await res.json()

      if (data.error === 'name_taken') {
        // In login mode the name was already taken → wrong PIN
        // In register mode → name genuinely taken by someone else
        setError(nameStatus === 'taken'
          ? 'Falscher PIN. Bitte erneut versuchen.'
          : 'Dieser Name ist bereits vergeben. Wähle einen anderen.')
        setSaving(false)
        return
      }
    } catch {
      // Offline — save locally anyway, will verify on first score submit
    }

    localStorage.setItem('dungeontap_profile', JSON.stringify({ name: trimName, pin }))
    navigate(next, { replace: true })
  }

  const nameHint = {
    checking:  { color: 'text-gray-500',  text: '…prüfe Verfügbarkeit' },
    available: { color: 'text-green-500', text: '✓ Verfügbar!' },
    taken:     { color: 'text-red-400',   text: '✕ Name bereits vergeben' },
    yours:     { color: 'text-gold',      text: '✓ Dein aktueller Name' },
  }[nameStatus] ?? null

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 bg-dungeon safe-top safe-bottom">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-5xl"
      >
        ⚔️
      </motion.div>

      <div className="pixel text-gold text-sm text-center">
        {existing ? 'PROFIL ÄNDERN' : 'PROFIL ERSTELLEN'}
      </div>

      <p className="text-gray-500 text-xs text-center leading-relaxed max-w-xs">
        Dein Name erscheint in der Bestenliste.<br />
        Die PIN schützt ihn vor anderen.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">

        {/* Name field */}
        <div>
          <label className="pixel text-xs text-gray-500 block mb-1.5">NAME</label>
          <input
            type="text"
            maxLength={20}
            value={name}
            onChange={e => { setName(e.target.value); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="z.B. DarkKnight42"
            className={`w-full px-4 py-3 bg-dungeon-dark border text-white text-sm placeholder-gray-600 focus:outline-none transition-colors ${
              nameStatus === 'taken'     ? 'border-red-600' :
              nameStatus === 'available' ? 'border-green-700' :
              nameStatus === 'yours'     ? 'border-gold' :
              'border-dungeon-border focus:border-gold'
            }`}
          />
          <AnimatePresence mode="wait">
            {nameHint && (
              <motion.p
                key={nameStatus}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xs mt-1 ${nameHint.color}`}
              >
                {nameHint.text}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* PIN field */}
        <div>
          <label className="pixel text-xs text-gray-500 block mb-1.5">PIN (4 Ziffern)</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="····"
            className="w-full px-4 py-3 bg-dungeon-dark border border-dungeon-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold tracking-widest text-center text-xl"
          />
          <p className="text-gray-700 text-xs mt-1">
            {nameStatus === 'taken'
              ? 'Wenn du diesen Namen hast, gib deinen PIN ein zum Einloggen.'
              : 'Den PIN brauchst du, um deinen Namen zu benutzen.'}
          </p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-red-400 text-xs text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={save}
          whileTap={{ scale: 0.97 }}
          disabled={!canSave}
          className="mt-1 py-4 pixel text-sm border-2 border-gold bg-dungeon-gold text-dungeon-black disabled:opacity-40"
        >
          {saving ? 'SPEICHERT…' : nameStatus === 'taken' ? 'EINLOGGEN →' : 'SPEICHERN →'}
        </motion.button>

        {existing && (
          <button
            onClick={() => navigate(next, { replace: true })}
            className="text-gray-600 text-xs text-center py-2"
          >
            Abbrechen
          </button>
        )}
      </div>
    </div>
  )
}
