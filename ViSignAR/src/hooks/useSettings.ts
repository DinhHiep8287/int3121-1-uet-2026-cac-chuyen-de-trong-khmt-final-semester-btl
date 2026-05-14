import { useEffect, useState } from 'react'
import { getSettings, subscribe } from '../store/settings'

export function useSettings() {
  const [settings, setSettings] = useState(getSettings())

  useEffect(() => {
    // Sync ngay lần đầu
    setSettings(getSettings())
    // Subscribe thay đổi từ màn hình khác
    const unsub = subscribe(() => setSettings(getSettings()))
    return unsub
  }, [])

  return settings
}
