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
    secondary: ['rgb', 'controller', 'joystick', 'gamepad'],
    phrases: ['gaming chair', 'gaming desk', 'gaming headset', 'game controller'],
    excludeIfContains: ['baby', 'infant']
  },
  
  'phone': {
    primary: ['phone', 'smartphone', 'iphone', 'samsung'],
    secondary: ['case', 'screen protector', 'holder'],
    phrases: ['phone case', 'screen protector', 'phone holder'],
    excludeIfContains: ['baby']
  },
  
  'computer': {
    primary: ['laptop', 'computer', 'pc', 'desktop', 'macbook'],
    secondary: ['keyboard', 'mouse', 'monitor', 'webcam'],
    phrases: ['graphics card', 'usb hub', 'laptop stand'],
    excludeIfContains: ['baby', 'women', 'womens', 'ladies', 'dress']
  },
  
  'audio': {
    primary: ['headphones', 'earbuds', 'earphones', 'speaker', 'soundbar'],
    secondary: ['bluetooth', 'wireless', 'amplifier'],
    phrases: ['bluetooth speaker', 'wireless earbuds', 'wireless bluetooth headset'],
    excludeIfContains: ['baby', 'android', 'projector']
  },
  
  'camera': {
    primary: ['camera', 'dslr', 'mirrorless', 'gopro', 'telescope', 'endoscope'],
    secondary: ['lens', 'tripod', 'waterproof', '18x'],
    phrases: ['camera lens', 'telescope zoom', 'waterproof endoscope', '18x telescope'],
    excludeIfContains: ['baby']
  },
  
  'sports': {
    primary: ['football', 'soccer', 'basketball', 'tennis', 'volleyball', 'golf'],
    secondary: ['ball', 'net', 'racket', 'bat'],
    phrases: ['sports equipment', 'training gear', 'sports shoes'],
    excludeIfContains: ['baby', 'infant']
  },
  
  'fitness': {
    primary: ['fitness', 'gym', 'workout', 'exercise', 'yoga'],
    secondary: ['dumbbell', 'kettlebell', 'resistance', 'mat'],
    phrases: ['resistance band', 'yoga mat', 'gym equipment'],
    excludeIfContains: ['baby']
  },
  
  'mens-fashion': {
    primary: ['mens', 'men sweater', 'men shirt', 'men jacket'],
    secondary: ['jacket', 'jeans', 'hoodie', 'coat', 'pants', 'suit'],
    phrases: ['mens shirt', 'mens jacket', 'mens clothing', 'mens fashion', 'ugly christmas sweater', 'christmas sweater mens'],
    excludeIfContains: ['baby', 'womens', 'women', 'ladies', 'lady', 'female', 'dress', 'skirt']
  },
  
  'womens-fashion': {
    primary: ['womens', 'women', 'ladies', 'lady', 'female', 'women dress', 'womens dress', 'ladies dress'],
    secondary: ['skirt', 'blouse', 'gown', 'lace', 'floral', 'sleeveless', 'v-neck', 'one-shoulder', 'backless', 'bodycon', 'midi', 'pencil', 'camisole', 'sling'],
    phrases: [
      'womens dress', 'ladies dress', 'women dress', 'dress women', 'womens clothing', 'ladies fashion',
      'sweater dress', 'vest dress', 'knit dress', 'summer dress women', 'shirt women dress', 'lace dress women',
      'floral dress women', 'long dress women', 'tight dress women', 'plaid dress women', 'bodycon dress',
      'wedding dress', 'beach long dress', 'shoulder floral dress', 'commuter dress women', 'shirt women dress',
      'bag hip dress women', 'printed v-neck dress', 'lace dress women', 'shoulder women dress', 'midi pencil dress',
      'office dress', 'banquet evening dress', 'princess slim dress', 'hollow lace shirt womens', 'yoga track pants womens',
      'long sleeve crop', 'striped blouse shirt', 'pockets trousers womens', 'v-neck printed womens', 'colorful striped blouse'
    ],
    excludeIfContains: ['baby', 'infant', 'mens', 'men', 'male']
  },

  'kids-fashion': {
    primary: ['kids', 'children', 'boys', 'girls', 'youth'],
    secondary: ['school', 'playground'],
    phrases: ['kids clothing', 'boys clothing', 'girls clothing'],
    excludeIfContains: ['baby', 'infant', 'womens', 'mens']
  },

  'shoes': {
    primary: ['shoes', 'sneakers', 'boots', 'footwear', 'sandals', 'heels'],
    secondary: ['running', 'walking', 'casual', 'leisure', 'light'],
    phrases: ['running shoes', 'sports shoes', 'leisure shoes', 'light shoes'],
    excludeIfContains: ['baby', 'kitchen']
  },
  
  'bags': {
    primary: ['backpack', 'handbag', 'purse', 'wallet', 'luggage', 'clutch', 'evening bag'],
    secondary: ['shoulder', 'crossbody', 'tote', 'banquet', 'sequin', 'diamond-studded'],
    phrases: ['shoulder bag', 'travel bag', 'laptop bag', 'evening bag', 'clutch bag', 'banquet bag', 'ladies banquet bag', 'sequin bag ladies', 'diamond-studded ladies'],
    excludeIfContains: ['baby', 'power bank', 'battery', 'charger']
  },
  
  'jewelry': {
    primary: ['jewelry', 'necklace', 'bracelet', 'ring', 'earring', 'pendant'],
    secondary: ['gold', 'silver', 'diamond', 'pearl'],
    phrases: ['gold necklace', 'silver ring', 'diamond earring'],
    excludeIfContains: ['baby', 'charger', 'cable', 'usb', 'android', 'mobile']
  },
  
  'watches': {
    primary: ['watch', 'smartwatch', 'wristwatch'],
    secondary: ['digital', 'analog', 'luxury'],
    phrases: ['smart watch', 'fitness watch'],
    excludeIfContains: ['baby']
  },
  
  'beauty': {
    primary: ['makeup', 'cosmetic', 'beauty', 'lipstick', 'mascara'],
    secondary: ['foundation', 'eyeshadow', 'brush'],
    phrases: ['makeup brush', 'beauty blender', 'makeup kit'],
    excludeIfContains: ['baby', 'bag', 'evening']
  },
  
  'skincare': {
    primary: ['skincare', 'serum', 'moisturizer', 'cleanser', 'face cream'],
    secondary: ['facial', 'anti-aging', 'hydrating'],
    phrases: ['face cream', 'anti aging', 'facial serum', 'skin care'],
    excludeIfContains: ['baby']
  },
  
  'kitchen': {
    primary: ['kitchen', 'cookware', 'utensil', 'bakeware'],
    secondary: ['pan', 'pot', 'spatula', 'storage box', 'shelf'],
    phrases: ['kitchen knife', 'kitchen cloth', 'knife and fork', 'kitchen shelf', 'kitchen storage'],
    excludeIfContains: ['baby', 'bedding', 'android']
  },
  
  'furniture': {
    primary: ['furniture', 'chair', 'table', 'sofa', 'desk', 'cabinet'],
    secondary: ['wooden', 'metal', 'office'],
    phrases: ['office chair', 'dining table', 'coffee table'],
    excludeIfContains: ['android', 'usb', 'mobile', 'projector', 'bedding', 'duvet', 'sheet', 'pillow', 'quilt', 'imitation silk', 'women', 'womens', 'dress', 'hollow']
  },
  
  'decor': {
    primary: ['decor', 'decoration', 'lamp', 'vase', 'candle', 'ornament'],
    secondary: ['wall', 'home', 'lighting'],
    phrases: ['home decor', 'wall decor', 'home decoration', 'wall art'],
    excludeIfContains: ['baby', 'android', 'bedding', 'women', 'womens', 'dress', 'clothing', 'sweater', 'shirt', 'mens']
  },
  
  'bedding': {
    primary: ['bedding', 'duvet', 'comforter', 'bedsheet', 'quilt cover'],
    secondary: ['quilt', 'cotton', 'brushed', 'printing', 'reactive', 'imitation silk', 'textile'],
    phrases: [
      'bed sheet', 'duvet cover', 'bedding set', 'brushed bedding', '3d printing bedding', 'cotton bedding',
      'bedding quilt', 'printing bedding', '3-piece bedding', '4-piece bedding', 'reactive printing bedding',
      'imitation silk bedding', 'underwater world bedding', 'printing and dyeing bedding', 'hotel bedding',
      'four-piece bedding', 'three-piece bedding', 'four sets bedding'
    ],
    excludeIfContains: ['android', 'usb', 'women', 'dress']
  },
  
  'home-garden': {
    primary: ['garden', 'plant', 'outdoor', 'patio'],
    secondary: ['pot', 'soil', 'seed'],
    phrases: ['garden tools', 'plant pot'],
    excludeIfContains: ['baby']
  },
  
  'pets': {
    primary: ['pet', 'dog', 'cat', 'puppy', 'kitten'],
    secondary: ['collar', 'leash', 'cage'],
    phrases: ['pet toy', 'dog bed', 'cat food'],
    excludeIfContains: ['baby', 'infant', 'women', 'womens']
  },
  
  'automotive': {
    primary: ['car', 'auto', 'vehicle', 'automotive'],
    secondary: ['dashboard', 'tire'],
    phrases: ['car charger', 'car mount', 'hands-free navigation'],
    excludeIfContains: ['baby', 'women', 'dress']
  },
  
  'baby': {
    primary: ['baby', 'infant', 'newborn', 'toddler'],
    secondary: ['bottle', 'diaper', 'stroller', 'crib'],
    phrases: ['baby bottle', 'baby clothes', 'baby stroller'],
    excludeIfContains: []
  },
  
  'toys': {
    primary: ['toy', 'lego', 'doll', 'puzzle'],
    secondary: ['play', 'building', 'educational'],
    phrases: ['kids toy', 'educational toy'],
    excludeIfContains: ['baby', 'kitchen']
  },
  
  'accessories': {
    primary: ['belt', 'scarf', 'hat', 'gloves', 'sunglasses'],
    secondary: ['fashion'],
    phrases: ['fashion accessory', 'winter accessories'],
    excludeIfContains: ['baby', 'cable', 'usb', 'android', 'women', 'womens', 'dress', 'clothing']
  },

  'electronics': {
    primary: ['android', 'projector', 'endoscope', 'dongle', 'tv stick', 'set-top box', 'power bank', 'charging treasure'],
    secondary: ['mini', 'portable', 'wifi', 'hd', 'micro', 'typec', 'adapter', 'dlp', 'quad core'],
    phrases: [
      'usb flash drive', 'mini projector', 'android fan', 'web player', 'micro projector', 'android mini',
      'wifi endoscope', 'dlp projector', 'tv stick', 'set-top box', 'android box', 'power bank', 'charging treasure',
      'battery power bank', 'android typec', 'android micro', 'android portable', 'quad core android',
      'mobile power', 'phone charging power', 'usb charging treasure', 'wireless charging treasure',
      'large-capacity power bank', 'charging treasure handle', 'mini power bank', 'android data cable',
      'android waterproof endoscope', 'android tv player', 'android web player', 'battery charging treasure'
    ],
    excludeIfContains: ['baby', 'women', 'womens', 'dress', 'bedding sheet']
  },

  'tools': {
    primary: ['screwdriver', 'wrench', 'hammer', 'drill', 'pliers'],
    secondary: ['magnetic', 'multi-function', 'tool kit'],
    phrases: ['screwdriver set', '25-in-1 multi-function', 'magnetic screwdriver'],
    excludeIfContains: ['baby']
  },

  'protective-wear': {
    primary: ['bee protective', 'anti-bee', 'beekeeping'],
    secondary: ['thick type export'],
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
    const babyPatterns = CATEGORY_PATTERNS['baby']
    let babyScore = 0
    
    for (const keyword of babyPatterns.primary) {
      if (combinedText.includes(keyword)) babyScore += 20
    }
    for (const keyword of babyPatterns.secondary) {
      if (combinedText.includes(keyword)) babyScore += 10
    }
    
    if (babyScore > 15) return 'baby'
  }
  
  // Check all categories
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (category === 'baby') continue
    
    // Check exclusions
    if (patterns.excludeIfContains?.some(excluded => combinedText.includes(excluded))) {
      continue
    }
    
    let score = 0
    
    // Phrases first (highest priority)
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
