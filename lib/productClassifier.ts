// lib/productClassifier.ts

// CJ Category → Our Category mapping
const CJ_CATEGORY_MAPPING: Record<string, string> = {
  // Gaming
  'gaming': 'gaming',
  'game': 'gaming',
  'console': 'gaming',
  'playstation': 'gaming',
  'xbox': 'gaming',
  'nintendo': 'gaming',
  'video game': 'gaming',
  
  // Electronics
  'electronics': 'electronics',
  'electronic': 'electronics',
  'gadget': 'electronics',
  'smart device': 'electronics',
  'android': 'electronics',
  'power bank': 'electronics',
  'charger': 'electronics',
  'adapter': 'electronics',
  'usb': 'electronics',
  
  // Phone & Mobile
  'phone': 'phone',
  'mobile': 'phone',
  'smartphone': 'phone',
  'cell phone': 'phone',
  'phone case': 'phone',
  'phone accessory': 'phone',
  
  // Computer
  'computer': 'computer',
  'laptop': 'computer',
  'pc': 'computer',
  'tablet': 'computer',
  'computer accessory': 'computer',
  
  // Audio
  'audio': 'audio',
  'headphone': 'audio',
  'earphone': 'audio',
  'speaker': 'audio',
  'headset': 'audio',
  'earbuds': 'audio',
  
  // Camera
  'camera': 'camera',
  'photography': 'camera',
  'lens': 'camera',
  'video': 'camera',
  
  // Fashion - Women
  'women': 'womens-fashion',
  'womens': 'womens-fashion',
  'ladies': 'womens-fashion',
  'female': 'womens-fashion',
  'women clothing': 'womens-fashion',
  'women fashion': 'womens-fashion',
  'dress': 'womens-fashion',
  'skirt': 'womens-fashion',
  'blouse': 'womens-fashion',
  
  // Fashion - Men
  'men': 'mens-fashion',
  'mens': 'mens-fashion',
  'male': 'mens-fashion',
  'men clothing': 'mens-fashion',
  'men fashion': 'mens-fashion',
  
  // Fashion - Kids
  'kids': 'kids-fashion',
  'children': 'kids-fashion',
  'boys': 'kids-fashion',
  'girls': 'kids-fashion',
  'children clothing': 'kids-fashion',
  'child': 'kids-fashion',
  
  // Baby
  'baby': 'baby',
  'infant': 'baby',
  'newborn': 'baby',
  'toddler': 'baby',
  'maternity': 'baby',
  
  // Shoes
  'shoes': 'shoes',
  'footwear': 'shoes',
  'sneakers': 'shoes',
  'boots': 'shoes',
  'sandals': 'shoes',
  
  // Bags
  'bag': 'bags',
  'backpack': 'bags',
  'handbag': 'bags',
  'purse': 'bags',
  'luggage': 'bags',
  
  // Jewelry
  'jewelry': 'jewelry',
  'jewellery': 'jewelry',
  'necklace': 'jewelry',
  'bracelet': 'jewelry',
  'ring': 'jewelry',
  
  // Watches
  'watch': 'watches',
  'watches': 'watches',
  'timepiece': 'watches',
  
  // Beauty
  'beauty': 'beauty',
  'makeup': 'beauty',
  'cosmetic': 'beauty',
  
  // Skincare
  'skincare': 'skincare',
  'skin care': 'skincare',
  
  // Sports
  'sports': 'sports',
  'sport': 'sports',
  'athletic': 'sports',
  'football': 'sports',
  'basketball': 'sports',
  'soccer': 'sports',
  
  // Fitness
  'fitness': 'fitness',
  'gym': 'fitness',
  'workout': 'fitness',
  'exercise': 'fitness',
  
  // Home & Living
  'home': 'furniture',
  'furniture': 'furniture',
  'home furniture': 'furniture',
  
  // Kitchen
  'kitchen': 'kitchen',
  'cookware': 'kitchen',
  'dining': 'kitchen',
  'tableware': 'kitchen',
  
  // Bedding
  'bedding': 'bedding',
  'bed': 'bedding',
  'bedroom': 'bedding',
  'linen': 'bedding',
  
  // Decor
  'decor': 'decor',
  'decoration': 'decor',
  'home decor': 'decor',
  
  // Garden
  'garden': 'home-garden',
  'outdoor': 'home-garden',
  'patio': 'home-garden',
  
  // Pets
  'pet': 'pets',
  'pets': 'pets',
  'dog': 'pets',
  'cat': 'pets',
  
  // Automotive
  'automotive': 'automotive',
  'car': 'automotive',
  'vehicle': 'automotive',
  'auto': 'automotive',
  
  // Toys
  'toy': 'toys',
  'toys': 'toys',
  
  // Tools
  'tool': 'tools',
  'tools': 'tools',
  'hardware': 'tools',
  
  // Accessories
  'accessories': 'accessories',
  'accessory': 'accessories',
}

