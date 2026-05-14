import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Colors } from '../src/constants/theme'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.blue },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: Colors.black },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'ViSignAR' }} />
        <Stack.Screen name="speech-to-sign" options={{ title: 'Dịch Ký Hiệu' }} />
        <Stack.Screen name="settings" options={{ title: 'Cài Đặt & Giới Thiệu' }} />
      </Stack>
    </SafeAreaProvider>
  )
}
