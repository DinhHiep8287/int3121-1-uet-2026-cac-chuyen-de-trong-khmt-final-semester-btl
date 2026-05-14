# ViSignAR

Ứng dụng mobile chuyển đổi **giọng nói tiếng Việt → hoạt ảnh 3D Ngôn ngữ Ký hiệu Việt Nam (VSL)**.

Người dùng nói vào microphone → OpenAI Whisper nhận dạng → tra từ điển VSL → avatar Unity phát ký hiệu.

> Dự án INT3121-1 — UET 2026

---

## Stack

| Tầng | Công nghệ |
|---|---|
| Mobile shell | Expo SDK 54 + React Native 0.81 (TypeScript) |
| Điều hướng | expo-router v6 |
| Ghi âm | expo-av |
| STT | OpenAI Whisper (`whisper-1`, `language: vi`) |
| Avatar 3D | Unity as a Library *(stub — chờ giai đoạn 4)* |
| Từ điển | JSON tĩnh, deterministic lookup |
| Build | Expo Application Services (EAS) |

---

## Cấu trúc thư mục

```
ViSignAR/
├── app/
│   ├── _layout.tsx           # Root layout, SafeAreaProvider, header
│   ├── index.tsx             # HomeScreen
│   ├── speech-to-sign.tsx    # Màn hình chính — toàn bộ pipeline
│   └── settings.tsx          # Cài đặt & Giới thiệu
├── src/
│   ├── constants/
│   │   └── theme.ts          # Palette #000000 / #FFFFFF / #013392
│   ├── store/
│   │   └── settings.ts       # Shared store: delayMs + consentGiven
│   ├── hooks/
│   │   └── useSettings.ts    # React hook subscribe store
│   ├── components/
│   │   ├── StatusBadge.tsx   # 6 trạng thái: idle/listening/processing/playing/unknown/error
│   │   ├── TranscriptView.tsx
│   │   └── UnityView.tsx     # Stub: hiển thị sign ID + progress bar (thay ở giai đoạn 4)
│   └── services/
│       ├── normalize.ts      # lowercase + trim + collapse spaces, giữ dấu tiếng Việt
│       ├── lookup.ts         # Phrase-first longest-match dictionary lookup
│       ├── stt.ts            # OpenAI Whisper + SttError types + auto-stop + stub xoay vòng
│       ├── playback.ts       # Queue worker, inter-sign delay
│       └── logger.ts         # 8 event types (REQ-OBS-001)
├── assets/
│   └── dictionary/
│       └── v1.json           # 23 entries bắt buộc, versioned
├── .env.example
└── app.json
```

---

## Cài đặt

```bash
cd ViSignAR
npm install
```

Cấu hình API key (xem bên dưới):

```bash
cp .env.example .env
# Điền EXPO_PUBLIC_OPENAI_KEY vào .env
```

---

## Chạy

```bash
# Android
npm run android

# iOS (macOS)
npm run ios

# Expo dev server
npm start
```

**Chưa có API key?** STT tự xoay vòng qua 10 stub phrases khác nhau (gồm cả từ OOV để test) — pipeline lookup và playback vẫn chạy đầy đủ.

---

## Cấu hình OpenAI API Key

1. Tạo key tại [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Tạo file `.env` trong thư mục `ViSignAR/`:

```env
EXPO_PUBLIC_OPENAI_KEY=sk-proj-...
```

> ⚠️ File `.env` đã có trong `.gitignore`. Không commit key lên repository.

---

## Build production (EAS)

```bash
npm install -g eas-cli
npx eas login

npx eas build --platform android --profile preview
npx eas build --platform ios --profile preview
```

---

## Kiểm tra

```bash
npx tsc --noEmit                      # TypeScript — 0 lỗi
npx expo-doctor                       # Expo health — 17/17 checks
npx expo export --platform android    # Bundle test
```

---

## Trạng thái SRS

| Req | Nội dung | Trạng thái |
|---|---|---|
| REQ-INT-001 | Palette 3 màu (`#000/#FFF/#013392`) | ✅ |
| REQ-INT-002 | 3 màn hình | ✅ |
| REQ-INT-003 | 6 status badge | ✅ |
| REQ-INT-004 | Mic chỉ bật khi active session | ✅ |
| REQ-INT-006 | OpenAI Whisper + timeout 15s + retry | ✅ (stub mode khi chưa có key) |
| REQ-INT-007 | Unity bridge `playSequence()` | 🔲 Giai đoạn 4 |
| REQ-FUNC-001 | Chỉ nhận speech input | ✅ |
| REQ-FUNC-003 | Normalize deterministic | ✅ |
| REQ-FUNC-004 | Phrase-first longest-match lookup | ✅ |
| REQ-FUNC-005 | OOV không phát animation | ✅ |
| REQ-FUNC-006 | Queue không overlap | ✅ |
| REQ-FUNC-007 | Inter-sign delay 1000ms (configurable) | ✅ |
| REQ-FUNC-008 | Reset sạch toàn bộ state | ✅ |
| REQ-FUNC-009 | Unity animation clips 4 pha | 🔲 Giai đoạn 4 |
| REQ-SEC-001 | Chỉ xin quyền microphone | ✅ |
| REQ-COMP-001 | Consent notice + gate Start | ✅ |
| REQ-ML-004 | Coverage notice tiếng Việt | ✅ |
| REQ-OBS-001 | 8 log event types | ✅ |

---

## Tiến độ

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| 1 | UI Shell + Core Pipeline (normalize, lookup, logger, playback) | ✅ Hoàn thành |
| 2 | Settings store, consent gate, delay wiring, UnityView stub có feedback | ✅ Hoàn thành |
| 3 | STT production-ready: `SttError` types, auto-stop 30s, min duration, stub xoay vòng | ✅ Hoàn thành |
| 4 | Unity project + 23 animation clips + Expo bare workflow + native bridge | 🔲 Chưa làm |
| 5 | Demo prep: 5× end-to-end, Android/iOS parity, EAS build | 🔲 Chưa làm |

---

## Bước tiếp theo

- **Giai đoạn 4:** Tạo Unity project, tạo 23 animation clips (4 pha mỗi clip), chạy `npx expo prebuild`, cài `react-native-unity-view`, thay `UnityView.tsx` stub bằng bridge thật
- **Giai đoạn 3 (hoàn thiện):** Cắm `EXPO_PUBLIC_OPENAI_KEY` thật và test trên thiết bị khi có key
