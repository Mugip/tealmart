// lib/productClassifier.ts
import nlp from 'compromise'

const CATEGORY_PATTERNS: Record<string, { 
  primary: string[]
  secondary: string[]
  phrases: string[]
  excludeIfContains?: string[]
}> = {
  'gaming': {
    primary: ['gaming', 'gamer', 'esports', 'game', 'console', 'playstation', 'xbox', 'nintendo', 'steam'],
    secondary: ['rgb', 'mechanical', 'controller', 'joystick', 'ipega', 'pg9167'],
    phrases: ['gaming chair', 'gaming desk', 'gaming headset', 'gaming mouse', 'gaming keyboard', 'game controller', 'mobile game peripherals', 'game joystick'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'newborn']
  },
  
  'phone': {
    primary: ['phone', 'smartphone', 'iphone', 'samsung'],
    secondary: ['case', 'screen protector', 'holder', 'stand'],
    phrases: ['phone case', 'screen protector', 'phone holder'],
    excludeIfContains: ['baby', 'infant']
  },
  
  'computer': {
    primary: ['laptop', 'computer', 'pc', 'desktop', 'macbook', 'tablet'],
    secondary: ['keyboard', 'mouse', 'monitor', 'webcam', 'ssd', 'ram', 'gpu'],
    phrases: ['graphics card', 'hard drive', 'usb hub', 'laptop stand', 'wireless 4.0 mobile', 'ipega 9167'],
    excludeIfContains: ['baby', 'infant']
  },
  
  'audio': {
    primary: ['headphones', 'earbuds', 'earphones', 'speaker', 'soundbar'],
    secondary: ['bluetooth', 'wireless', 'amplifier', 'headset'],
    phrases: ['bluetooth speaker', 'wireless earbuds', 'studio headphones', 'noise cancelling', 'bluetooth headset', 'wireless bluetooth headset'],
    excludeIfContains: ['baby', 'infant', 'android', 'projector']
  },
  
  'camera': {
    primary: ['camera', 'dslr', 'mirrorless', 'gopro', 'photography', 'camcorder', 'telescope', 'endoscope'],
    secondary: ['lens', 'tripod', 'flash', 'gimbal', 'waterproof'],
    phrases: ['camera lens', 'video camera', 'action camera', 'telescope zoom', 'mobile lens', 'waterproof endoscope', '18x telescope', 'zoom mobile lens'],
    excludeIfContains: ['baby', 'infant']
  },
  
  'sports': {
    primary: ['football', 'soccer', 'basketball', 'tennis', 'volleyball', 'golf', 'baseball', 'cycling'],
    secondary: ['ball', 'net', 'racket', 'club', 'bat', 'jersey'],
    phrases: ['sports equipment', 'training gear', 'sports shoes', 'athletic wear'],
    excludeIfContains: ['baby', 'infant', 'toddler']
  },
  
  'fitness': {
    primary: ['fitness', 'gym', 'workout', 'exercise', 'yoga', 'training'],
    secondary: ['dumbbell', 'kettlebell', 'resistance', 'mat', 'weight'],
    phrases: ['resistance band', 'yoga mat', 'gym equipment', 'fitness tracker'],
    excludeIfContains: ['baby', 'infant']
  },
  
  'mens-fashion': {
    primary: ['mens', 'men', 'male', 'gentleman'],
    secondary: ['jacket', 'jeans', 'hoodie', 'coat', 'pants', 'suit', 'polo'],
    phrases: ['mens shirt', 'mens jacket', 'mens clothing', 'mens fashion', 'mens wear'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'womens', 'women', 'ladies', 'lady', 'female', 'dress', 'skirt', 'blouse']
  },
  
  'womens-fashion': {
    primary: ['womens', 'women', 'ladies', 'lady', 'female', 'evening dress', 'gown'],
    secondary: ['dress', 'skirt', 'blouse', 'top', 'leggings', 'banquet', 'sequin', 'tassel', 'lace', 'pockets trousers', 'crop tank'],
    phrases: ['womens dress', 'ladies fashion', 'womens clothing', 'evening dress', 'women shirt dress', 'womens blouse', 'evening bag', 'ladies bag', 'women dress', 'shirt women dress', 'lace shirt womens', 'womens cl', 'yoga track pants womens', 'long sleeve crop', 'striped blouse shirt'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'mens', 'men', 'male']
  },

  'kids-fashion': {
    primary: ['kids', 'children', 'boys', 'girls', 'youth', 'teen'],
    secondary: ['school', 'playground', 'age'],
    phrases: ['kids clothing', 'boys clothing', 'girls clothing', 'children wear'],
    excludeIfContains: ['baby', 'infant', 'newborn', 'toddler', 'womens', 'ladies', 'mens']
  },

  'shoes': {
    primary: ['shoes', 'sneakers', 'boots', 'footwear', 'sandals', 'heels', 'slippers'],
    secondary: ['running', 'walking', 'sports', 'casual', 'formal', 'athletic', 'leisure', 'light'],
    phrases: ['running shoes', 'sports shoes', 'casual shoes', 'leather boots', 'leisure shoes', 'light shoes', 'men and women leisure light shoes'],
    excludeIfContains: ['baby', 'knife', 'fork', 'chopsticks', 'kitchen', 'cleaning']
  },
  
  'bags': {
    primary: ['backpack', 'bag', 'handbag', 'purse', 'wallet', 'luggage', 'suitcase'],
    secondary: ['shoulder', 'crossbody', 'tote', 'travel', 'messenger'],
    phrases: ['shoulder bag', 'travel bag', 'laptop bag', 'school bag'],
    excludeIfContains: ['baby', 'power bank', 'battery', 'charger', 'evening', 'clutch', 'banquet', 'sequin', 'ladies', 'diamond-studded']
  },
  
  'jewelry': {
    primary: ['jewelry', 'necklace', 'bracelet', 'ring', 'earring', 'pendant', 'jewellery'],
    secondary: ['gold', 'silver', 'diamond', 'pearl', 'chain'],
    phrases: ['gold necklace', 'silver ring', 'diamond earring'],
    excludeIfContains: ['baby', 'charger', 'cable', 'data', 'usb', 'android', 'mobile', 'phone']
  },
  
  'watches': {
    primary: ['watch', 'smartwatch', 'timepiece', 'wristwatch'],
    secondary: ['digital', 'analog', 'sport', 'luxury'],
    phrases: ['smart watch', 'fitness watch', 'luxury watch'],
    excludeIfContains: ['baby']
  },
  
  'beauty': {
    primary: ['makeup', 'cosmetic', 'beauty', 'lipstick', 'mascara'],
    secondary: ['foundation', 'eyeshadow', 'brush', 'palette'],
    phrases: ['makeup brush', 'beauty blender', 'makeup kit'],
    excludeIfContains: ['baby']
  },
  
  'skincare': {
    primary: ['skincare', 'serum', 'moisturizer', 'cleanser', 'cream'],
    secondary: ['face', 'facial', 'anti-aging', 'hydrating'],
    phrases: ['face cream', 'anti aging', 'facial serum', 'skin care'],
    excludeIfContains: ['baby']
  },
  
  'kitchen': {
    primary: ['kitchen', 'cookware', 'utensil', 'bakeware', 'cooking'],
    secondary: ['pan', 'pot', 'cutting', 'spatula', 'spoon', 'shelf', 'storage box', 'retractable'],
    phrases: ['kitchen knife', 'food container', 'kitchen cloth', 'knife and fork chopsticks', 'bamboo fiber kitchen', 'kitchen plastic storage', 'kitchen shelf'],
    excludeIfContains: ['baby', 'bedding', 'mobile', 'android']
  },
  
  'furniture': {
    primary: ['furniture', 'chair', 'table', 'sofa', 'desk', 'cabinet', 'couch', 'shelf'],
    secondary: ['wooden', 'metal', 'office', 'bedroom', 'living'],
    phrases: ['office chair', 'dining table', 'bed frame', 'coffee table'],
    excludeIfContains: ['android', 'usb', 'mobile', 'projector', 'fan', 'player', 'tv stick', 'box', 'dongle', 'endoscope', 'screwdriver', 'bedding', 'duvet', 'sheet', 'pillow', 'quilt', 'imitation silk', 'printing', '3d', '3-piece', '4-piece', 'four-piece', 'three-piece', 'reactive', 'underwater world', 'textile']
  },
  
  'decor': {
    primary: ['decor', 'decoration', 'lamp', 'light', 'vase', 'candle'],
    secondary: ['wall', 'home', 'lighting', 'art'],
    phrases: ['home decor', 'wall decor', 'home decoration'],
    excludeIfContains: ['baby', 'android', 'usb', 'bedding']
  },
  
  'bedding': {
    primary: ['bedding', 'duvet', 'comforter', 'pillowcase', 'bedsheet', 'quilt cover'],
    secondary: ['quilt', 'cotton', 'brushed', 'printing', 'reactive', 'imitation silk', 'underwater world', 'textile'],
    phrases: ['bed sheet', 'pillow case', 'duvet cover', 'bedding set', 'four-piece bedding', 'three-piece bedding', 'brushed bedding', '3d printing bedding', 'cotton bedding', 'bedding quilt', 'printing bedding', '3-piece bedding', '4-piece bedding', 'reactive printing bedding', 'imitation silk bedding', 'underwater world textile bedding', 'printing and dyeing bedding', 'four sets of bedding', 'hotel bedding'],
    excludeIfContains: ['android', 'usb', 'mobile']
  },
  
  'home-garden': {
    primary: ['garden', 'plant', 'outdoor', 'patio', 'gardening'],
    secondary: ['pot', 'soil', 'seed', 'tool', 'watering'],
    phrases: ['garden tools', 'plant pot', 'outdoor furniture'],
    excludeIfContains: ['baby']
  },
  
  'pets': {
    primary: ['pet', 'dog', 'cat', 'animal', 'puppy', 'kitten'],
    secondary: ['collar', 'leash', 'cage', 'aquarium'],
    phrases: ['pet toy', 'dog bed', 'cat food'],
    excludeIfContains: ['baby', 'infant', 'toddler']
  },
  
  'automotive': {
    primary: ['car', 'auto', 'vehicle', 'automotive', 'truck', 'motorcycle'],
    secondary: ['dashboard', 'tire', 'engine'],
    phrases: ['car charger', 'car mount', 'hands-free navigation', 'smartphone hands-free navigation display'],
    excludeIfContains: ['baby']
  },
  
  'baby': {
    primary: ['baby', 'infant', 'newborn', 'toddler', 'nursery', 'maternity'],
    secondary: ['bottle', 'diaper', 'stroller', 'crib', 'onesie', 'romper'],
    phrases: ['baby bottle', 'baby clothes', 'baby stroller'],
    excludeIfContains: []
  },
  
  'toys': {
    primary: ['toy', 'lego', 'doll', 'puzzle', 'action figure'],
    secondary: ['play', 'remote', 'building', 'educational'],
    phrases: ['kids toy', 'rc car', 'remote control', 'educational toy'],
    excludeIfContains: ['baby', 'infant', 'kitchen', 'storage']
  },
  
  'accessories': {
    primary: ['accessory', 'accessories', 'belt', 'scarf', 'hat', 'gloves', 'sunglasses'],
    secondary: ['fashion', 'style', 'wear'],
    phrases: ['fashion accessory', 'winter accessories'],
    excludeIfContains: ['baby', 'cable', 'charger', 'usb', 'android', 'data']
  },

  'electronics': {
    primary: ['android', 'projector', 'endoscope', 'dongle', 'tv stick', 'set-top box', 'power bank', 'charging treasure'],
    secondary: ['mini', 'portable', 'smart', 'wireless', 'wifi', '3d', 'hd', 'micro', 'led light', 'battery', 'typec', 'adapter', 'dlp', 'quad core'],
    phrases: ['usb flash drive', 'mini projector', 'android fan', 'web player', 'micro projector', 'android mini', 'wifi endoscope', 'dlp projector', 'tv stick', 'set-top box', 'android box', 'power bank', 'charging treasure', 'battery power bank', 'android typec', 'android micro', 'android portable', 'quad core android', 'handbag back clip battery', 'mobile power', 'phone charging power', 'usb charging treasure', 'wireless charging treasure', 'large-capacity power bank', 'charging treasure handle', 'mini power bank', 'android data cable', 'android waterproof endoscope', 'android tv player', 'android web player', 'mini microphone jack'],
    excludeIfContains: ['baby', 'shoes', 'protective clothing', 'womens', 'ladies', 'dress', 'bedding sheet', 'bedding quilt']
  },

  'tools': {
    primary: ['screwdriver', 'tool', 'wrench', 'hammer', 'drill'],
    secondary: ['magnetic', 'multi-function', 'set', 'kit', 'repair', '25-in-1'],
    phrases: ['screwdriver set', 'tool kit', 'magnetic screwdriver', '25-in-1 multi-function magnetic screwdriver', 'multi-function magnetic screwdriver set wallet purse'],
    excludeIfContains: ['baby']
  },

  'protective-wear': {
    primary: ['bee protective', 'anti-bee', 'beekeeping'],
    secondary: ['thick', 'export', 'custom', 'wholesale'],
    phrases: ['bee protective clothing', 'anti-bee clothing', 'white anti-bee clothing'],
    excludeIfContains: ['baby']
  }
}

