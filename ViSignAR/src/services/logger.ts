// REQ-OBS-001: Runtime log với 8 event bắt buộc (Appendix E)
export type LogEvent =
  | 'session_start'
  | 'session_stop'
  | 'transcript_final'
  | 'lookup_resolved'
  | 'lookup_unresolved'
  | 'playback_start'
  | 'playback_complete'
  | 'stt_error'

export interface LogEntry {
  ts: string
  event: LogEvent
  session: string
  value?: string
}

let currentSession = 'none'
const entries: LogEntry[] = []

export function setSession(sessionId: string) {
  currentSession = sessionId
}

export function log(event: LogEvent, value?: string) {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    event,
    session: currentSession,
    ...(value !== undefined && { value }),
  }
  entries.push(entry)
  console.log('[ViSignAR]', JSON.stringify(entry))
}

export function getLogs(): LogEntry[] {
  return [...entries]
}

export function clearLogs() {
  entries.length = 0
}
