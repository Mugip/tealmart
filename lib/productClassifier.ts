// lib/productClassifier.ts
import winkNLP from 'wink-nlp'
import model from 'wink-eng-lite-web-model'

// Initialize once
const nlp = winkNLP(model)

/**
 * Intelligently splits concatenated words using wink-nlp
 * No hardcoding - uses linguistic models to detect word boundaries
 */
function splitConcatenatedWords(text: string): string {
  const lower = text.toLowerCase()
  
  // Already has spaces? Return as-is
  if (lower.includes(' ')) return lower
  
  // Use wink-nlp to tokenize
  const doc = nlp.readDoc(lower)
  const tokens = doc.tokens().out()
  
  // If tokenization found multiple words, use them
  if (tokens.length > 1) {
    return tokens.join(' ')
  }
  
  // Fallback: return as-is if no split detected
  return lower
}

/**
 * Normalizes any category to a consistent format
 */
function normalizeCategorySlug(input: string): string {
  let normalized = input
    .toLowerCase()
    .trim()
    .replace(/\s*&\s*/g, ' and ')
    .replace(/,\s*/g, ' ')
    .replace(/[/>]/g, ' ')
    .replace(/'/g, '')
  
  // If already has dashes, keep structure
  if (normalized.includes('-')) {
    return normalized
      .split('-')
      .map(word => word.trim())
      .filter(Boolean)
      .join('-')
  }
  
  // If no spaces (concatenated), use NLP to split
  if (!normalized.includes(' ')) {
    normalized = splitConcatenatedWords(normalized)
  }
  
  // Convert to slug
  return normalized
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .join('-')
}

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
  
  let categoryToNormalize = cjCategory
  
  if (cjCategory.includes('/') || cjCategory.includes('>')) {
    const parts = cjCategory.split(/[/>]/).map(p => p.trim()).filter(Boolean)
    console.log('📊 Category hierarchy detected, parts:', parts)
    if (parts.length > 0) {
      categoryToNormalize = parts[0]
    }
  }
  
  const normalized = normalizeCategorySlug(categoryToNormalize)
  
  console.log(`✅ Final: "${categoryToNormalize}" → "${normalized}"`)
  console.log('🔍 ===== END DEBUG =====\n')
  
  return normalized || 'general'
}

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
