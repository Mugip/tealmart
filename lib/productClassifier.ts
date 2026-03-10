// lib/productClassifier.ts
import nlp from 'compromise'

// Comprehensive category keywords with weights
const CATEGORY_PATTERNS: Record<string, { 
  primary: string[]
  secondary: string[]
  phrases: string[]
  excludeIfContains?: string[] // NEW: Exclude if these words are present
}> = {
  'gaming': {
    primary: ['gaming', 'gamer', 'esports', 'game', 'console', 'playstation', 'xbox', 'nintendo', 'steam'],
    secondary: ['rgb', 'mechanical', 'controller', 'gamepad', 'joystick'],
    phrases: ['gaming chair', 'gaming desk', 'gaming headset', 'gaming mouse', 'gaming keyboard', 'ps5', 'ps4', 'nintendo switch'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'newborn']
  },
  
  'phone': {
    primary: ['phone', 'smartphone', 'iphone', 'android', 'mobile', 'cellphone'],
    secondary: ['case', 'screen protector', 'charger', 'holder', 'stand'],
    phrases: ['phone case', 'screen protector', 'phone holder', 'mobile charger', 'wireless charger']
  },
  
  'computer': {
    primary: ['laptop', 'computer', 'pc', 'desktop', 'macbook'],
    secondary: ['keyboard', 'mouse', 'monitor', 'webcam', 'ssd', 'ram', 'gpu'],
    phrases: ['graphics card', 'hard drive', 'usb hub', 'laptop stand']
  },
  
  'audio': {
    primary: ['headphones', 'earbuds', 'earphones', 'speaker', 'audio'],
    secondary: ['bluetooth', 'wireless', 'microphone', 'soundbar'],
    phrases: ['bluetooth speaker', 'wireless earbuds', 'studio headphones', 'noise cancelling']
  },
  
  'camera': {
    primary: ['camera', 'dslr', 'mirrorless', 'gopro', 'photography'],
    secondary: ['lens', 'tripod', 'flash', 'gimbal'],
    phrases: ['camera lens', 'camera bag', 'video camera', 'action camera']
  },
  
  'sports': {
    primary: ['football', 'soccer', 'basketball', 'tennis', 'volleyball', 'golf', 'baseball', 'cycling'],
    secondary: ['ball', 'net', 'racket', 'club', 'bat', 'jersey', 'sports equipment'],
    phrases: ['sports equipment', 'training gear', 'sports shoes', 'athletic wear'],
    excludeIfContains: ['baby', 'infant', 'toddler']
  },
  
  'fitness': {
    primary: ['fitness', 'gym', 'workout', 'exercise', 'yoga', 'training'],
    secondary: ['dumbbell', 'kettlebell', 'resistance', 'mat', 'weight'],
    phrases: ['resistance band', 'yoga mat', 'gym equipment', 'fitness tracker']
  },
  
  'mens-fashion': {
    primary: ['mens', 'men', 'male', 'gentleman'],
    secondary: ['shirt', 'jacket', 'jeans', 'hoodie', 'coat', 'pants', 'suit', 'tshirt', 'polo'],
    phrases: ['mens shirt', 'mens jacket', 'mens clothing', 'mens fashion', 'mens wear', 'mens tshirt'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'newborn', 'months old']  // Removed 'boys'
  },
  
  'womens-fashion': {
    primary: ['womens', 'women', 'ladies', 'lady', 'female'],
    secondary: ['dress', 'skirt', 'blouse', 'top', 'leggings', 'gown'],
    phrases: ['womens dress', 'ladies fashion', 'womens clothing', 'evening dress', 'womens blouse'],
    excludeIfContains: ['baby', 'infant', 'toddler', 'newborn', 'months old']  // Removed 'girls'

  },

  'kids-fashion': {
    primary: ['kids', 'children', 'boys', 'girls', 'youth', 'teen'],
    secondary: ['school', 'playground', 'age', 'years old'],
    phrases: [
     'kids clothing', 'boys clothing', 'girls clothing', 'children wear',
     'kids fashion', 'boys shirt', 'girls dress', 'youth clothing',
     'teen fashion', 'school uniform'
     ],
    excludeIfContains: ['baby', 'infant', 'newborn', 'toddler', 'months old', '0-3m', '3-6m', '6-12m']
  },

  'shoes': {
    primary: ['shoes', 'sneakers', 'boots', 'footwear', 'sandals', 'heels'],
    secondary: ['running', 'walking', 'sports', 'casual', 'formal'],
    phrases: ['running shoes', 'sports shoes', 'casual shoes', 'leather boots', 'womens shoes', 'mens shoes']
  },
  
  'bags': {
    primary: ['backpack', 'bag', 'handbag', 'purse', 'wallet', 'luggage', 'suitcase'],
    secondary: ['shoulder', 'crossbody', 'tote', 'travel', 'messenger'],
    phrases: ['shoulder bag', 'travel bag', 'laptop bag', 'school bag', 'crossbody bag']
  },
  
  'jewelry': {
    primary: ['jewelry', 'necklace', 'bracelet', 'ring', 'earring', 'pendant', 'jewellery'],
    secondary: ['gold', 'silver', 'diamond', 'pearl', 'chain'],
    phrases: ['gold necklace', 'silver ring', 'diamond earring', 'pearl bracelet']
  },
  
  'watches': {
    primary: ['watch', 'smartwatch', 'timepiece', 'wristwatch'],
    secondary: ['digital', 'analog', 'sport', 'luxury', 'fitness'],
    phrases: ['smart watch', 'fitness watch', 'luxury watch', 'digital watch']
  },
  
  'beauty': {
    primary: ['makeup', 'cosmetic', 'beauty', 'lipstick', 'mascara'],
    secondary: ['foundation', 'eyeshadow', 'brush', 'palette'],
    phrases: ['makeup brush', 'beauty blender', 'makeup kit', 'eyeshadow palette']
  },
  
  'skincare': {
    primary: ['skincare', 'serum', 'moisturizer', 'cleanser', 'cream'],
    secondary: ['face', 'facial', 'anti-aging', 'hydrating', 'lotion'],
    phrases: ['face cream', 'anti aging', 'facial serum', 'skin care', 'face wash']
  },
  
  'kitchen': {
    primary: ['kitchen', 'cookware', 'utensil', 'bakeware'],
    secondary: ['knife', 'pan', 'pot', 'cutting', 'cooking', 'spatula'],
    phrases: ['cutting board', 'cooking tools', 'kitchen knife', 'food container', 'mixing bowl']
  },
  
  'furniture': {
    primary: ['furniture', 'chair', 'table', 'sofa', 'desk', 'cabinet', 'bed', 'couch'],
    secondary: ['wooden', 'metal', 'office', 'bedroom', 'living'],
    phrases: ['office chair', 'dining table', 'bed frame', 'coffee table']
  },
  
  'decor': {
    primary: ['decor', 'decoration', 'lamp', 'light', 'vase', 'candle'],
    secondary: ['wall', 'home', 'led', 'lighting', 'art'],
    phrases: ['home decor', 'wall decor', 'led lamp', 'home decoration', 'wall art']
  },
  
  'bedding': {
    primary: ['bedding', 'pillow', 'sheet', 'blanket', 'duvet', 'mattress', 'comforter'],
    secondary: ['bed', 'sleep', 'bedsheet'],
    phrases: ['bed sheet', 'pillow case', 'mattress topper', 'duvet cover']
  },
  
  'home-garden': {
    primary: ['garden', 'plant', 'outdoor', 'patio', 'gardening'],
    secondary: ['pot', 'soil', 'seed', 'tool', 'watering', 'planter'],
    phrases: ['garden tools', 'plant pot', 'outdoor furniture', 'flower pot']
  },
  
  'pets': {
    primary: ['pet', 'dog', 'cat', 'animal', 'puppy', 'kitten'],
    secondary: ['collar', 'leash', 'cage', 'aquarium'],
    phrases: ['pet toy', 'dog bed', 'cat food', 'pet grooming', 'dog collar'],
    excludeIfContains: ['baby', 'infant', 'toddler'] // Prevent baby items from being classified as pet toys
  },
  
  'automotive': {
    primary: ['car', 'auto', 'vehicle', 'automotive', 'truck'],
    secondary: ['charger', 'mount', 'accessory', 'dashboard', 'tire'],
    phrases: ['car charger', 'car mount', 'car accessory', 'car cover']
  },
  
  // BABY category FIRST with high-priority keywords
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
    ]
  },
  
  // TOYS category - now explicitly excludes baby keywords
  'toys': {
    primary: ['toy', 'lego', 'doll', 'puzzle', 'action figure', 'figurine'],
    secondary: ['play', 'remote', 'building', 'educational', 'pretend'],
    phrases: [
      'kids toy', 'rc car', 'remote control', 'educational toy',
      'building blocks', 'action figures', 'board game', 'card game',
      'stuffed animal', 'plush toy'
    ],
    excludeIfContains: ['baby', 'infant', 'newborn', 'toddler', 'months old', 'onesie', 'romper', 'bottle', 'diaper']
  },
  
  'accessories': {
    primary: ['accessory', 'accessories', 'belt', 'scarf', 'hat', 'gloves', 'sunglasses'],
    secondary: ['fashion', 'style', 'wear'],
    phrases: ['fashion accessory', 'winter accessories', 'summer accessories']
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
  // Baby products should be caught before anything else
  const babyKeywords = ['baby', 'infant', 'newborn', 'toddler', 'onesie', 'romper', 'months old', 'nursery']
  const hasBabyKeyword = babyKeywords.some(keyword => combinedText.includes(keyword))
  
  if (hasBabyKeyword) {
    // Force check baby category first with higher threshold
    const babyPatterns = CATEGORY_PATTERNS['baby']
    let babyScore = 0
    
    for (const keyword of babyPatterns.primary) {
      if (doc.has(keyword)) {
        babyScore += 20 // Higher weight for baby primary keywords
      }
    }
    
    for (const keyword of babyPatterns.secondary) {
      if (doc.has(keyword)) {
        babyScore += 10
      }
    }
    
    for (const phrase of babyPatterns.phrases) {
      if (combinedText.includes(phrase)) {
        babyScore += 25 // Very high weight for baby phrases
      }
    }
    
    if (babyScore > 15) {
      return 'baby' // Return baby immediately if confidence is high
    }
  }
  
  // Now check all other categories
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    // Skip baby since we already checked it
    if (category === 'baby') continue
    
    // Check exclusions first
    if (patterns.excludeIfContains) {
      const hasExcludedWord = patterns.excludeIfContains.some(
        excluded => combinedText.includes(excluded)
      )
      if (hasExcludedWord) {
        continue // Skip this category entirely
      }
    }
    
    let score = 0
    
    // Primary keywords (highest weight)
    for (const keyword of patterns.primary) {
      if (doc.has(keyword)) {
        score += 10
      }
    }
    
    // Secondary keywords (medium weight)
    for (const keyword of patterns.secondary) {
      if (doc.has(keyword)) {
        score += 5
      }
    }
    
    // Phrases (highest weight - exact match)
    for (const phrase of patterns.phrases) {
      if (combinedText.includes(phrase)) {
        score += 15
      }
    }
    
    // Boost if CJ category matches
    if (cjCategory) {
      const normalizedCJCat = cjCategory.toLowerCase().replace(/[^a-z\s]/g, ' ')
      const categoryName = category.replace('-', ' ')
      if (normalizedCJCat.includes(categoryName)) {
        score += 20
      }
    }
    
    // Update best match
    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  }
  
  return bestScore > 5 ? bestCategory : 'general'
}