export function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): string {
  const combinedText = `${title || ''} ${description || ''} ${cjCategory || ''}`.toLowerCase()
  
  const doc = nlp(combinedText)
  
  let bestCategory = 'general'
  let bestScore = 0
  
  // Baby priority
  const babyKeywords = ['baby', 'infant', 'newborn', 'toddler', 'onesie', 'romper']
  if (babyKeywords.some(k => combinedText.includes(k))) {
    const babyPatterns = CATEGORY_PATTERNS['baby']
    let babyScore = 0
    
    for (const keyword of babyPatterns.primary) {
      if (combinedText.includes(keyword)) babyScore += 20
    }
    for (const keyword of babyPatterns.secondary) {
      if (combinedText.includes(keyword)) babyScore += 10
    }
    for (const phrase of babyPatterns.phrases) {
      if (combinedText.includes(phrase)) babyScore += 25
    }
    
    if (babyScore > 15) return 'baby'
  }
  
  // Check all categories
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (category === 'baby') continue
    
    // Check exclusions
    if (patterns.excludeIfContains) {
      const hasExcludedWord = patterns.excludeIfContains.some(
        excluded => combinedText.includes(excluded)
      )
      if (hasExcludedWord) continue
    }
    
    let score = 0
    
    // Primary keywords
    for (const keyword of patterns.primary) {
      if (combinedText.includes(keyword)) score += 10
    }
    
    // Secondary keywords
    for (const keyword of patterns.secondary) {
      if (combinedText.includes(keyword)) score += 5
    }
    
    // Phrases (highest priority)
    for (const phrase of patterns.phrases) {
      if (combinedText.includes(phrase)) score += 15
    }
    
    // CJ category boost
    if (cjCategory) {
      const normalizedCJCat = cjCategory.toLowerCase().replace(/[^a-z\s]/g, ' ')
      const categoryName = category.replace('-', ' ')
      if (normalizedCJCat.includes(categoryName)) score += 20
    }
    
    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  }
  
  return bestScore > 0 ? bestCategory : 'general'
}
