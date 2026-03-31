import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Profile() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'

  const existing = JSON.parse(localStorage.getItem('dungeontap_profile') || 'null')
  const [name, setName]   = useState(existing?.name || '')
  const [pin, setPin]     = useState('')
  const [error, setError] = useState(null)

  function save() {
    const trimName = name.trim()
    if (trimName.length < 2) return setError('Name mindestens 2 Zeichen')
    if (!/^\d{4}$/.test(pin)) return setError('PIN muss genau 4 Ziffern sein')
    localStorage.setItem('dungeontap_profile', JSON.stringify({ name: trimName, pin }))
    navigate(next, { replace: true })
  }

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
        <div>
          <label className="pixel text-xs text-gray-500 block mb-1.5">NAME</label>
          <input
            type="text"
            maxLength={20}
            value={name}
            onChange={e => { setName(e.target.value); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="z.B. DarkKnight42"
            className="w-full px-4 py-3 bg-dungeon-dark border border-dungeon-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="pixel text-xs text-gray-500 block mb-1.5">
            PIN (4 Ziffern)
          </label>
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
            Den PIN brauchst du, um deinen Namen zu benutzen.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-xs text-center"
          >
            {error}
          </motion.div>
        )}

        <motion.button
          onClick={save}
          whileTap={{ scale: 0.97 }}
          disabled={name.trim().length < 2 || pin.length !== 4}
          className="mt-1 py-4 pixel text-sm border-2 border-gold bg-dungeon-gold text-dungeon-black disabled:opacity-40"
        >
          SPEICHERN →
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
