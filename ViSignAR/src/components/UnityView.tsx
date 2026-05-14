import { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { Colors, FontSizes, Spacing } from '../constants/theme'

// ---------------------------------------------------------------------------
// Stub: Unity integration được thêm ở Giai đoạn 4.
// Interface Bridge cuối:
//   playSequence(signIds: string[], delayMs: number) => Promise<void>
//   via UnitySendMessage('SignBridge', 'PlaySequence', JSON.stringify({signIds, delayMs}))
// ---------------------------------------------------------------------------

const CLIP_DURATION_MS = 1200

interface PlaybackItem {
  signId: string
  index: number
  total: number
}

// State nội bộ của stub để UnityView tự render
let currentItem: PlaybackItem | null = null
let listeners: Array<(item: PlaybackItem | null) => void> = []

function notifyListeners(item: PlaybackItem | null) {
  listeners.forEach((fn) => fn(item))
}

export function UnityView() {
  const [playing, setPlaying] = useState<PlaybackItem | null>(null)
  const progressAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Lắng nghe thay đổi từ playSequence
    const fn = (item: PlaybackItem | null) => setPlaying(item)
    listeners.push(fn)
    return () => {
      listeners = listeners.filter((l) => l !== fn)
    }
  }, [])

  useEffect(() => {
    if (playing) {
      progressAnim.setValue(0)
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: CLIP_DURATION_MS,
        useNativeDriver: false,
      }).start()
    } else {
      progressAnim.setValue(0)
    }
  }, [playing, progressAnim])

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Unity Avatar</Text>

      {playing ? (
        <View style={styles.playingBlock}>
          {/* Sign ID đang phát */}
          <Text style={styles.signId}>{playing.signId}</Text>
          <Text style={styles.signCounter}>
            {playing.index + 1} / {playing.total}
          </Text>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>

          <Text style={styles.phaseLabel}>▶ Đang phát...</Text>
        </View>
      ) : (
        <Text style={styles.sub}>3D sign animation sẽ hiển thị tại đây</Text>
      )}
    </View>
  )
}

// Được gọi bởi playback.ts
export async function playSequence(signIds: string[], delayMs: number = 1000): Promise<void> {
  for (let i = 0; i < signIds.length; i++) {
    const item: PlaybackItem = { signId: signIds[i], index: i, total: signIds.length }
    currentItem = item
    notifyListeners(item)

    // Giả lập thời gian phát clip
    await sleep(CLIP_DURATION_MS)

    currentItem = null
    notifyListeners(null)

    // Delay giữa signs (trừ sign cuối)
    if (i < signIds.length - 1) {
      await sleep(delayMs)
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1a3a',
    borderWidth: 1,
    borderColor: Colors.blue,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  label: {
    color: '#8899BB',
    fontSize: FontSizes.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  sub: {
    color: '#8899BB',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  playingBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
  },
  signId: {
    color: Colors.white,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    letterSpacing: 1,
  },
  signCounter: {
    color: '#8899BB',
    fontSize: FontSizes.sm,
  },
  progressTrack: {
    width: '80%',
    height: 4,
    backgroundColor: '#1a2a4a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.blue,
    borderRadius: 2,
  },
  phaseLabel: {
    color: Colors.blue,
    fontSize: FontSizes.sm,
  },
})
