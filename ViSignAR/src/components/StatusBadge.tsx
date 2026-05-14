import { StyleSheet, Text, View } from 'react-native'
import { Colors, FontSizes, Spacing } from '../constants/theme'

export type SessionStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'playing'
  | 'unknown'
  | 'error'

const STATUS_CONFIG: Record<SessionStatus, { label: string; bg: string; fg: string }> = {
  idle:       { label: 'Chờ',           bg: Colors.black, fg: Colors.white },
  listening:  { label: 'Đang nghe…',   bg: Colors.blue,  fg: Colors.white },
  processing: { label: 'Đang xử lý…', bg: Colors.blue,  fg: Colors.white },
  playing:    { label: 'Đang phát',    bg: Colors.white, fg: Colors.black },
  unknown:    { label: 'Không nhận dạng được', bg: Colors.black, fg: Colors.white },
  error:      { label: 'Lỗi',          bg: Colors.black, fg: Colors.white },
}

interface Props {
  status: SessionStatus
}

export function StatusBadge({ status }: Props) {
  const { label, bg, fg } = STATUS_CONFIG[status]
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: Colors.blue }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 160,
    alignItems: 'center',
  },
  text: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
})
