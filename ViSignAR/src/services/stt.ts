import { Audio } from 'expo-av'
import { log } from './logger'

// ─── Constants ────────────────────────────────────────────────────────────────
const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions'
const TIMEOUT_MS = 15_000    // REQ-INT-006: timeout 15s
const MAX_RETRIES = 1        // REQ-INT-006: retry 1 lần (chỉ cho network/429)
const RETRY_DELAY_MS = 2_000 // delay trước khi retry (tránh 429 liên tiếp)
const MAX_RECORD_MS = 30_000 // tự động dừng sau 30s
const MIN_RECORD_MS = 300    // bỏ qua nếu ghi âm quá ngắn (<0.3s)
const MAX_FILE_BYTES = 24 * 1024 * 1024 // 24MB — Whisper limit là 25MB
// Whisper hallucinate các câu YouTube khi gặp im lặng/noise — lọc bằng no_speech_prob
const NO_SPEECH_THRESHOLD = 0.6

// Prompt hint giúp Whisper bias về dấu tiếng Việt và từ vựng ứng dụng
// Không được dài quá 224 token (~900 ký tự)
const VI_PROMPT =
  'Xin chào, cảm ơn, tôi, bạn, chúng tôi, chúng ta, ai, ở đâu, gì, bao nhiêu, lúc nào, ' +
  'gia đình, cha, mẹ, ông, bà, anh, chị, em, ăn, uống, nước, nhà.'

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
  | 'file_too_large'      // File vượt 25MB (hiếm với 30s ghi âm)
  | 'no_speech'           // Whisper trả về chuỗi rỗng
  | 'invalid_key'         // API key sai hoặc hết hạn (HTTP 401)
  | 'rate_limit'          // Quá nhiều request (HTTP 429)
  | 'network'             // Không có mạng / timeout
  | 'api_error'           // Lỗi HTTP khác từ Whisper
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

  // Kiểm tra file size trước khi upload (Whisper limit: 25MB)
  try {
    const { size } = await _getFileInfo(uri)
    if (size > MAX_FILE_BYTES) {
      throw new SttError('file_too_large', `File ${(size / 1024 / 1024).toFixed(1)}MB exceeds 24MB limit`)
    }
  } catch (err) {
    if (err instanceof SttError) throw err
    // Không block nếu không đọc được size
    console.warn('[STT] Could not check file size:', err)
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
async function _getFileInfo(uri: string): Promise<{ size: number }> {
  // expo-file-system không bắt buộc — dùng fetch HEAD nếu là file:// URI
  // Trên React Native, fetch một file:// URI trả về blob với size
  const res = await fetch(uri)
  const blob = await res.blob()
  return { size: blob.size }
}

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
    if (attempt > 0) {
      // Delay trước retry để tránh 429 liên tiếp
      await _sleep(RETRY_DELAY_MS)
      console.warn(`[STT] retry attempt ${attempt}...`)
    }

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

      const form = new FormData()
      form.append('file', { uri, name: 'audio.m4a', type: 'audio/m4a' } as unknown as Blob)
      form.append('model', 'whisper-1')
      form.append('language', 'vi')
      form.append('response_format', 'verbose_json')
      form.append('prompt', VI_PROMPT)  // bias dấu tiếng Việt

      const res = await fetch(WHISPER_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: controller.signal,
      })
      clearTimeout(timer)

      if (!res.ok) {
        const body = await res.text()
        throw _httpError(res.status, body)
      }

      const data = (await res.json()) as {
        text: string
        segments?: { no_speech_prob: number }[]
      }

      if (!data.text?.trim()) {
        throw new SttError('no_speech', 'Whisper returned empty transcript')
      }

      // Phát hiện hallucination: no_speech_prob cao → Whisper đang bịa câu
      const maxNoSpeech = data.segments?.length
        ? Math.max(...data.segments.map((s) => s.no_speech_prob))
        : 0
      console.log(`[STT] no_speech_prob=${maxNoSpeech.toFixed(3)} text="${data.text.trim()}"`)
      if (maxNoSpeech > NO_SPEECH_THRESHOLD) {
        throw new SttError('no_speech', `Hallucination detected (no_speech_prob=${maxNoSpeech.toFixed(2)})`)
      }

      return { text: data.text.trim(), durationMs }

    } catch (err) {
      lastErr = err
      const sttErr = _toSttError(err)

      // Chỉ retry khi network timeout hoặc rate limit
      const canRetry = sttErr.code === 'network' || sttErr.code === 'rate_limit'
      if (!canRetry || attempt >= MAX_RETRIES) break
    }
  }

  const sttErr = _toSttError(lastErr)
  log('stt_error', `${sttErr.code}: ${sttErr.message}`)
  throw sttErr
}

/** Phân loại lỗi HTTP theo status code */
function _httpError(status: number, body: string): SttError {
  switch (status) {
    case 401: return new SttError('invalid_key',  'Invalid or expired API key')
    case 413: return new SttError('file_too_large', 'Audio file exceeds 25MB limit')
    case 429: return new SttError('rate_limit',   'Rate limit exceeded, please wait')
    default:  return new SttError('api_error',    `HTTP ${status}: ${body.slice(0, 120)}`)
  }
}

function _toSttError(err: unknown): SttError {
  if (err instanceof SttError) return err
  const msg = String(err)
  if (msg.includes('abort') || msg.includes('timeout')) {
    return new SttError('network', 'Request timed out')
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
    return new SttError('network', 'Network unavailable')
  }
  return new SttError('unknown', msg)
}

function _sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
