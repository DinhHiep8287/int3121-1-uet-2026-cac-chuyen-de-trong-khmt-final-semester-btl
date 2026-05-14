import { log } from './logger'
import { playSequence as unityPlaySequence } from '../components/UnityView'

// REQ-FUNC-006: single playback worker, không overlap
// REQ-FUNC-007: inter-sign delay default 1000ms

export type PlaybackState = 'idle' | 'running' | 'completed'

let state: PlaybackState = 'idle'
let queue: string[] = []
let running = false
let defaultDelayMs = 1000

export function setDefaultDelay(ms: number) {
  defaultDelayMs = ms
}

export function getDefaultDelay(): number {
  return defaultDelayMs
}

export function getState(): PlaybackState {
  return state
}

// Thêm signIds vào queue và khởi động worker nếu chưa chạy
export function enqueue(signIds: string[]) {
  queue.push(...signIds)
  if (!running) {
    runWorker()
  }
}

// REQ-FUNC-008: xóa toàn bộ queue, dừng worker
export function clearQueue() {
  queue = []
  running = false
  state = 'idle'
}

async function runWorker() {
  running = true
  state = 'running'

  while (queue.length > 0 && running) {
    const batch = [...queue]
    queue = []

    log('playback_start', batch.join(','))
    await unityPlaySequence(batch, defaultDelayMs)
    log('playback_complete', batch.join(','))
  }

  running = false
  state = 'completed'
}
