import { Audio } from 'expo-av'
import { log } from './logger'

// ─── Constants ────────────────────────────────────────────────────────────────
const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions'
const TIMEOUT_MS = 15_000   // REQ-INT-006: timeout 15s
const MAX_RETRIES = 1       // REQ-INT-006: retry 1 lần
const MAX_RECORD_MS = 30_000 // tự động dừng sau 30s
const MIN_RECORD_MS = 300    // bỏ qua nếu ghi âm quá ngắn (<0.3s)

// Stub phrases xoay vòng để test pipeline khi chưa có API key
const STUB_PHRASES = [
  'xin chào',
  'cảm ơn',
  'tôi uống nước',
  'chúng tôi ăn',
  'bạn là ai',
  'gia đình tôi',
  'xin chào cảm ơn',
  'ông bà cha mẹ anh chị em',
  'máy bay',           // OOV để test unknown term
  'tôi ở đâu bao nhiêu',
]
let stubIndex = 0

// ─── Error types ──────────────────────────────────────────────────────────────
export type SttErrorCode =
  | 'permission_denied'   // Không có quyền mic
  | 'too_short'           // Ghi âm quá ngắn
  | 'no_speech'           // Whisper trả về chuỗi rỗng
  | 'network'             // Không có mạng / timeout
  | 'api_error'           // Whisper trả về lỗi HTTP
  | 'unknown'             // Lỗi không xác định

export class SttError extends Error {
  constructor(
    public readonly code: SttErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'SttError'
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────
export interface SttResult {
  text: string
  durationMs: number // thời gian ghi âm thực tế
}

export type AutoStopCallback = () => void

let recording: Audio.Recording | null = null
let recordingStartedAt: number | null = null
let autoStopTimer: ReturnType<typeof setTimeout> | null = null

/** REQ-SEC-001: chỉ xin quyền microphone */
export async function requestMicPermission(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync()
  return status === 'granted'
}

/**
 * Bắt đầu ghi âm.
 * @param onAutoStop callback được gọi khi đạt MAX_RECORD_MS — UI dùng để tự gọi Stop
 */
export async function startRecording(onAutoStop?: AutoStopCallback): Promise<void> {
  if (recording) {
    // Nếu đang có session cũ, dọn dẹp trước
    await _cleanupRecording()
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  })

  const { recording: rec } = await Audio.Recording.createAsync({
    android: {
      extension: '.m4a',
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 16_000,
      numberOfChannels: 1,
      bitRate: 64_000,
    },
    ios: {
      extension: '.m4a',
      outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
      audioQuality: Audio.IOSAudioQuality.MEDIUM,
      sampleRate: 16_000,
      numberOfChannels: 1,
      bitRate: 64_000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {},
  })

  recording = rec
  recordingStartedAt = Date.now()

  // Auto-stop sau MAX_RECORD_MS
  if (onAutoStop) {
    autoStopTimer = setTimeout(() => {
      log('stt_error', `auto_stop: reached ${MAX_RECORD_MS}ms limit`)
      onAutoStop()
    }, MAX_RECORD_MS)
  }
}

/** Trả về số ms đã ghi âm (0 nếu chưa bắt đầu) */
export function getRecordingDurationMs(): number {
  if (!recordingStartedAt) return 0
  return Date.now() - recordingStartedAt
}

/** Dừng ghi âm và gửi lên Whisper (hoặc trả về stub) */
export async function stopAndTranscribe(): Promise<SttResult> {
  if (!recording) throw new SttError('unknown', 'No active recording')

  // Hủy auto-stop timer nếu có
  if (autoStopTimer) {
    clearTimeout(autoStopTimer)
    autoStopTimer = null
  }

  const durationMs = getRecordingDurationMs()

  await recording.stopAndUnloadAsync()
  const uri = recording.getURI()
  recording = null
  recordingStartedAt = null

  if (!uri) throw new SttError('unknown', 'Recording URI is null')

  // Bỏ qua nếu quá ngắn
  if (durationMs < MIN_RECORD_MS) {
    throw new SttError('too_short', `Recording only ${durationMs}ms — too short to transcribe`)
  }

  const apiKey = process.env.EXPO_PUBLIC_OPENAI_KEY
  if (!apiKey) {
    return _stubResult(durationMs)
  }

  return _transcribeWithRetry(uri, apiKey, durationMs)
}

/** Hủy ghi âm hiện tại mà không transcribe (dùng cho Reset) */
export async function cancelRecording(): Promise<void> {
  if (autoStopTimer) {
    clearTimeout(autoStopTimer)
    autoStopTimer = null
  }
  await _cleanupRecording()
}

// ─── Private helpers ───────────────────────────────────────────────────────────
async function _cleanupRecording(): Promise<void> {
  if (!recording) return
  try {
    await recording.stopAndUnloadAsync()
  } catch {
    // Bỏ qua lỗi cleanup
  }
  recording = null
  recordingStartedAt = null
}

function _stubResult(durationMs: number): SttResult {
  const text = STUB_PHRASES[stubIndex % STUB_PHRASES.length]
  stubIndex++
  console.warn(`[STT stub #${stubIndex}] "${text}"`)
  return { text, durationMs }
}

async function _transcribeWithRetry(
  uri: string,
  apiKey: string,
  durationMs: number,
): Promise<SttResult> {
  let lastErr: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

      const form = new FormData()
      form.append('file', { uri, name: 'audio.m4a', type: 'audio/m4a' } as unknown as Blob)
      form.append('model', 'whisper-1')
      form.append('language', 'vi')

      const res = await fetch(WHISPER_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: controller.signal,
      })
      clearTimeout(timer)

      if (!res.ok) {
        const body = await res.text()
        throw new SttError('api_error', `HTTP ${res.status}: ${body}`)
      }

      const data = (await res.json()) as { text: string }

      if (!data.text?.trim()) {
        throw new SttError('no_speech', 'Whisper returned empty transcript')
      }

      return { text: data.text.trim(), durationMs }

    } catch (err) {
      lastErr = err
      if (err instanceof SttError && err.code !== 'network') {
        // api_error, no_speech v.v. — không retry
        break
      }
      // network/timeout — thử lại
      if (attempt < MAX_RETRIES) {
        console.warn(`[STT] attempt ${attempt + 1} failed, retrying...`)
      }
    }
  }

  // Chuẩn hoá lỗi trước khi throw
  const sttErr = _toSttError(lastErr)
  log('stt_error', `${sttErr.code}: ${sttErr.message}`)
  throw sttErr
}

function _toSttError(err: unknown): SttError {
  if (err instanceof SttError) return err
  const msg = String(err)
  if (msg.includes('abort') || msg.includes('timeout')) {
    return new SttError('network', 'Request timed out')
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return new SttError('network', 'Network unavailable')
  }
  return new SttError('unknown', msg)
}
