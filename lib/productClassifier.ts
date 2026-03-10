// lib/productClassifier.ts
import nlp from 'compromise'

// Comprehensive category keywords with weights
const CATEGORY_PATTERNS: Record<string, { 
  primary: string[]
  secondary: string[]
  phrases: string[]
  excludeIfContains?: string[]
}> = {
  'gaming': {
    primary: ['gaming', 'gamer', 'esports', 'game', 'console', 'playstation', 'xbox', 'nintendo', 'steam'],
    secondary: ['rgb', 'mechanical', 'controller', 'gamepad', 'joystick'],
    phrases: ['gaming chair', 'gaming desk', 'gaming headset', 'gaming mouse', 'gaming keyboard', 'ps5', 'ps4', 'nintendo switch'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'newborn', 'usb', 'flash drive', 'screwdriver', 'projector', 'bedding', 'bee']
  },
  
  'phone': {
    primary: ['phone', 'smartphone', 'iphone', 'android', 'mobile', 'cellphone'],
    secondary: ['case', 'screen protector', 'charger', 'holder', 'stand', 'usb', 'cable'],
    phrases: ['phone case', 'screen protector', 'phone holder', 'mobile charger', 'wireless charger', 'usb cable', 'mobile phone'],
    excludeIfContains: ['baby', 'infant', 'furniture', 'chair', 'table', 'bedding', 'bee clothing']
  },
  
  'computer': {
    primary: ['laptop', 'computer', 'pc', 'desktop', 'macbook', 'tablet'],
    secondary: ['keyboard', 'mouse', 'monitor', 'webcam', 'ssd', 'ram', 'gpu', 'processor'],
    phrases: ['graphics card', 'hard drive', 'usb hub', 'laptop stand', 'computer accessories'],
    excludeIfContains: ['baby', 'infant', 'furniture', 'chair', 'bedding', 'bee', 'clothing']
  },
  
  'audio': {
    primary: ['headphones', 'earbuds', 'earphones', 'speaker', 'audio', 'soundbar'],
    secondary: ['bluetooth', 'wireless', 'microphone', 'soundbar', 'amplifier'],
    phrases: ['bluetooth speaker', 'wireless earbuds', 'studio headphones', 'noise cancelling'],
    excludeIfContains: ['baby', 'infant', 'furniture', 'bedding', 'usb drive', 'projector', 'bee']
  },
  
  'camera': {
    primary: ['camera', 'dslr', 'mirrorless', 'gopro', 'photography', 'camcorder'],
    secondary: ['lens', 'tripod', 'flash', 'gimbal', 'sensor'],
    phrases: ['camera lens', 'camera bag', 'video camera', 'action camera', 'digital camera'],
    excludeIfContains: ['baby', 'infant', 'furniture', 'bedding', 'usb', 'bee', 'android mobile']
  },
  
  'sports': {
    primary: ['football', 'soccer', 'basketball', 'tennis', 'volleyball', 'golf', 'baseball', 'cycling'],
    secondary: ['ball', 'net', 'racket', 'club', 'bat', 'jersey', 'sports equipment'],
    phrases: ['sports equipment', 'training gear', 'sports shoes', 'athletic wear'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'furniture', 'bedding', 'usb', 'android', 'projector']
  },
  
  'fitness': {
    primary: ['fitness', 'gym', 'workout', 'exercise', 'yoga', 'training'],
    secondary: ['dumbbell', 'kettlebell', 'resistance', 'mat', 'weight', 'treadmill'],
    phrases: ['resistance band', 'yoga mat', 'gym equipment', 'fitness tracker'],
    excludeIfContains: ['baby', 'infant', 'furniture', 'bedding', 'usb', 'android', 'bee']
  },
  
  'mens-fashion': {
    primary: ['mens', 'men', 'male', 'gentleman'],
    secondary: ['shirt', 'jacket', 'jeans', 'hoodie', 'coat', 'pants', 'suit', 'tshirt', 'polo'],
    phrases: ['mens shirt', 'mens jacket', 'mens clothing', 'mens fashion', 'mens wear', 'mens tshirt'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'newborn', 'months old', 'usb', 'android', 'projector', 'screwdriver', 'bee protective']
  },
  
  'womens-fashion': {
    primary: ['womens', 'women', 'ladies', 'lady', 'female'],
    secondary: ['dress', 'skirt', 'blouse', 'top', 'leggings', 'gown'],
    phrases: ['womens dress', 'ladies fashion', 'womens clothing', 'evening dress', 'womens blouse'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'newborn', 'months old', 'usb', 'android', 'projector', 'bee protective']
  },

  'kids-fashion': {
    primary: ['kids', 'children', 'boys', 'girls', 'youth', 'teen'],
    secondary: ['school', 'playground', 'age', 'years old'],
    phrases: [
      'kids clothing', 'boys clothing', 'girls clothing', 'children wear',
      'kids fashion', 'boys shirt', 'girls dress', 'youth clothing',
      'teen fashion', 'school uniform'
    ],
    excludeIfContains: ['baby', 'infant', 'newborn', 'toddler', 'months old', '0-3m', '3-6m', '6-12m', 'usb', 'android', 'bee protective']
  },

  'shoes': {
    primary: ['shoes', 'sneakers', 'boots', 'footwear', 'sandals', 'heels', 'slippers'],
    secondary: ['running', 'walking', 'sports', 'casual', 'formal', 'athletic'],
    phrases: ['running shoes', 'sports shoes', 'casual shoes', 'leather boots', 'womens shoes', 'mens shoes'],
    excludeIfContains: ['baby', 'usb', 'android', 'furniture', 'bedding', 'projector', 'screwdriver']
  },
  
  'bags': {
    primary: ['backpack', 'bag', 'handbag', 'purse', 'wallet', 'luggage', 'suitcase'],
    secondary: ['shoulder', 'crossbody', 'tote', 'travel', 'messenger', 'briefcase'],
    phrases: ['shoulder bag', 'travel bag', 'laptop bag', 'school bag', 'crossbody bag'],
    excludeIfContains: ['baby', 'usb', 'android', 'furniture', 'bedding', 'projector', 'bee']
  },
  
  'jewelry': {
    primary: ['jewelry', 'necklace', 'bracelet', 'ring', 'earring', 'pendant', 'jewellery'],
    secondary: ['gold', 'silver', 'diamond', 'pearl', 'chain', 'gemstone'],
    phrases: ['gold necklace', 'silver ring', 'diamond earring', 'pearl bracelet'],
    excludeIfContains: ['baby', 'usb', 'flash drive', 'android', 'furniture', 'bedding', 'projector', 'screwdriver', 'mobile phone', 'computer']
  },
  
  'watches': {
    primary: ['watch', 'smartwatch', 'timepiece', 'wristwatch', 'chronograph'],
    secondary: ['digital', 'analog', 'sport', 'luxury', 'fitness'],
    phrases: ['smart watch', 'fitness watch', 'luxury watch', 'digital watch', 'sports watch'],
    excludeIfContains: ['baby', 'usb', 'android mobile', 'furniture', 'bedding', 'projector', 'bee']
  },
  
  'beauty': {
    primary: ['makeup', 'cosmetic', 'beauty', 'lipstick', 'mascara'],
    secondary: ['foundation', 'eyeshadow', 'brush', 'palette', 'concealer'],
    phrases: ['makeup brush', 'beauty blender', 'makeup kit', 'eyeshadow palette'],
    excludeIfContains: ['baby', 'usb', 'android', 'furniture', 'bedding', 'projector', 'screwdriver', 'bee']
  },
  
  'skincare': {
    primary: ['skincare', 'serum', 'moisturizer', 'cleanser', 'cream'],
    secondary: ['face', 'facial', 'anti-aging', 'hydrating', 'lotion'],
    phrases: ['face cream', 'anti aging', 'facial serum', 'skin care', 'face wash'],
    excludeIfContains: ['baby', 'usb', 'android', 'furniture', 'bedding', 'projector', 'bee']
  },
  
  'kitchen': {
    primary: ['kitchen', 'cookware', 'utensil', 'bakeware', 'cooking'],
    secondary: ['knife', 'pan', 'pot', 'cutting', 'cooking', 'spatula', 'spoon'],
    phrases: ['cutting board', 'cooking tools', 'kitchen knife', 'food container', 'mixing bowl'],
    excludeIfContains: ['baby', 'usb', 'android', 'furniture', 'bedding', 'projector', 'bee', 'mobile']
  },
  
  'furniture': {
    primary: ['furniture', 'chair', 'table', 'sofa', 'desk', 'cabinet', 'bed', 'couch', 'shelf'],
    secondary: ['wooden', 'metal', 'office', 'bedroom', 'living', 'dining'],
    phrases: ['office chair', 'dining table', 'bed frame', 'coffee table', 'bookshelf'],
    excludeIfContains: ['usb', 'flash drive', 'android', 'mobile phone', 'projector', 'screwdriver', 'fan', 'player', 'bee clothing', 'protective clothing']
  },
  
  'decor': {
    primary: ['decor', 'decoration', 'lamp', 'light', 'vase', 'candle', 'ornament'],
    secondary: ['wall', 'home', 'led', 'lighting', 'art', 'frame'],
    phrases: ['home decor', 'wall decor', 'led lamp', 'home decoration', 'wall art'],
    excludeIfContains: ['baby', 'usb', 'android', 'projector', 'screwdriver', 'bee', 'mobile']
  },
  
  'bedding': {
    primary: ['bedding', 'pillow', 'sheet', 'blanket', 'duvet', 'mattress', 'comforter', 'pillowcase'],
    secondary: ['bed', 'sleep', 'bedsheet', 'quilt'],
    phrases: ['bed sheet', 'pillow case', 'mattress topper', 'duvet cover', 'bed linen'],
    excludeIfContains: ['usb', 'android', 'mobile', 'projector', 'screwdriver', 'bee', 'furniture', 'chair', 'table']
  },
  
  'home-garden': {
    primary: ['garden', 'plant', 'outdoor', 'patio', 'gardening', 'lawn'],
    secondary: ['pot', 'soil', 'seed', 'tool', 'watering', 'planter', 'hose'],
    phrases: ['garden tools', 'plant pot', 'outdoor furniture', 'flower pot', 'garden hose'],
    excludeIfContains: ['baby', 'usb', 'android', 'projector', 'screwdriver', 'bedding', 'bee protective']
  },
  
  'pets': {
    primary: ['pet', 'dog', 'cat', 'animal', 'puppy', 'kitten', 'fish', 'bird'],
    secondary: ['collar', 'leash', 'cage', 'aquarium', 'litter'],
    phrases: ['pet toy', 'dog bed', 'cat food', 'pet grooming', 'dog collar'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'usb', 'android', 'furniture', 'bedding', 'projector']
  },
  
  'automotive': {
    primary: ['car', 'auto', 'vehicle', 'automotive', 'truck', 'motorcycle'],
    secondary: ['charger', 'mount', 'accessory', 'dashboard', 'tire', 'engine'],
    phrases: ['car charger', 'car mount', 'car accessory', 'car cover', 'dashboard camera'],
    excludeIfContains: ['baby', 'furniture', 'bedding', 'bee', 'mobile phone android']
  },
  
  'baby': {
    primary: [
      'baby', 'infant', 'newborn', 'toddler', 
      'nursery', 'maternity', 'pregnancy'
    ],
    secondary: [
      'bottle', 'diaper', 'stroller', 'crib', 'onesie', 
      'romper', 'bib', 'pacifier', 'sippy', 'swaddle',
      'months old', '0-3m', '3-6m', '6-12m', '12-18m', '18-24m'
    ],
    phrases: [
      'baby bottle', 'baby clothes', 'baby stroller', 'baby carrier',
      'baby romper', 'baby onesie', 'baby bodysuit', 'baby dress',
      'baby outfit', 'infant clothing', 'newborn clothes', 'toddler clothes',
      'baby boy', 'baby girl', 'baby shower', 'nursing', 'maternity wear'
    ],
    excludeIfContains: ['usb', 'android', 'projector', 'screwdriver', 'flash drive']
  },
  
  'toys': {
    primary: ['toy', 'lego', 'doll', 'puzzle', 'action figure', 'figurine'],
    secondary: ['play', 'remote', 'building', 'educational', 'pretend'],
    phrases: [
      'kids toy', 'rc car', 'remote control', 'educational toy',
      'building blocks', 'action figures', 'board game', 'card game',
      'stuffed animal', 'plush toy'
    ],
    excludeIfContains: ['baby', 'infant', 'newborn', 'toddler', 'months old', 'onesie', 'romper', 'bottle', 'diaper', 'usb', 'android mobile', 'projector', 'furniture']
  },
  
  'accessories': {
    primary: ['accessory', 'accessories', 'belt', 'scarf', 'hat', 'gloves', 'sunglasses'],
    secondary: ['fashion', 'style', 'wear', 'tie'],
    phrases: ['fashion accessory', 'winter accessories', 'summer accessories'],
    excludeIfContains: ['baby', 'usb', 'android', 'furniture', 'bedding', 'projector', 'bee protective']
  },

  // NEW CATEGORIES for better classification
  'electronics': {
    primary: ['usb', 'flash drive', 'projector', 'android', 'electronic', 'gadget'],
    secondary: ['mini', 'portable', 'smart', 'digital', 'wireless'],
    phrases: ['usb flash drive', 'mini projector', 'android device', 'smart gadget', 'portable fan', 'web player', 'micro projector'],
    excludeIfContains: ['baby', 'furniture', 'bedding', 'clothing', 'bee protective', 'chair', 'table']
  },

  'tools': {
    primary: ['tool', 'screwdriver', 'wrench', 'hammer', 'drill', 'pliers'],
    secondary: ['magnetic', 'multi-function', 'set', 'kit', 'repair'],
    phrases: ['screwdriver set', 'tool kit', 'multi-function tool', 'repair tool', 'magnetic screwdriver'],
    excludeIfContains: ['baby', 'furniture', 'bedding', 'clothing', 'bee', 'android mobile']
  },

  'protective-wear': {
    primary: ['protective', 'safety', 'bee', 'beekeeper', 'beekeeping'],
    secondary: ['thick', 'export', 'custom', 'wholesale', 'anti'],
    phrases: ['bee protective clothing', 'anti-bee clothing', 'bee clothing', 'protective clothing', 'safety gear', 'beekeeping suit'],
    excludeIfContains: ['baby', 'furniture', 'bedding', 'usb', 'android', 'projector']
  }
}

