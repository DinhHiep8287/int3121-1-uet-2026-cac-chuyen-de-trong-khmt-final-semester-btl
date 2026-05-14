import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { StatusBadge, SessionStatus } from '../src/components/StatusBadge'
import { TranscriptView, TranscriptSegment } from '../src/components/TranscriptView'
import { UnityView } from '../src/components/UnityView'
import { Colors, FontSizes, Spacing } from '../src/constants/theme'
import { useSettings } from '../src/hooks/useSettings'
import { log, setSession } from '../src/services/logger'
import { normalize } from '../src/services/normalize'
import { lookup } from '../src/services/lookup'
import {
  requestMicPermission,
  startRecording,
  stopAndTranscribe,
  cancelRecording,
  SttError,
} from '../src/services/stt'
import { enqueue, clearQueue, setDefaultDelay, getDefaultDelay } from '../src/services/playback'

const CLIP_DURATION_MS = 1200

let sessionCounter = 0

// Thông báo lỗi thân thiện theo SttErrorCode
function sttErrorMessage(err: unknown): string {
  if (err instanceof SttError) {
    switch (err.code) {
      case 'permission_denied': return 'Không có quyền microphone.'
      case 'too_short':         return 'Ghi âm quá ngắn, vui lòng nói dài hơn.'
      case 'no_speech':         return 'Không nhận ra giọng nói, thử lại.'
      case 'network':           return 'Lỗi mạng hoặc timeout. Kiểm tra kết nối.'
      case 'api_error':         return 'Lỗi dịch vụ nhận dạng. Thử lại sau.'
      default:                  return 'Lỗi không xác định. Thử lại.'
    }
  }
  return 'Lỗi kết nối. Nhấn Bắt đầu để thử lại.'
}

