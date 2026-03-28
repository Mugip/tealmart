// lib/fakeReview.ts
export function isLikelyFakeReview(text: string): boolean {
  if (!text) return false

  const spamWords = ['buy now', '100% guaranteed', 'cheap', 'click here']
  const lower = text.toLowerCase()

  if (text.length < 10) return true

  return spamWords.some(word => lower.includes(word))
}
