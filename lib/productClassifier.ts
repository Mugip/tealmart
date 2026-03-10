// lib/productClassifier.ts
import nlp from 'compromise'

const CATEGORY_PATTERNS: Record<string, { 
  primary: string[]
  secondary: string[]
  phrases: string[]
  excludeIfContains?: string[]
}> = {
  'gaming': {
    primary: ['gaming', 'gamer', 'esports', 'console', 'playstation', 'xbox', 'nintendo'],
    secondary: ['rgb', 'controller', 'joystick'],
    phrases: ['gaming chair', 'gaming desk', 'gaming headset', 'game controller'],
    excludeIfContains: ['baby', 'infant', 'women', 'womens', 'dress']
  },
  
  'phone': {
    primary: ['phone', 'smartphone', 'iphone', 'samsung'],
    secondary: ['case', 'screen protector'],
    phrases: ['phone case', 'screen protector'],
    excludeIfContains: ['baby']
  },
  
  'computer': {
    primary: ['laptop', 'computer', 'pc', 'desktop', 'macbook'],
    secondary: ['keyboard', 'mouse', 'monitor'],
    phrases: ['graphics card', 'usb hub', 'usb android cable'],
    excludeIfContains: ['baby', 'women', 'womens', 'dress']
  },
  
  'audio': {
    primary: ['headphones', 'earbuds', 'earphones', 'speaker', 'soundbar'],
    secondary: ['bluetooth headset', 'wireless headset'],
    phrases: ['bluetooth speaker', 'wireless earbuds', 'wireless bluetooth headset'],
    excludeIfContains: ['baby', 'android', 'projector']
  },
  
  'camera': {
    primary: ['camera', 'dslr', 'mirrorless', 'gopro', 'telescope', 'endoscope'],
    secondary: ['lens', 'tripod', '18x'],
    phrases: ['camera lens', 'telescope zoom', 'waterproof endoscope', '18x telescope'],
    excludeIfContains: ['baby']
  },
  
  'sports': {
    primary: ['football', 'soccer', 'basketball', 'tennis', 'volleyball', 'golf'],
    secondary: ['ball', 'net', 'racket'],
    phrases: ['sports equipment', 'training gear'],
    excludeIfContains: ['baby', 'infant', 'women', 'womens', 'dress']
  },
  
  'fitness': {
    primary: ['fitness', 'gym', 'workout', 'exercise'],
    secondary: ['dumbbell', 'kettlebell', 'resistance'],
    phrases: ['resistance band', 'gym equipment', 'fitness tracker'],
    excludeIfContains: ['baby', 'women', 'womens', 'dress', 'clothing', 'shirt', 'blouse']
  },
  
  'mens-fashion': {
    primary: ['mens', 'men sweater', 'men shirt'],
    secondary: ['jacket', 'jeans', 'hoodie'],
    phrases: ['mens shirt', 'mens jacket', 'mens clothing', 'ugly christmas sweater mens'],
    excludeIfContains: ['baby', 'womens', 'women', 'ladies', 'dress']
  },
  
  'womens-fashion': {
    primary: ['womens', 'women', 'ladies', 'lady', 'female'],
    secondary: ['skirt', 'blouse', 'gown'],
    phrases: [
      'womens dress', 'ladies dress', 'women dress', 'dress women', 'womens clothing', 
      'sweater dress', 'vest dress', 'knit dress', 'summer dress women', 'shirt women dress',
      'lace dress women', 'floral dress women', 'long dress women', 'tight dress women',
      'plaid dress women', 'bodycon dress', 'wedding dress', 'beach long dress', 
      'shoulder floral dress', 'commuter dress women', 'bag hip dress women', 
      'printed v-neck dress', 'shoulder women dress', 'midi pencil dress',
      'banquet evening dress', 'princess slim dress', 'hollow lace shirt womens',
      'yoga track pants womens', 'long sleeve crop', 'striped blouse shirt',
      'pockets trousers womens', 'v-neck printed womens', 'colorful striped blouse',
      'women lace sling', 'lace sling lace dress', 'sleeveless bodycon', 'sleevless flowers lace',
      'bohemian floral dress', 'one-shoulder floral', 'single-breasted shirt women',
      'sexy one shoulder women', 'printed office midi', 'ugly christmas sweater womens',
      'vacation santa elf womens'
    ],
    excludeIfContains: ['baby', 'infant', 'mens', 'men']
  },

  'kids-fashion': {
    primary: ['kids', 'children', 'boys', 'girls'],
    secondary: ['school', 'playground'],
    phrases: ['kids clothing', 'boys clothing'],
    excludeIfContains: ['baby', 'womens', 'mens']
  },

  'shoes': {
    primary: ['shoes', 'sneakers', 'boots', 'footwear', 'sandals', 'heels'],
    secondary: ['running', 'walking'],
    phrases: ['running shoes', 'sports shoes', 'leisure shoes'],
    excludeIfContains: ['baby', 'kitchen', 'women', 'womens', 'dress', 'clothing', 'sweater', 'shirt']
  },
  
  'bags': {
    primary: ['backpack', 'handbag', 'purse', 'wallet', 'luggage', 'clutch'],
    secondary: ['shoulder', 'crossbody', 'tote'],
    phrases: ['shoulder bag', 'travel bag', 'evening bag', 'clutch bag', 'banquet bag'],
    excludeIfContains: ['baby', 'power bank', 'battery', 'women dress', 'printed v-neck dress']
  },
  
  'jewelry': {
    primary: ['jewelry', 'necklace', 'bracelet', 'ring', 'earring', 'pendant'],
    secondary: ['gold', 'silver', 'diamond'],
    phrases: ['gold necklace', 'silver ring'],
    excludeIfContains: ['baby', 'charger', 'cable', 'usb', 'android', 'women', 'womens', 'dress', 'clothing', 'lace dress', '3pcs womens']
  },
  
  'watches': {
    primary: ['watch', 'smartwatch', 'wristwatch'],
    secondary: ['digital', 'analog'],
    phrases: ['smart watch', 'fitness watch'],
    excludeIfContains: ['baby']
  },
  
  'beauty': {
    primary: ['makeup', 'cosmetic', 'beauty', 'lipstick', 'mascara'],
    secondary: ['foundation', 'eyeshadow'],
    phrases: ['makeup brush', 'beauty blender'],
    excludeIfContains: ['baby', 'bag', 'women', 'dress']
  },
  
  'skincare': {
    primary: ['skincare', 'serum', 'moisturizer', 'cleanser'],
    secondary: ['facial', 'anti-aging'],
    phrases: ['face cream', 'anti aging', 'facial serum'],
    excludeIfContains: ['baby']
  },
  
  'kitchen': {
    primary: ['kitchen', 'cookware', 'utensil'],
    secondary: ['pan', 'pot', 'storage box'],
    phrases: ['kitchen knife', 'kitchen cloth', 'knife and fork', 'kitchen shelf'],
    excludeIfContains: ['baby', 'bedding', 'android', 'women', 'womens', 'dress', 'sleeveless']
  },
  
  'furniture': {
    primary: ['furniture', 'chair', 'table', 'sofa', 'desk'],
    secondary: ['wooden', 'metal'],
    phrases: ['office chair', 'dining table'],
    excludeIfContains: ['android', 'usb', 'mobile', 'projector', 'bedding', 'duvet', 'women', 'dress']
  },
  
  'decor': {
    primary: ['decor', 'decoration', 'lamp', 'vase', 'candle'],
    secondary: ['wall', 'home'],
    phrases: ['home decor', 'wall decor'],
    excludeIfContains: ['baby', 'android', 'women', 'dress', 'clothing']
  },
  
  'bedding': {
    primary: ['bedding', 'duvet', 'comforter', 'bedsheet', 'quilt cover'],
    secondary: ['quilt', 'brushed', 'printing', 'reactive', 'imitation silk'],
    phrases: [
      'bed sheet', 'duvet cover', 'bedding set', 'brushed bedding', '3d printing bedding',
      'cotton bedding', 'bedding quilt', 'printing bedding', '3-piece bedding', '4-piece bedding',
      'reactive printing bedding', 'imitation silk bedding', 'underwater world bedding',
      'printing and dyeing bedding', 'hotel bedding', 'four-piece bedding', 'three-piece bedding'
    ],
    excludeIfContains: ['android', 'women', 'dress']
  },
  
  'home-garden': {
    primary: ['garden', 'plant', 'outdoor', 'patio'],
    secondary: ['pot', 'soil'],
    phrases: ['garden tools', 'plant pot'],
    excludeIfContains: ['baby']
  },
  
  'pets': {
    primary: ['pet', 'dog', 'cat', 'puppy', 'kitten'],
    secondary: ['collar', 'leash'],
    phrases: ['pet toy', 'dog bed'],
    excludeIfContains: ['baby', 'women', 'womens']
  },
  
  'automotive': {
    primary: ['car', 'auto', 'vehicle', 'automotive'],
    secondary: ['dashboard', 'tire'],
    phrases: ['car charger', 'car mount', 'hands-free navigation'],
    excludeIfContains: ['baby', 'women', 'dress']
  },
  
  'baby': {
    primary: ['baby', 'infant', 'newborn', 'toddler'],
    secondary: ['bottle', 'diaper', 'stroller'],
    phrases: ['baby bottle', 'baby clothes'],
    excludeIfContains: []
  },
  
  'toys': {
    primary: ['toy', 'lego', 'doll', 'puzzle'],
    secondary: ['play', 'building'],
    phrases: ['kids toy', 'educational toy'],
    excludeIfContains: ['baby', 'kitchen', 'women', 'womens', 'dress', 'clothing']
  },
  
  'accessories': {
    primary: ['belt', 'scarf', 'hat', 'gloves', 'sunglasses'],
    secondary: ['fashion'],
    phrases: ['fashion accessory', 'winter accessories'],
    excludeIfContains: ['baby', 'cable', 'usb', 'android', 'women', 'dress', 'clothing']
  },

  'electronics': {
    primary: ['android', 'projector', 'endoscope', 'dongle', 'tv stick', 'set-top box', 'power bank', 'charging treasure'],
    secondary: ['mini', 'portable', 'wifi', 'micro', 'typec', 'dlp'],
    phrases: [
      'mini projector', 'android fan', 'web player', 'micro projector', 'wifi endoscope',
      'dlp projector', 'tv stick', 'set-top box', 'android box', 'power bank', 'charging treasure',
      'battery power bank', 'android typec', 'android mini', 'mobile power', 'phone charging power',
      'usb charging treasure', 'wireless charging treasure', 'mini power bank', 'android waterproof endoscope',
      'android tv player', 'android web player', 'battery charging treasure', 'charging treasure handle'
    ],
    excludeIfContains: ['baby', 'women', 'womens', 'dress', 'bedding']
  },

  'tools': {
    primary: ['screwdriver', 'wrench', 'hammer', 'drill'],
    secondary: ['magnetic', 'multi-function'],
    phrases: ['screwdriver set', '25-in-1 multi-function', 'magnetic screwdriver'],
    excludeIfContains: ['baby']
  },

  'protective-wear': {
    primary: ['bee protective', 'anti-bee', 'beekeeping'],
    secondary: ['thick type'],
    phrases: ['bee protective clothing', 'anti-bee clothing', 'white anti-bee'],
    excludeIfContains: ['baby']
  }
}

