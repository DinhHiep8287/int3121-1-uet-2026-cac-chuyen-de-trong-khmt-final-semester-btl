import { useRouter } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSizes, Spacing } from '../src/constants/theme'

export default function HomeScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.logoBlock}>
          <Text style={styles.logoText}>ViSign</Text>
          <Text style={styles.logoAccent}>AR</Text>
        </View>
        <Text style={styles.tagline}>
          Chuyển tiếng Việt thành{'\n'}Ngôn ngữ ký hiệu Việt Nam
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/speech-to-sign')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Bắt đầu dịch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/settings')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>Cài đặt & Giới thiệu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  logoBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  logoText: {
    fontSize: 52,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -1,
  },
  logoAccent: {
    fontSize: 52,
    fontWeight: '800',
    color: Colors.blue,
    letterSpacing: -1,
  },
  tagline: {
    color: '#AAAAAA',
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.blue,
    paddingVertical: Spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.blue,
    paddingVertical: Spacing.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.blue,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
})
