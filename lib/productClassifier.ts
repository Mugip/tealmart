// lib/productClassifier.ts

‎/**
‎ * Extracts the MOST SPECIFIC category from CJ's hierarchical format
‎ * This is better for e-commerce - users search for specific items, not broad categories
‎ * 
‎ * Examples:
‎ * "Electronics > Mobile > Phones" → "phones" (most specific)
‎ * "Women's Fashion / Dresses / Formal" → "formal" (most specific)
‎ * "Home & Garden > Furniture > Chairs" → "chairs" (most specific)
‎ * "Electronics" → "electronics" (only one, use it)
‎ */
‎function extractMostSpecificCategory(cjCategory: string): string {
‎  if (!cjCategory || cjCategory.trim() === '') {
‎    return ''
‎  }
‎
‎  // Split on common hierarchy delimiters
‎  const parts = cjCategory
‎    .split(/[/>]/)
‎    .map(p => p.trim())
‎    .filter(Boolean)
‎
‎  // Return the last (most specific) part
‎  return parts.length > 0 ? parts[parts.length - 1] : ''
‎}
‎
‎/**
‎ * Converts category name to URL-safe slug
‎ * Handles special cases and normalizes format
‎ */
‎function categoryToSlug(category: string): string {
‎  if (!category || category.trim() === '') {
‎    return ''
‎  }
‎
‎  let slug = category
‎    .toLowerCase()
‎    .trim()
‎    // Handle possessives and contractions
‎    .replace(/women's/g, 'womens')
‎    .replace(/men's/g, 'mens')
‎    .replace(/kids'/g, 'kids')
‎    .replace(/children's/g, 'childrens')
‎    .replace(/don't/g, 'dont')
‎    .replace(/can't/g, 'cant')
‎    // Normalize separators
‎    .replace(/\s*&\s*/g, '-and-')
‎    .replace(/\s*\/\s*/g, '-')
‎    .replace(/\s*>\s*/g, '-')
‎    .replace(/,\s*/g, '-')
‎    // Replace spaces with dashes
‎    .replace(/\s+/g, '-')
‎    // Remove invalid URL characters
‎    .replace(/[^a-z0-9\-]/g, '')
‎    // Clean up multiple dashes
‎    .replace(/-+/g, '-')
‎    // Trim dashes from edges
‎    .replace(/^-+|-+$/g, '')
‎
‎  return slug
‎}
‎
‎/**
‎ * Main classification function
‎ * Extracts the MOST SPECIFIC category and converts to slug
‎ * 
‎ * This is ideal for e-commerce because:
‎ * - Users search for specific products (chairs, not furniture)
‎ * - Better product filtering and recommendations
‎ * - Cleaner URL slugs
‎ * - More meaningful SEO
‎ * 
‎ * @param title - Product title (for future semantic fallback)
‎ * @param description - Product description (for future semantic fallback)
‎ * @param cjCategory - Category string (hierarchical format)
‎ * @returns URL-safe category slug or "general"
‎ */
‎export function classifyProduct(
‎  title?: string,
‎  description?: string,
‎  cjCategory?: string
‎): string {
‎  if (!cjCategory || cjCategory.trim() === '') {
‎    // Future: Could use title/description for semantic classification
‎    return 'general'
‎  }
‎
‎  // Extract the most specific (deepest) category from hierarchy
‎  const specificCategory = extractMostSpecificCategory(cjCategory)
‎
‎  if (!specificCategory) {
‎    return 'general'
‎  }
‎
‎  // Convert to slug
‎  const slug = categoryToSlug(specificCategory)
‎
‎  return slug || 'general'
‎}
‎
‎/**
‎ * Converts a slug back to human-readable category name
‎ * Reverses the transformations from categoryToSlug
‎ */
‎export function formatCategoryName(slug: string): string {
‎  if (!slug || slug === 'general') {
‎    return 'All Products'
‎  }
‎
‎  return slug
‎    .split('-')
‎    .map((word) => {
‎      // Map back special cases
‎      if (word === 'and') return '&'
‎      if (word === 'womens') return "Women's"
‎      if (word === 'mens') return "Men's"
‎      if (word === 'kids') return "Kids'"
‎      if (word === 'childrens') return "Children's"
‎
‎      // Capitalize first letter of regular words
‎      return word.charAt(0).toUpperCase() + word.slice(1)
‎    })
‎    .join(' ')
‎}
‎
‎/**
‎ * Returns an appropriate emoji icon for a category
‎ * More granular matching for specific categories
‎ */
‎export function getCategoryIcon(slug: string): string {
‎  const lower = slug.toLowerCase()
‎
‎  // Match specific product types first (more specific matches)
‎  if (lower.includes('phone') || lower.includes('mobile') || lower.includes('smartphone')) return '📱'
‎  if (lower.includes('laptop') || lower.includes('notebook')) return '💻'
‎  if (lower.includes('watch')) return '⌚'
‎  if (lower.includes('chair') || lower.includes('sofa') || lower.includes('couch')) return '🪑'
‎  if (lower.includes('bed') || lower.includes('mattress')) return '🛏️'
‎  if (lower.includes('desk') || lower.includes('table')) return '🚪'
‎  if (lower.includes('lamp') || lower.includes('light')) return '💡'
‎  if (lower.includes('door') || lower.includes('window')) return '🪟'
‎  if (lower.includes('mirror')) return '🪞'
‎  if (lower.includes('carpet') || lower.includes('rug')) return '🧺'
‎  if (lower.includes('pillow') || lower.includes('cushion')) return '🛋️'
‎  if (lower.includes('towel') || lower.includes('sheet')) return '🧻'
‎  if (lower.includes('blanket') || lower.includes('comforter')) return '🛏️'
‎
‎  // Clothing & fashion
‎  if (lower.includes('dress') || lower.includes('gown')) return '👗'
‎  if (lower.includes('shirt') || lower.includes('top')) return '👔'
‎  if (lower.includes('pants') || lower.includes('jeans') || lower.includes('trouser')) return '👖'
‎  if (lower.includes('jacket') || lower.includes('coat')) return '🧥'
‎  if (lower.includes('shoe') || lower.includes('boot') || lower.includes('sneaker')) return '👟'
‎  if (lower.includes('hat') || lower.includes('cap')) return '🎩'
‎  if (lower.includes('sock')) return '🧦'
‎  if (lower.includes('underwear') || lower.includes('bra')) return '👙'
‎  if (lower.includes('scarf') || lower.includes('tie')) return '🎀'
‎  if (lower.includes('glove')) return '🧤'
‎  if (lower.includes('jewelry') || lower.includes('ring') || lower.includes('necklace')) return '💍'
‎  if (lower.includes('bracelet') || lower.includes('anklet')) return '💎'
‎  if (lower.includes('earring')) return '💎'
‎  if (lower.includes('bag') || lower.includes('purse') || lower.includes('backpack')) return '👜'
‎  if (lower.includes('belt')) return '⌛'
‎
‎  // Beauty & personal care
‎  if (lower.includes('makeup') || lower.includes('cosmetic')) return '💄'
‎  if (lower.includes('perfume') || lower.includes('fragrance')) return '🌸'
‎  if (lower.includes('hair') || lower.includes('shampoo')) return '💇'
‎  if (lower.includes('skincare') || lower.includes('lotion')) return '🧴'
‎  if (lower.includes('toothbrush') || lower.includes('toothpaste')) return '🪥'
‎
‎  // Health & wellness
‎  if (lower.includes('vitamin') || lower.includes('supplement')) return '💊'
‎  if (lower.includes('medicine') || lower.includes('drug')) return '⚕️'
‎  if (lower.includes('yoga') || lower.includes('exercise')) return '🧘'
‎
‎  // Kitchen & dining
‎  if (lower.includes('pot') || lower.includes('pan') || lower.includes('skillet')) return '🍳'
‎  if (lower.includes('knife') || lower.includes('utensil')) return '🔪'
‎  if (lower.includes('plate') || lower.includes('bowl') || lower.includes('cup')) return '🍽️'
‎  if (lower.includes('spoon') || lower.includes('fork')) return '🥄'
‎  if (lower.includes('blender') || lower.includes('mixer')) return '🥤'
‎  if (lower.includes('toaster') || lower.includes('oven')) return '🔲'
‎
‎  // Electronics & tech
‎  if (lower.includes('camera') || lower.includes('photo')) return '📷'
‎  if (lower.includes('gaming') || lower.includes('game') || lower.includes('console')) return '🎮'
‎  if (lower.includes('headphone') || lower.includes('earphone')) return '🎧'
‎  if (lower.includes('speaker') || lower.includes('audio')) return '🔊'
‎  if (lower.includes('router') || lower.includes('modem')) return '📡'
‎  if (lower.includes('charger') || lower.includes('cable')) return '🔌'
‎  if (lower.includes('monitor') || lower.includes('screen')) return '🖥️'
‎  if (lower.includes('keyboard') || lower.includes('mouse')) return '⌨️'
‎  if (lower.includes('printer')) return '🖨️'
‎
‎  // Sports & outdoor
‎  if (lower.includes('bike') || lower.includes('bicycle')) return '🚴'
‎  if (lower.includes('ball') || lower.includes('soccer') || lower.includes('basketball')) return '⚽'
‎  if (lower.includes('tennis') || lower.includes('racket')) return '🎾'
‎  if (lower.includes('golf')) return '⛳'
‎  if (lower.includes('ski') || lower.includes('snowboard')) return '🏂'
‎  if (lower.includes('tent') || lower.includes('camping')) return '⛺'
‎  if (lower.includes('fishing') || lower.includes('rod')) return '🎣'
‎  if (lower.includes('skateboard')) return '🛹'
‎  if (lower.includes('roller')) return '🛼'
‎
‎  // Pets & animals
‎  if (lower.includes('dog')) return '🐕'
‎  if (lower.includes('cat')) return '🐈'
‎  if (lower.includes('bird') || lower.includes('parrot')) return '🦜'
‎  if (lower.includes('fish') || lower.includes('aquarium')) return '🐠'
‎  if (lower.includes('pet')) return '🐾'
‎
‎  // Toys & hobbies
‎  if (lower.includes('toy') || lower.includes('doll')) return '🧸'
‎  if (lower.includes('puzzle')) return '🧩'
‎  if (lower.includes('lego') || lower.includes('block')) return '🧱'
‎  if (lower.includes('action-figure')) return '🦸'
‎
‎  // Books & media
‎  if (lower.includes('book') || lower.includes('novel')) return '📚'
‎  if (lower.includes('magazine') || lower.includes('comic')) return '📖'
‎  if (lower.includes('music') || lower.includes('vinyl')) return '🎵'
‎  if (lower.includes('dvd') || lower.includes('movie')) return '🎬'
‎
‎  // Tools & hardware
‎  if (lower.includes('screwdriver') || lower.includes('wrench') || lower.includes('hammer')) return '🔧'
‎  if (lower.includes('drill') || lower.includes('saw')) return '⚙️'
‎  if (lower.includes('nail') || lower.includes('screw') || lower.includes('bolt')) return '🔩'
‎
‎  // Art & craft
‎  if (lower.includes('paint') || lower.includes('brush')) return '🎨'
‎  if (lower.includes('pencil') || lower.includes('pen') || lower.includes('marker')) return '✏️'
‎  if (lower.includes('craft')) return '✂️'
‎
‎  // Automotive
‎  if (lower.includes('car') || lower.includes('vehicle') || lower.includes('auto')) return '🚗'
‎  if (lower.includes('tire') || lower.includes('wheel')) return '🛞'
‎  if (lower.includes('battery')) return '🔋'
‎  if (lower.includes('oil') || lower.includes('lubricant')) return '🛢️'
‎
‎  // Default fallback
‎  return '🛍️'
‎}
