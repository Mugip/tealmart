// lib/productClassifier.ts

/**
 * Normalizes any category slug to a consistent format
 * This handles BOTH old malformed categories AND new CJ categories
 * @example "home garden-furniture" → "home-garden-furniture"
 * @example "toyskidsbaby" → "toys-kids-baby"
 * @example "Jewelry & Watches" → "jewelry-and-watches"
 */
function normalizeCategorySlug(category: string): string {
  return category
    .toLowerCase()
    .trim()
    // Convert common separators to spaces first
    .replace(/\s*&\s*/g, ' and ')        // " & " → " and "
    .replace(/,\s*/g, ' ')                // ", " → " "
    .replace(/\//g, ' ')                  // "/" → " "
    .replace(/>/g, ' ')                   // ">" → " "
    .replace(/'/g, '')                    // Remove apostrophes
    // Now we have words separated by spaces
    // Insert spaces before capitals in camelCase/PascalCase
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // "toysKidsBaby" → "toys Kids Baby"
    // Remove special characters but keep spaces
    .replace(/[^a-z0-9\s]/g, '')
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    .trim()
    // Convert spaces to dashes
    .replace(/\s/g, '-')
    // Remove any duplicate dashes
    .replace(/-+/g, '-')
    // Remove leading/trailing dashes
    .replace(/^-+|-+$/g, '')
}

/**
 * Classifies a product based on CJ's category hierarchy
 * Also auto-fixes any existing malformed categories
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
    // Check if this is already a slug (from database remapping)
    const isExistingSlug = cjCategory.includes('-') && !cjCategory.includes('/') && !cjCategory.includes('>')
    
    if (isExistingSlug) {
      // This is an old category from database - normalize it
      const normalized = normalizeCategorySlug(cjCategory)
      console.log(`🔧 Normalizing existing category: "${cjCategory}" → "${normalized}"`)
      console.log('🔍 ===== END DEBUG =====\n')
      return normalized || 'general'
    }
    
    // This is a fresh CJ category - extract first level
    const parts = cjCategory.split(/[/>]/).map(p => p.trim()).filter(Boolean)
    console.log('📊 Category parts:', parts)
    
    if (parts.length > 0) {
      const normalized = normalizeCategorySlug(parts[0])
      console.log(`✅ Using first CJ category: "${parts[0]}" → "${normalized}"`)
      console.log('🔍 ===== END DEBUG =====\n')
      return normalized || 'general'
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