export function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): string {
  const combinedText = `${title || ''} ${description || ''} ${cjCategory || ''}`.toLowerCase()
  
  let bestCategory = 'general'
  let bestScore = 0
  
  // Baby priority
  const babyKeywords = ['baby', 'infant', 'newborn', 'toddler']
  if (babyKeywords.some(k => combinedText.includes(k))) {
    return 'baby'
  }
  
  // WOMENS FASHION PRIORITY - Check first with high scoring
  const womensIndicators = ['women', 'womens', 'ladies', 'lady', 'female']
  const dressIndicators = ['dress', 'skirt', 'blouse', 'gown']
  
  if (womensIndicators.some(w => combinedText.includes(w)) || 
      dressIndicators.some(d => combinedText.includes(d))) {
    
    const womensPatterns = CATEGORY_PATTERNS['womens-fashion']
    let womensScore = 0
    
    // Phrase matching (highest priority)
    for (const phrase of womensPatterns.phrases) {
      if (combinedText.includes(phrase)) {
        womensScore += 50 // Very high score for exact phrase match
        break // One match is enough
      }
    }
    
    // Primary keyword matching
    for (const keyword of womensPatterns.primary) {
      if (combinedText.includes(keyword)) {
        womensScore += 30
      }
    }
    
    // Secondary keyword matching
    for (const keyword of womensPatterns.secondary) {
      if (combinedText.includes(keyword)) {
        womensScore += 10
      }
    }
    
    // If it scores anything, it's womens fashion
    if (womensScore > 0) {
      return 'womens-fashion'
    }
  }
  
  // Check all other categories
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (category === 'baby' || category === 'womens-fashion') continue
    
    // Check exclusions
    if (patterns.excludeIfContains?.some(excluded => combinedText.includes(excluded))) {
      continue
    }
    
    let score = 0
    
    // Phrases (highest priority)
    for (const phrase of patterns.phrases) {
      if (combinedText.includes(phrase)) score += 20
    }
    
    // Primary keywords
    for (const keyword of patterns.primary) {
      if (combinedText.includes(keyword)) score += 15
    }
    
    // Secondary keywords
    for (const keyword of patterns.secondary) {
      if (combinedText.includes(keyword)) score += 5
    }
    
    // CJ category boost
    if (cjCategory) {
      const normalizedCJCat = cjCategory.toLowerCase().replace(/[^a-z\s]/g, ' ')
      const categoryName = category.replace('-', ' ')
      if (normalizedCJCat.includes(categoryName)) score += 25
    }
    
    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  }
  
  return bestScore > 0 ? bestCategory : 'general'
}
