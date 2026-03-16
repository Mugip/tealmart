// lib/productClassifier.ts

/**
 * Safely extracts the first category from CJ's hierarchical format
 * Handles delimiters: '/', '>', or any combination
 * 
 * Examples:
 * "Electronics > Mobile Phones > Accessories" → "electronics"
 * "Women's Fashion / Dresses / Formal" → "womens-fashion"
 * "Home & Garden" → "home-and-garden"
 */
function extractFirstCategory(cjCategory: string): string {
  if (!cjCategory || cjCategory.trim() === '') {
    return ''
  }

  // Split on common delimiters and get the first part
  const firstPart = cjCategory.split(/[/>]/)[0].trim()
  
  return firstPart
}

/**
 * Converts category name to URL-safe slug
 * Preserves meaning while making it URL-friendly
 * 
 * Strategy:
 * 1. Lowercase everything
 * 2. Handle possessives explicitly (women's → womens)
 * 3. Replace problematic separators with dashes
 * 4. Remove only truly invalid characters for URLs
 * 5. Clean up multiple consecutive dashes
 */
function categoryToSlug(category: string): string {
  if (!category || category.trim() === '') {
    return ''
  }

  let slug = category
    .toLowerCase()
    .trim()
    // Handle possessives and contractions (preserve meaning)
    .replace(/women's/g, 'womens')
    .replace(/men's/g, 'mens')
    .replace(/kids'/g, 'kids')
    .replace(/children's/g, 'childrens')
    // Normalize common separators to spaces
    .replace(/\s*&\s*/g, ' and ')
    .replace(/\s*\/\s*/g, ' ')
    .replace(/\s*>\s*/g, ' ')
    .replace(/,\s*/g, ' ')
    // Replace spaces with dashes
    .replace(/\s+/g, '-')
    // Remove only characters invalid in URLs
    .replace(/[^a-z0-9\-]/g, '')
    // Clean up multiple consecutive dashes
    .replace(/-+/g, '-')
    // Remove leading/trailing dashes
    .replace(/^-+|-+$/g, '')

  return slug
}

/**
 * Main classification function
 * Extracts first CJ category and converts it to a URL-safe slug
 */
export function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): string {
  if (!cjCategory || cjCategory.trim() === '') {
    return 'general'
  }

  // Extract the first category from the hierarchy
  const firstCategory = extractFirstCategory(cjCategory)
  
  if (!firstCategory) {
    return 'general'
  }

  // Convert to slug
  const slug = categoryToSlug(firstCategory)

  return slug || 'general'
}

/**
 * Converts a slug back to human-readable category name
 */
export function formatCategoryName(slug: string): string {
  if (!slug || slug === 'general') {
    return 'All Products'
  }

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
 * Returns an appropriate emoji icon for a category
 */
export function getCategoryIcon(slug: string): string {
  const lower = slug.toLowerCase()

  if (lower.includes('jewelry') || lower.includes('watch')) return '💍'
  if (lower.includes('camera') || lower.includes('photo')) return '📷'
  if (lower.includes('gaming') || lower.includes('game')) return '🎮'
  if (lower.includes('womens') || lower.includes('dress')) return '👗'
  if (lower.includes('mens')) return '👔'
  if (lower.includes('kids') || lower.includes('baby') || lower.includes('toy')) return '🧸'
  if (lower.includes('home') || lower.includes('furniture') || lower.includes('garden')) return '🏡'
  if (lower.includes('phone') || lower.includes('mobile')) return '📱'
  if (lower.includes('electronic') || lower.includes('gadget')) return '🔌'
  if (lower.includes('bag') || lower.includes('shoe')) return '👜'
  if (lower.includes('computer') || lower.includes('laptop')) return '💻'
  if (lower.includes('sport') || lower.includes('fitness')) return '⚽'
  if (lower.includes('bed') || lower.includes('linen')) return '🛏️'
  if (lower.includes('kitchen') || lower.includes('cookware')) return '🍳'
  if (lower.includes('beauty') || lower.includes('makeup')) return '💄'
  if (lower.includes('health') || lower.includes('wellness')) return '💊'
  if (lower.includes('pet') || lower.includes('dog') || lower.includes('cat')) return '🐾'
  if (lower.includes('auto') || lower.includes('car')) return '🚗'
  if (lower.includes('book')) return '📚'
  if (lower.includes('music') || lower.includes('audio')) return '🎵'
  if (lower.includes('tool') || lower.includes('hardware')) return '🔧'
  if (lower.includes('art') || lower.includes('craft')) return '🎨'

  return '🛍️'
}
