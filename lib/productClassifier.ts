// lib/productClassifier.ts

/**
 * Classifies a product based on CJ's category hierarchy
 * Returns a URL-friendly slug for storage
 */
export function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): string {
  console.log('🔍 ===== CLASSIFICATION DEBUG =====')
  console.log('📝 Title:', title?.substring(0, 100))
  console.log('🏷️  CJ Category (RAW):', cjCategory)
  
  if (cjCategory) {
    // Split by / or > to get hierarchy
    const parts = cjCategory.split(/[/>]/).map(p => p.trim()).filter(Boolean)
    console.log('📊 Category parts:', parts)
    
    if (parts.length > 0) {
      // Use the FIRST category from CJ and normalize consistently
      const firstCategory = parts[0]
        .toLowerCase()
        .replace(/\s*&\s*/g, '-and-')    // " & " → "-and-"
        .replace(/,\s*/g, '-')            // ", " → "-"
        .replace(/'/g, '')                // Remove apostrophes
        .replace(/[^a-z0-9\s-]/g, '')     // Keep letters, numbers, spaces, and dashes
        .replace(/\s+/g, '-')             // Spaces → dashes
        .replace(/-+/g, '-')              // Multiple dashes → single dash
        .trim()
        .replace(/^-+|-+$/g, '')          // Remove leading/trailing dashes
      
      console.log(`✅ Using first CJ category: "${parts[0]}" → "${firstCategory}"`)
      console.log('🔍 ===== END DEBUG =====\n')
      
      return firstCategory || 'general'
    }
  }
  
  console.log('⚠️  No CJ category - defaulting to "general"')
  console.log('🔍 ===== END DEBUG =====\n')
  
  return 'general'
}

/**
 * Formats a category slug for display to users
 * Automatically handles any category format intelligently
 */
export function formatCategoryName(slug: string): string {
  if (!slug || slug === 'general') return 'All Products'
  
  return slug
    .split('-')
    .map((word) => {
      // Convert 'and' back to '&'
      if (word === 'and') return '&'
      
      // Add apostrophe for possessives
      if (word === 'womens') return "Women's"
      if (word === 'mens') return "Men's"
      if (word === 'kids') return "Kids'"
      if (word === 'childrens') return "Children's"
      
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Gets a category icon emoji based on keywords in the category slug
 */
export function getCategoryIcon(slug: string): string {
  const lower = slug.toLowerCase()
  
  // Pattern matching for automatic icon selection
  if (lower.includes('jewelry') || lower.includes('watch')) return '💍'
  if (lower.includes('women') || lower.includes('dress') || lower.includes('ladies')) return '👗'
  if (lower.includes('men') || lower.includes('mens')) return '👔'
  if (lower.includes('kid') || lower.includes('baby') || lower.includes('toy')) return '🧸'
  if (lower.includes('home') || lower.includes('furniture') || lower.includes('garden')) return '🏡'
  if (lower.includes('phone') || lower.includes('mobile')) return '📱'
  if (lower.includes('electronic') || lower.includes('gadget')) return '🔌'
  if (lower.includes('bag') || lower.includes('shoe') || lower.includes('footwear')) return '👜'
  if (lower.includes('computer') || lower.includes('laptop') || lower.includes('office')) return '💻'
  if (lower.includes('sport') || lower.includes('fitness') || lower.includes('outdoor')) return '⚽'
  if (lower.includes('bed') || lower.includes('linen') || lower.includes('sheet')) return '🛏️'
  if (lower.includes('kitchen') || lower.includes('cookware') || lower.includes('dining')) return '🍳'
  if (lower.includes('beauty') || lower.includes('makeup') || lower.includes('cosmetic')) return '💄'
  if (lower.includes('health') || lower.includes('wellness')) return '💊'
  if (lower.includes('pet') || lower.includes('dog') || lower.includes('cat')) return '🐾'
  if (lower.includes('auto') || lower.includes('car') || lower.includes('vehicle')) return '🚗'
  if (lower.includes('book') || lower.includes('reading')) return '📚'
  if (lower.includes('music') || lower.includes('audio') || lower.includes('speaker')) return '🎵'
  if (lower.includes('camera') || lower.includes('photo')) return '📷'
  if (lower.includes('gaming') || lower.includes('game')) return '🎮'
  if (lower.includes('tool') || lower.includes('hardware')) return '🔧'
  if (lower.includes('art') || lower.includes('craft')) return '🎨'
  
  return '🛍️'
}
