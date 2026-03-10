// lib/productClassifier.ts
import nlp from 'compromise'

const CATEGORY_PATTERNS: Record<string, { 
  primary: string[]
  secondary: string[]
  phrases: string[]
  excludeIfContains?: string[]
}> = {
  'gaming': {
    primary: ['gaming', 'gamer', 'esports', 'game', 'console', 'playstation', 'xbox', 'nintendo', 'steam', 'gamepad'],
    secondary: ['rgb', 'mechanical', 'controller', 'joystick', 'ipega', 'pg9167'],
    phrases: ['gaming chair', 'gaming desk', 'gaming headset', 'gaming mouse', 'gaming keyboard', 'ps5', 'ps4', 'nintendo switch', 'game controller'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'newborn']
  },
  
  'phone': {
    primary: ['phone', 'smartphone', 'iphone', 'samsung'],
    secondary: ['case', 'screen protector', 'holder', 'stand'],
    phrases: ['phone case', 'screen protector', 'phone holder', 'phone stand', 'phone mount'],
    excludeIfContains: ['baby', 'infant', 'furniture', 'chair', 'table', 'bedding', 'pillow']
  },
  
  'computer': {
    primary: ['laptop', 'computer', 'pc', 'desktop', 'macbook', 'tablet', 'wireless 4.0', 'ipega'],
    secondary: ['keyboard', 'mouse', 'monitor', 'webcam', 'ssd', 'ram', 'gpu', 'processor', 'compatible with apple'],
    phrases: ['graphics card', 'hard drive', 'usb hub', 'laptop stand', 'computer accessories', 'wireless 4.0'],
    excludeIfContains: ['baby', 'infant', 'furniture', 'bedding', 'bee', 'clothing']
  },
  
  'audio': {
    primary: ['headphones', 'earbuds', 'earphones', 'speaker', 'soundbar'],
    secondary: ['bluetooth', 'wireless', 'amplifier'],
    phrases: ['bluetooth speaker', 'wireless earbuds', 'studio headphones', 'noise cancelling'],
    excludeIfContains: ['baby', 'infant', 'furniture', 'bedding', 'projector', 'android']
  },
  
  'camera': {
    primary: ['camera', 'dslr', 'mirrorless', 'gopro', 'photography', 'camcorder', 'telescope', 'endoscope'],
    secondary: ['lens', 'tripod', 'flash', 'gimbal', 'sensor', '18x', 'zoom', 'waterproof'],
    phrases: ['camera lens', 'camera bag', 'video camera', 'action camera', 'digital camera', 'telescope zoom', 'mobile lens', 'zoom mobile', 'waterproof endoscope', '18x telescope'],
    excludeIfContains: ['baby', 'infant', 'furniture', 'bedding']
  },
  
  'sports': {
    primary: ['football', 'soccer', 'basketball', 'tennis', 'volleyball', 'golf', 'baseball', 'cycling'],
    secondary: ['ball', 'net', 'racket', 'club', 'bat', 'jersey', 'sports equipment'],
    phrases: ['sports equipment', 'training gear', 'sports shoes', 'athletic wear'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'furniture', 'bedding']
  },
  
  'fitness': {
    primary: ['fitness', 'gym', 'workout', 'exercise', 'yoga', 'training'],
    secondary: ['dumbbell', 'kettlebell', 'resistance', 'mat', 'weight', 'treadmill'],
    phrases: ['resistance band', 'yoga mat', 'gym equipment', 'fitness tracker'],
    excludeIfContains: ['baby', 'infant', 'furniture', 'bedding']
  },
  
  'mens-fashion': {
    primary: ['mens', 'men', 'male', 'gentleman'],
    secondary: ['shirt', 'jacket', 'jeans', 'hoodie', 'coat', 'pants', 'suit', 'tshirt', 'polo'],
    phrases: ['mens shirt', 'mens jacket', 'mens clothing', 'mens fashion', 'mens wear', 'mens tshirt'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'newborn', 'months old', 'bee protective']
  },
  
  'womens-fashion': {
    primary: ['womens', 'women', 'ladies', 'lady', 'female', 'evening dress', 'gown', 'clutch', 'evening bag'],
    secondary: ['dress', 'skirt', 'blouse', 'top', 'leggings', 'banquet', 'sequin', 'tassel'],
    phrases: ['womens dress', 'ladies fashion', 'womens clothing', 'evening dress', 'womens blouse', 'evening bag', 'banquet bag', 'clutch bag', 'ladies bag', 'evening dress clutch', 'sequin bag ladies'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'newborn', 'months old', 'bee protective', 'power bank', 'battery']
  },

  'kids-fashion': {
    primary: ['kids', 'children', 'boys', 'girls', 'youth', 'teen'],
    secondary: ['school', 'playground', 'age', 'years old'],
    phrases: ['kids clothing', 'boys clothing', 'girls clothing', 'children wear', 'kids fashion'],
    excludeIfContains: ['baby', 'infant', 'newborn', 'toddler', 'months old', '0-3m']
  },

  'shoes': {
    primary: ['shoes', 'sneakers', 'boots', 'footwear', 'sandals', 'heels', 'slippers'],
    secondary: ['running', 'walking', 'sports', 'casual', 'formal', 'athletic', 'leisure', 'light', 'men and women'],
    phrases: ['running shoes', 'sports shoes', 'casual shoes', 'leather boots', 'leisure shoes', 'light shoes', 'men and women leisure'],
    excludeIfContains: ['baby', 'furniture', 'bedding']
  },
  
  'bags': {
    primary: ['backpack', 'bag', 'handbag', 'purse', 'wallet', 'luggage', 'suitcase'],
    secondary: ['shoulder', 'crossbody', 'tote', 'travel', 'messenger', 'briefcase'],
    phrases: ['shoulder bag', 'travel bag', 'laptop bag', 'school bag', 'crossbody bag'],
    excludeIfContains: ['baby', 'furniture', 'bedding', 'power bank', 'battery', 'charger', 'evening', 'clutch', 'banquet', 'sequin', 'ladies']
  },
  
  'jewelry': {
    primary: ['jewelry', 'necklace', 'bracelet', 'ring', 'earring', 'pendant', 'jewellery'],
    secondary: ['gold', 'silver', 'diamond', 'pearl', 'chain', 'gemstone'],
    phrases: ['gold necklace', 'silver ring', 'diamond earring', 'pearl bracelet'],
    excludeIfContains: ['baby', 'furniture', 'bedding', 'charger', 'cable', 'data', 'usb', 'android', 'mobile phone']
  },
  
  'watches': {
    primary: ['watch', 'smartwatch', 'timepiece', 'wristwatch', 'chronograph'],
    secondary: ['digital', 'analog', 'sport', 'luxury', 'fitness'],
    phrases: ['smart watch', 'fitness watch', 'luxury watch', 'digital watch', 'sports watch'],
    excludeIfContains: ['baby', 'furniture', 'bedding']
  },
  
  'beauty': {
    primary: ['makeup', 'cosmetic', 'beauty', 'lipstick', 'mascara'],
    secondary: ['foundation', 'eyeshadow', 'brush', 'palette', 'concealer'],
    phrases: ['makeup brush', 'beauty blender', 'makeup kit', 'eyeshadow palette'],
    excludeIfContains: ['baby', 'furniture', 'bedding']
  },
  
  'skincare': {
    primary: ['skincare', 'serum', 'moisturizer', 'cleanser', 'cream'],
    secondary: ['face', 'facial', 'anti-aging', 'hydrating', 'lotion'],
    phrases: ['face cream', 'anti aging', 'facial serum', 'skin care', 'face wash'],
    excludeIfContains: ['baby', 'furniture', 'bedding']
  },
  
  'kitchen': {
    primary: ['kitchen', 'cookware', 'utensil', 'bakeware', 'cooking', 'chopsticks'],
    secondary: ['pan', 'pot', 'cutting', 'spatula', 'spoon', 'bamboo fiber', 'cleaning brush'],
    phrases: ['kitchen knife', 'food container', 'mixing bowl', 'kitchen cloth', 'cleaning brush', 'bamboo fiber', 'knife and fork'],
    excludeIfContains: ['baby', 'furniture', 'bedding', 'bee', 'mobile']
  },
  
  'furniture': {
    primary: ['furniture', 'chair', 'table', 'sofa', 'desk', 'cabinet', 'couch', 'shelf'],
    secondary: ['wooden', 'metal', 'office', 'bedroom', 'living', 'dining'],
    phrases: ['office chair', 'dining table', 'bed frame', 'coffee table', 'bookshelf'],
    excludeIfContains: ['android', 'usb', 'mobile', 'projector', 'fan', 'player', 'tv stick', 'box', 'dongle', 'endoscope', 'screwdriver', 'bee clothing', 'bedding', 'duvet', 'sheet', 'pillow', 'brushed', '3d printing', 'four-piece', 'three-piece']
  },
  
  'decor': {
    primary: ['decor', 'decoration', 'lamp', 'light', 'vase', 'candle', 'ornament'],
    secondary: ['wall', 'home', 'lighting', 'art', 'frame'],
    phrases: ['home decor', 'wall decor', 'home decoration', 'wall art'],
    excludeIfContains: ['baby', 'furniture', 'bedding', 'usb', 'android']
  },
  
  'bedding': {
    primary: ['bedding', 'duvet', 'comforter', 'pillowcase', 'bedsheet'],
    secondary: ['bed', 'sleep', 'quilt', 'cotton', 'brushed', 'printing', '3d', 'four-piece', 'three-piece', 'set'],
    phrases: ['bed sheet', 'pillow case', 'mattress topper', 'duvet cover', 'bedding set', 'four-piece bedding', 'three-piece bedding', 'brushed bedding', '3d printing bedding', 'cotton bedding', 'bedding set duvet'],
    excludeIfContains: ['furniture', 'chair', 'table', 'android', 'usb']
  },
  
  'home-garden': {
    primary: ['garden', 'plant', 'outdoor', 'patio', 'gardening', 'lawn'],
    secondary: ['pot', 'soil', 'seed', 'tool', 'watering', 'planter', 'hose'],
    phrases: ['garden tools', 'plant pot', 'outdoor furniture', 'flower pot', 'garden hose'],
    excludeIfContains: ['baby', 'furniture', 'bedding']
  },
  
  'pets': {
    primary: ['pet', 'dog', 'cat', 'animal', 'puppy', 'kitten', 'fish', 'bird'],
    secondary: ['collar', 'leash', 'cage', 'aquarium', 'litter'],
    phrases: ['pet toy', 'dog bed', 'cat food', 'pet grooming', 'dog collar'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'furniture', 'bedding']
  },
  
  'automotive': {
    primary: ['car', 'auto', 'vehicle', 'automotive', 'truck', 'motorcycle', 'navigation', 'hands-free'],
    secondary: ['dashboard', 'tire', 'engine', 'display'],
    phrases: ['car charger', 'car mount', 'car accessory', 'navigation display', 'hands-free navigation', 'smartphone hands-free'],
    excludeIfContains: ['baby', 'furniture', 'bedding', 'bee']
  },
  
  'baby': {
    primary: ['baby', 'infant', 'newborn', 'toddler', 'nursery', 'maternity', 'pregnancy'],
    secondary: ['bottle', 'diaper', 'stroller', 'crib', 'onesie', 'romper', 'bib', 'pacifier'],
    phrases: ['baby bottle', 'baby clothes', 'baby stroller', 'baby carrier'],
    excludeIfContains: []
  },
  
  'toys': {
    primary: ['toy', 'lego', 'doll', 'puzzle', 'action figure', 'figurine'],
    secondary: ['play', 'remote', 'building', 'educational', 'pretend'],
    phrases: ['kids toy', 'rc car', 'remote control', 'educational toy'],
    excludeIfContains: ['baby', 'infant', 'newborn', 'furniture', 'bedding']
  },
  
  'accessories': {
    primary: ['accessory', 'accessories', 'belt', 'scarf', 'hat', 'gloves', 'sunglasses'],
    secondary: ['fashion', 'style', 'wear', 'tie'],
    phrases: ['fashion accessory', 'winter accessories', 'summer accessories'],
    excludeIfContains: ['baby', 'furniture', 'bedding', 'cable', 'charger', 'usb', 'android']
  },

  'electronics': {
    primary: ['android', 'projector', 'endoscope', 'dongle', 'tv stick', 'set-top box', 'quad core', 'dlp', 'player', 'fan', 'power bank', 'charging treasure'],
    secondary: ['mini', 'portable', 'smart', 'wireless', 'wifi', '3d', 'hd', '1200p', 'micro', 'led light', 'battery', 'typec', 'adapter', 'cable', 'data cable'],
    phrases: ['usb flash drive', 'mini projector', 'android fan', 'web player', 'micro projector', 'android mini', 'wifi endoscope', 'dlp projector', 'tv stick', 'set-top box', 'android box', 'power bank', 'charging treasure', 'battery power bank', 'android typec', 'android micro', 'android portable', 'quad core android', 'handbag back clip battery'],
    excludeIfContains: ['baby', 'furniture bedding', 'shoes', 'protective clothing']
  },

  'tools': {
    primary: ['screwdriver', 'tool', 'wrench', 'hammer', 'drill', 'pliers'],
    secondary: ['magnetic', 'multi-function', 'set', 'kit', 'repair', '25-in-1', 'wallet purse'],
    phrases: ['screwdriver set', 'tool kit', 'multi-function tool', 'magnetic screwdriver', '25-in-1 multi-function', 'multi-function magnetic screwdriver'],
    excludeIfContains: ['baby', 'furniture', 'bedding']
  },

  'protective-wear': {
    primary: ['bee protective', 'anti-bee', 'beekeeping', 'protective clothing'],
    secondary: ['thick', 'export', 'custom', 'wholesale', 'white anti'],
    phrases: ['bee protective clothing', 'anti-bee clothing', 'bee clothing', 'white anti-bee', 'beekeeping suit'],
    excludeIfContains: ['baby', 'furniture', 'bedding']
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
    
    // Phrases
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
