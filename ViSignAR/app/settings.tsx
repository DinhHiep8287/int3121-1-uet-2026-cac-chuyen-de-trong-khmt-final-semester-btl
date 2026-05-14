import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSettings } from '../src/hooks/useSettings'
import { setConsent, setDelay } from '../src/store/settings'
import { Colors, FontSizes, Spacing } from '../src/constants/theme'

function Para({ children }: { children: string }) {
  return <Text style={styles.cardBody}>{children}</Text>
}

const DELAY_OPTIONS = [500, 750, 1000, 1500, 2000]

export default function SettingsScreen() {
  const { delayMs, consentGiven } = useSettings()

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* REQ-COMP-001 + REQ-ML-004 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông báo sử dụng</Text>
          <Para>Ứng dụng sẽ sử dụng microphone để thu âm giọng nói và gửi đến dịch vụ nhận dạng giọng nói để xử lý.</Para>
          <Para>Phạm vi dịch hiện tại giới hạn ở từ điển đã cấu hình. Các từ ngoài từ điển sẽ được thông báo không nhận dạng được và không tạo ra ký hiệu.</Para>
          <View style={styles.consentRow}>
            <Text style={styles.consentLabel}>Tôi đã đọc và đồng ý</Text>
            <Switch
              value={consentGiven}
              onValueChange={setConsent}
              thumbColor={Colors.white}
              trackColor={{ false: '#333333', true: Colors.blue }}
            />
          </View>
        </View>

        {/* Inter-sign delay */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Độ trễ giữa ký hiệu</Text>
          <Para>Thời gian chờ giữa 2 ký hiệu liên tiếp (mặc định: 1000 ms).</Para>
          <View style={styles.delayRow}>
            {DELAY_OPTIONS.slice(0, 4).map((v) => (
              <Text
                key={v}
                onPress={() => setDelay(v)}
                style={[styles.delayOption, delayMs === v && styles.delayOptionActive]}
              >
                {v}ms
              </Text>
            ))}
          </View>
          <View style={styles.delayRow}>
            {DELAY_OPTIONS.slice(4).map((v) => (
              <Text
                key={v}
                onPress={() => setDelay(v)}
                style={[styles.delayOption, delayMs === v && styles.delayOptionActive]}
              >
                {v}ms
              </Text>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Giới thiệu</Text>
          <View style={styles.aboutBlock}>
            <Text style={styles.aboutVersion}>ViSignAR v1.0</Text>
            <Text style={styles.cardBody}>Dự án nghiên cứu UET — INT3121-1 (2026)</Text>
          </View>
          <Para>Chuyển đổi tiếng Việt nói sang hoạt ảnh 3D Ngôn ngữ Ký hiệu Việt Nam (VSL).</Para>
          <Para>Stack: Expo + React Native + Unity + OpenAI Whisper STT.</Para>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.black },
  container: { padding: Spacing.md, gap: Spacing.md },
  card: {
    borderWidth: 1,
    borderColor: Colors.blue,
    borderRadius: 10,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardTitle: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: '700' },
  cardBody: { color: '#CCCCCC', fontSize: FontSizes.sm, lineHeight: 20 },
  aboutBlock: { gap: 2 },
  aboutVersion: { color: Colors.white, fontSize: FontSizes.md, fontWeight: '700' },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  consentLabel: { color: Colors.white, fontSize: FontSizes.md },
  delayRow: { flexDirection: 'row' },
  delayOption: {
    color: Colors.blue,
    borderWidth: 1,
    borderColor: Colors.blue,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
    fontSize: FontSizes.sm,
    marginRight: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  delayOptionActive: { backgroundColor: Colors.blue, color: Colors.white },
})
