// lib/moderation.ts
export function isSafeImage(base64: string): boolean {
  if (!base64.startsWith('data:image/')) return false

  const sizeKB = (base64.length * 3) / 4 / 1024
  if (sizeKB > 500) return false

  return true
}
