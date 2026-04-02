// lib/imageUrl.ts
export function getSecureImageUrl(url: string | undefined | null): string {
  if (!url) return '/placeholder.png'
  
  // If the image is from a dropshipper, route it through our proxy
  if (url.includes('cjdrop') || url.includes('aliexpress') || url.includes('http')) {
    return `/api/img-proxy?url=${encodeURIComponent(url)}`
  }
  
  return url
}