export function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): string {
  const combinedText = `${title || ''} ${description || ''} ${cjCategory || ''}`.toLowerCase()
  
  // Parse with compromise
  const doc = nlp(combinedText)
  
  let bestCategory = 'general'
  let bestScore = 0
  
  // Check baby category FIRST with priority
  const babyKeywords = ['baby', 'infant', 'newborn', 'toddler', 'onesie', 'romper', 'months old', 'nursery']
  const hasBabyKeyword = babyKeywords.some(keyword => combinedText.includes(keyword))
  
  if (hasBabyKeyword) {
    const babyPatterns = CATEGORY_PATTERNS['baby']
    let babyScore = 0
    
    for (const keyword of babyPatterns.primary) {
      if (doc.has(keyword)) {
        babyScore += 20
      }
    }
    
    for (const keyword of babyPatterns.secondary) {
      if (doc.has(keyword)) {
        babyScore += 10
      }
    }
    
    for (const phrase of babyPatterns.phrases) {
      if (combinedText.includes(phrase)) {
        babyScore += 25
      }
    }
    
    if (babyScore > 15) {
      return 'baby'
    }
  }
  
  // Check all other categories
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (category === 'baby') continue
    
    // Check exclusions first
    if (patterns.excludeIfContains) {
      const hasExcludedWord = patterns.excludeIfContains.some(
        excluded => combinedText.includes(excluded)
      )
      if (hasExcludedWord) {
        continue
      }
    }
    
    let score = 0
    
    // Primary keywords
    for (const keyword of patterns.primary) {
      if (doc.has(keyword)) {
        score += 10
      }
    }
    
    // Secondary keywords
    for (const keyword of patterns.secondary) {
      if (doc.has(keyword)) {
        score += 5
      }
    }
    
    // Phrases
    for (const phrase of patterns.phrases) {
      if (combinedText.includes(phrase)) {
        score += 15
      }
    }
    
    // CJ category boost
    if (cjCategory) {
      const normalizedCJCat = cjCategory.toLowerCase().replace(/[^a-z\s]/g, ' ')
      const categoryName = category.replace('-', ' ')
      if (normalizedCJCat.includes(categoryName)) {
        score += 20
      }
    }
    
    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  }
  
  return bestScore > 5 ? bestCategory : 'general'
}
