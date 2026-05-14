// REQ-FUNC-003: lowercase + trim + collapse spaces, giữ dấu tiếng Việt
export function normalize(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, ' ')
}
