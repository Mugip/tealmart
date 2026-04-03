// lib/imageUrl.ts

export function getSecureImageUrl(url: string | undefined | null): string {
  if (!url) return '/placeholder.png'
  
  // ✅ Prevent "Double Proxying" if the URL is already routed through our API
  if (url.startsWith('/api/img-proxy')) {
    return url;
  }
  
  // Route external dropshipper images through our secure tunnel
  if (url.includes('cjdrop') || url.includes('aliexpress') || url.startsWith('http')) {
    return `/api/img-proxy?url=${encodeURIComponent(url)}`
  }
  
  return url
}
