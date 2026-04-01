const SETTINGS_KEY = 'dungeontap_settings'

const DEFAULTS = {
  soundEnabled:     true,
  vibrationEnabled: true,
}

export function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function isSoundEnabled()     { return loadSettings().soundEnabled !== false }
export function isVibrationEnabled() { return loadSettings().vibrationEnabled !== false }