export default function SpeechToSignScreen() {
  const router = useRouter()
  const { delayMs, consentGiven } = useSettings()

  const [status, setStatus] = useState<SessionStatus>('idle')
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [recordingSec, setRecordingSec] = useState(0) // timer hiển thị

  const segmentCounter = useRef(0)
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Đồng bộ delay Settings → playback service
  useEffect(() => {
    setDefaultDelay(delayMs)
  }, [delayMs])

  function clearStatusTimer() {
    if (statusTimerRef.current) { clearTimeout(statusTimerRef.current); statusTimerRef.current = null }
  }

  function startRecordingTimer() {
    setRecordingSec(0)
    recordingTimerRef.current = setInterval(
      () => setRecordingSec((s) => s + 1),
      1000,
    )
  }

  function stopRecordingTimer() {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null }
    setRecordingSec(0)
  }

  // Auto-stop callback từ STT service (đạt giới hạn 30s)
  const handleAutoStop = useCallback(() => {
    setIsRecording(false)
    stopRecordingTimer()
    processTranscription()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleStart = useCallback(async () => {
    if (!consentGiven) {
      Alert.alert(
        'Chưa đồng ý điều khoản',
        'Vào Cài Đặt và bật "Tôi đã đọc và đồng ý" trước khi sử dụng.',
        [
          { text: 'Huỷ', style: 'cancel' },
          { text: 'Đến Cài Đặt', onPress: () => router.push('/settings') },
        ]
      )
      return
    }

    const granted = await requestMicPermission()
    if (!granted) {
      Alert.alert('Thiếu quyền microphone', 'Vui lòng cấp quyền microphone trong cài đặt thiết bị.')
      return
    }

    sessionCounter++
    setSession(`S-${String(sessionCounter).padStart(3, '0')}`)
    log('session_start')

    clearStatusTimer()
    setErrorMsg(null)
    setStatus('listening')
    setIsRecording(true)
    startRecordingTimer()

    try {
      await startRecording(handleAutoStop)
    } catch (err) {
      log('stt_error', String(err))
      setErrorMsg(sttErrorMessage(err))
      setStatus('error')
      setIsRecording(false)
      stopRecordingTimer()
    }
  }, [consentGiven, router, handleAutoStop])

  // Tách logic transcription ra để dùng chung cho handleStop và handleAutoStop
  async function processTranscription() {
    setStatus('processing')
    setErrorMsg(null)

    try {
      const { text, durationMs } = await stopAndTranscribe()
      log('transcript_final', `${text} (${durationMs}ms)`)

      const normalizedText = normalize(text)
      const { signIds, unknownTerms } = lookup(normalizedText)

      if (signIds.length > 0) {
        log('lookup_resolved', `${normalizedText} -> ${signIds.join(',')}`)
      }
      unknownTerms.forEach((term) => log('lookup_unresolved', term))

      segmentCounter.current++
      setSegments((prev) => [
        ...prev,
        {
          id: String(segmentCounter.current),
          text: normalizedText,
          resolvedCount: signIds.length,
          unknownTerms,
        },
      ])

      if (signIds.length > 0) {
        setStatus('playing')
        enqueue(signIds)
        const totalMs = signIds.length * (CLIP_DURATION_MS + getDefaultDelay())
        clearStatusTimer()
        statusTimerRef.current = setTimeout(() => setStatus('idle'), totalMs)
      } else {
        setStatus(unknownTerms.length > 0 ? 'unknown' : 'idle')
        if (unknownTerms.length > 0) {
          clearStatusTimer()
          statusTimerRef.current = setTimeout(() => setStatus('idle'), 2500)
        }
      }

      log('session_stop')
    } catch (err) {
      log('stt_error', String(err))
      setErrorMsg(sttErrorMessage(err))
      setStatus('error')
    }
  }

  const handleStop = useCallback(async () => {
    if (!isRecording) return
    setIsRecording(false)
    stopRecordingTimer()
    await processTranscription()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording])

  const handleReset = useCallback(() => {
    if (isRecording) {
      cancelRecording().catch(() => {})
      setIsRecording(false)
    }
    stopRecordingTimer()
    clearStatusTimer()
    clearQueue()
    setSegments([])
    setStatus('idle')
    setErrorMsg(null)
    segmentCounter.current = 0
    log('session_stop')
  }, [isRecording])

  // Cleanup khi unmount
  useEffect(() => () => {
    clearStatusTimer()
    stopRecordingTimer()
  }, [])

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>

        {/* Unity avatar */}
        <View style={styles.unityArea}>
          <UnityView />
        </View>

        {/* Status + recording timer */}
        <View style={styles.statusRow}>
          <StatusBadge status={status} />
          {isRecording && (
            <Text style={styles.timer}>
              {String(Math.floor(recordingSec / 60)).padStart(2, '0')}:
              {String(recordingSec % 60).padStart(2, '0')} / 0:30
            </Text>
          )}
        </View>

        {/* Transcript */}
        <View style={styles.transcriptArea}>
          <TranscriptView segments={segments} />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, isRecording && styles.btnDisabled]}
            onPress={handleStart}
            disabled={isRecording}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Bắt đầu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, !isRecording && styles.btnDisabled]}
            onPress={handleStop}
            disabled={!isRecording}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Dừng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            onPress={handleReset}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Đặt lại</Text>
          </TouchableOpacity>
        </View>

        {/* Thông báo lỗi cụ thể */}
        {errorMsg && <Text style={styles.errorHint}>{errorMsg}</Text>}

        {/* Nhắc consent */}
        {!consentGiven && !errorMsg && (
          <Text style={styles.consentHint}>Vào Cài Đặt để đồng ý điều khoản trước khi sử dụng.</Text>
        )}

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.black },
  container: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  unityArea: { flex: 3 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  timer: {
    color: Colors.blue,
    fontSize: FontSizes.sm,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  transcriptArea: { flex: 2 },
  controls: { flexDirection: 'row', gap: Spacing.sm },
  btn: { flex: 1, paddingVertical: Spacing.md, borderRadius: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: Colors.blue },
  btnOutline: { borderWidth: 1, borderColor: Colors.blue, backgroundColor: Colors.black },
  btnDisabled: { opacity: 0.3 },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: FontSizes.md },
  errorHint: { color: '#FF6B6B', textAlign: 'center', fontSize: FontSizes.sm },
  consentHint: { color: '#FFAA00', textAlign: 'center', fontSize: FontSizes.sm },
})