export function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): string {
  console.log('🔍 ===== CLASSIFICATION DEBUG =====')
  console.log('📝 Title:', title?.substring(0, 100))
  console.log('📄 Description:', description?.substring(0, 100))
  console.log('🏷️  CJ Category (RAW):', cjCategory)
  
  // STEP 1: Try CJ category mapping (BEST source!)
  if (cjCategory) {
    const normalizedCJ = cjCategory.toLowerCase().trim()
    console.log('🔄 Normalized CJ:', normalizedCJ)
    
    // Direct match
    if (CJ_CATEGORY_MAPPING[normalizedCJ]) {
      const mapped = CJ_CATEGORY_MAPPING[normalizedCJ]
      console.log('✅ DIRECT MATCH:', normalizedCJ, '→', mapped)
      console.log('🔍 ===== END DEBUG =====\n')
      return mapped
    }
    
    // Check if CJ category contains any of our mapping keys
    for (const [cjKey, ourCategory] of Object.entries(CJ_CATEGORY_MAPPING)) {
      if (normalizedCJ.includes(cjKey)) {
        console.log('✅ PARTIAL MATCH:', `"${normalizedCJ}" contains "${cjKey}" →`, ourCategory)
        console.log('🔍 ===== END DEBUG =====\n')
        return ourCategory
      }
    }
    
    console.log('⚠️  NO CJ MAPPING FOUND for:', normalizedCJ)
  } else {
    console.log('⚠️  No CJ category provided')
  }
  
  // STEP 2: Fallback to title/description analysis
  console.log('🔄 Falling back to title/description analysis...')
  const text = `${title || ''} ${description || ''}`.toLowerCase()
  
  // High-confidence keyword matching
  if (text.includes('baby') || text.includes('infant') || text.includes('newborn')) {
    console.log('✅ KEYWORD MATCH: baby')
    console.log('🔍 ===== END DEBUG =====\n')
    return 'baby'
  }
  
  if ((text.includes('dress') || text.includes('clothing')) && 
      (text.includes('women') || text.includes('womens') || text.includes('ladies'))) {
    console.log('✅ KEYWORD MATCH: womens-fashion (dress/clothing + women/ladies)')
    console.log('🔍 ===== END DEBUG =====\n')
    return 'womens-fashion'
  }
  
  if ((text.includes('clothing') || text.includes('clothes')) && 
      (text.includes('men') || text.includes('mens')) && 
      !text.includes('women')) {
    console.log('✅ KEYWORD MATCH: mens-fashion')
    console.log('🔍 ===== END DEBUG =====\n')
    return 'mens-fashion'
  }
  
  if ((text.includes('clothing') || text.includes('clothes')) && 
      (text.includes('children') || text.includes('kids') || text.includes('boys') || text.includes('girls'))) {
    console.log('✅ KEYWORD MATCH: kids-fashion')
    console.log('🔍 ===== END DEBUG =====\n')
    return 'kids-fashion'
  }
  
  if (text.includes('shoes') || text.includes('sneakers') || text.includes('boots') || text.includes('sandals')) {
    console.log('✅ KEYWORD MATCH: shoes')
    console.log('🔍 ===== END DEBUG =====\n')
    return 'shoes'
  }
  
  if (text.includes('bedding') || text.includes('duvet') || text.includes('comforter') || text.includes('bedsheet')) {
    console.log('✅ KEYWORD MATCH: bedding')
    console.log('🔍 ===== END DEBUG =====\n')
    return 'bedding'
  }
  
  if (text.includes('android') || text.includes('power bank') || text.includes('charging treasure') || 
      text.includes('usb') || text.includes('projector') || text.includes('gadget')) {
    console.log('✅ KEYWORD MATCH: electronics')
    console.log('🔍 ===== END DEBUG =====\n')
    return 'electronics'
  }
  
  if ((text.includes('phone') || text.includes('smartphone')) && 
      (text.includes('case') || text.includes('holder') || text.includes('screen protector'))) {
    console.log('✅ KEYWORD MATCH: phone')
    console.log('🔍 ===== END DEBUG =====\n')
    return 'phone'
  }
  
  if (text.includes('kitchen') || text.includes('cookware') || text.includes('utensil')) {
    console.log('✅ KEYWORD MATCH: kitchen')
    console.log('🔍 ===== END DEBUG =====\n')
    return 'kitchen'
  }
  
  if (text.includes('headphones') || text.includes('earbuds') || text.includes('speaker') || text.includes('headset')) {
    console.log('✅ KEYWORD MATCH: audio')
    console.log('🔍 ===== END DEBUG =====\n')
    return 'audio'
  }
  
  if (text.includes('camera') || text.includes('lens') || text.includes('photography')) {
    console.log('✅ KEYWORD MATCH: camera')
    console.log('🔍 ===== END DEBUG =====\n')
    return 'camera'
  }
  
  if (text.includes('gaming') || text.includes('console') || text.includes('playstation') || text.includes('xbox')) {
    console.log('✅ KEYWORD MATCH: gaming')
    console.log('🔍 ===== END DEBUG =====\n')
    return 'gaming'
  }
  
  // Default
  console.log('⚠️  NO MATCH FOUND - Defaulting to general')
  console.log('🔍 ===== END DEBUG =====\n')
  return 'general'
}
