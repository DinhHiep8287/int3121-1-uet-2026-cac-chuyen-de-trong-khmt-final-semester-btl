import dictionaryData from '../../assets/dictionary/v1.json'

export interface DictionaryEntry {
  source: string
  signIds: string[]
  priority: number
}

export interface LookupResult {
  signIds: string[]
  unknownTerms: string[]
}

// Sắp xếp entries: priority cao → dài → lexical (REQ-FUNC-004)
const entries: DictionaryEntry[] = [...dictionaryData.entries].sort((a, b) => {
  if (b.priority !== a.priority) return b.priority - a.priority
  if (b.source.length !== a.source.length) return b.source.length - a.source.length
  return a.source.localeCompare(b.source)
})

// Phrase-first longest-match từ vị trí cursor
function matchAt(text: string, cursor: number): DictionaryEntry | null {
  for (const entry of entries) {
    if (text.startsWith(entry.source, cursor)) {
      return entry
    }
  }
  return null
}

// Tìm token (word) tiếp theo từ cursor — dùng khi không match phrase
function nextToken(text: string, cursor: number): string {
  const rest = text.slice(cursor)
  const spaceIdx = rest.indexOf(' ')
  return spaceIdx === -1 ? rest : rest.slice(0, spaceIdx)
}

// REQ-FUNC-004: Lookup toàn bộ normalized text
export function lookup(normalizedText: string): LookupResult {
  const signIds: string[] = []
  const unknownTerms: string[] = []
  let cursor = 0

  while (cursor < normalizedText.length) {
    // Bỏ qua khoảng trắng đầu
    if (normalizedText[cursor] === ' ') {
      cursor++
      continue
    }

    const match = matchAt(normalizedText, cursor)
    if (match) {
      signIds.push(...match.signIds)
      cursor += match.source.length
    } else {
      // REQ-FUNC-005: unknown term → không emit signId
      const token = nextToken(normalizedText, cursor)
      if (token.length > 0) {
        unknownTerms.push(token)
        cursor += token.length
      } else {
        cursor++
      }
    }
  }

  return { signIds, unknownTerms }
}

export const DICTIONARY_VERSION = dictionaryData.version
