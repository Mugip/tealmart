// lib/productClassifier.ts

/**
 * Intelligently adds spaces to a slug/camelCase/PascalCase string
 * @example "toyskidsbaby" → "toys kids baby"
 * @example "homegardenfurniture" → "home garden furniture"
 * @example "JewelryWatches" → "Jewelry Watches"
 */
function addSpacesToSlug(text: string): string {
  return text
    // Add space before capital letters (PascalCase/camelCase)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Add space before numbers
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    // Common word boundaries - add spaces intelligently
    // This handles compounds like "toyskids" → "toys kids"
    .replace(/([a-z])(kids|baby|mens|womens|shoes|bags|office|home|garden)/gi, '$1 $2')
    .toLowerCase()
    .trim()
}

/**
 * Normalizes any category to a consistent format
 * Handles: CJ categories, old slugs, malformed slugs
 */
function normalizeCategorySlug(input: string): string {
  // Step 1: Replace common separators with spaces
  let normalized = input
    .toLowerCase()
    .trim()
    .replace(/\s*&\s*/g, ' and ')       // "&" → " and "
    .replace(/,\s*/g, ' ')              // "," → " "
    .replace(/[/>]/g, ' ')              // "/" or ">" → " "
    .replace(/'/g, '')                  // Remove apostrophes
  
  // Step 2: If it's already a slug (contains dashes), just clean it
  if (normalized.includes('-')) {
    return normalized
      .split('-')
      .map(word => word.trim())
      .filter(Boolean)
      .join('-')
  }
  
  // Step 3: If it's a concatenated word (no spaces or dashes), add spaces
  if (!normalized.includes(' ')) {
    normalized = addSpacesToSlug(normalized)
  }
  
  // Step 4: Convert to final slug format
  return normalized
    .replace(/[^a-z0-9\s]/g, ' ')      // Replace special chars with space
    .replace(/\s+/g, ' ')               // Multiple spaces → single space
    .trim()
    .split(' ')
    .filter(Boolean)
    .join('-')
}

/**
 * Classifies a product based on CJ's category
 * Auto-fixes malformed existing categories
 */
export function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): string {
  console.log('🔍 ===== CLASSIFICATION DEBUG =====')
  console.log('📝 Title:', title?.substring(0, 100))
  console.log('🏷️  CJ Category (RAW):', cjCategory)
  
  if (!cjCategory) {
    console.log('⚠️  No CJ category - defaulting to "general"')
    console.log('🔍 ===== END DEBUG =====\n')
    return 'general'
  }
  
  // Extract first level if it's a hierarchy (has / or >)
  let categoryToNormalize = cjCategory
  
  if (cjCategory.includes('/') || cjCategory.includes('>')) {
    const parts = cjCategory.split(/[/>]/).map(p => p.trim()).filter(Boolean)
    console.log('📊 Category hierarchy detected, parts:', parts)
    if (parts.length > 0) {
      categoryToNormalize = parts[0]
      console.log('📍 Using first level:', categoryToNormalize)
    }
  }
  
  // Normalize the category
  const normalized = normalizeCategorySlug(categoryToNormalize)
  
  console.log(`✅ Final category: "${categoryToNormalize}" → "${normalized}"`)
  console.log('🔍 ===== END DEBUG =====\n')
  
  return normalized || 'general'
}

/**
 * Formats a category slug for display
 */
export function formatCategoryName(slug: string): string {
  if (!slug || slug === 'general') return 'All Products'
  
  return slug
    .split('-')
    .map((word) => {
      if (word === 'and') return '&'
      if (word === 'womens') return "Women's"
      if (word === 'mens') return "Men's"
      if (word === 'kids') return "Kids'"
      if (word === 'childrens') return "Children's"
      
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Gets a category icon based on keywords
 */
export function getCategoryIcon(slug: string): string {
  const lower = slug.toLowerCase()
  
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
