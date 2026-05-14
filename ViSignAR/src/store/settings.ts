// Store đơn giản dùng chung giữa Settings và SpeechToSign
// Không cần AsyncStorage cho prototype — state sống trong bộ nhớ

type Listener = () => void

interface SettingsState {
  delayMs: number
  consentGiven: boolean
}

const state: SettingsState = {
  delayMs: 1000,
  consentGiven: false,
}

const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((fn) => fn())
}

export function getSettings(): Readonly<SettingsState> {
  return state
}

export function setDelay(ms: number) {
  state.delayMs = ms
  notify()
}

export function setConsent(given: boolean) {
  state.consentGiven = given
  notify()
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
