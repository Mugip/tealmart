// lib/productClassifier.ts
import nlp from 'compromise'

// Comprehensive category keywords with weights
const CATEGORY_PATTERNS: Record<string, { primary: string[]; secondary: string[]; phrases: string[] }> = {
  'gaming': {
    primary: ['gaming', 'gamer', 'esports', 'game', 'console', 'playstation', 'xbox', 'nintendo', 'steam'],
    secondary: ['rgb', 'mechanical keyboard', 'gaming mouse', 'headset', 'controller', 'gamepad', 'joystick'],
    phrases: ['gaming chair', 'gaming desk', 'gaming headset', 'ps5', 'ps4', 'nintendo switch']
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
    primary: ['football', 'soccer', 'basketball', 'tennis', 'volleyball', 'golf', 'baseball'],
    secondary: ['ball', 'net', 'racket', 'club', 'bat'],
    phrases: ['sports equipment', 'training gear', 'sports shoes']
  },
  
  'fitness': {
    primary: ['fitness', 'gym', 'workout', 'exercise', 'yoga', 'training'],
    secondary: ['dumbbell', 'kettlebell', 'resistance', 'mat', 'weight'],
    phrases: ['resistance band', 'yoga mat', 'gym equipment', 'fitness tracker']
  },
  
  'mens-fashion': {
    primary: ['mens', 'men', 'male', 'gentleman'],
    secondary: ['shirt', 'jacket', 'jeans', 'hoodie', 'coat', 'pants', 'suit'],
    phrases: ['mens shirt', 'mens jacket', 'mens clothing', 'mens fashion', 'mens wear']
  },
  
  'womens-fashion': {
    primary: ['womens', 'women', 'ladies', 'lady', 'female'],
    secondary: ['dress', 'skirt', 'blouse', 'top', 'leggings'],
    phrases: ['womens dress', 'ladies fashion', 'womens clothing', 'evening dress']
  },
  
  'shoes': {
    primary: ['shoes', 'sneakers', 'boots', 'footwear'],
    secondary: ['running', 'walking', 'sports', 'casual', 'formal'],
    phrases: ['running shoes', 'sports shoes', 'casual shoes', 'leather boots']
  },
  
  'bags': {
    primary: ['backpack', 'bag', 'handbag', 'purse', 'wallet', 'luggage'],
    secondary: ['shoulder', 'crossbody', 'tote', 'travel'],
    phrases: ['shoulder bag', 'travel bag', 'laptop bag', 'school bag']
  },
  
  'jewelry': {
    primary: ['jewelry', 'necklace', 'bracelet', 'ring', 'earring', 'pendant'],
    secondary: ['gold', 'silver', 'diamond', 'pearl', 'chain'],
    phrases: ['gold necklace', 'silver ring', 'diamond earring']
  },
  
  'watches': {
    primary: ['watch', 'smartwatch', 'timepiece'],
    secondary: ['digital', 'analog', 'sport', 'luxury', 'fitness'],
    phrases: ['smart watch', 'fitness watch', 'luxury watch']
  },
  
  'beauty': {
    primary: ['makeup', 'cosmetic', 'beauty'],
    secondary: ['lipstick', 'foundation', 'mascara', 'eyeshadow', 'brush'],
    phrases: ['makeup brush', 'beauty blender', 'makeup kit']
  },
  
  'skincare': {
    primary: ['skincare', 'serum', 'moisturizer', 'cleanser', 'cream'],
    secondary: ['face', 'facial', 'anti-aging', 'hydrating'],
    phrases: ['face cream', 'anti aging', 'facial serum', 'skin care']
  },
  
  'kitchen': {
    primary: ['kitchen', 'cookware', 'utensil'],
    secondary: ['knife', 'pan', 'pot', 'cutting', 'cooking'],
    phrases: ['cutting board', 'cooking tools', 'kitchen knife', 'food container']
  },
  
  'furniture': {
    primary: ['furniture', 'chair', 'table', 'sofa', 'desk', 'cabinet', 'bed'],
    secondary: ['wooden', 'metal', 'office', 'bedroom', 'living'],
    phrases: ['office chair', 'dining table', 'bed frame']
  },
  
  'decor': {
    primary: ['decor', 'decoration', 'lamp', 'light', 'vase'],
    secondary: ['wall', 'home', 'led', 'lighting'],
    phrases: ['home decor', 'wall decor', 'led lamp', 'home decoration']
  },
  
  'bedding': {
    primary: ['bedding', 'pillow', 'sheet', 'blanket', 'duvet', 'mattress'],
    secondary: ['bed', 'sleep', 'comforter'],
    phrases: ['bed sheet', 'pillow case', 'mattress topper']
  },
  
  'home-garden': {
    primary: ['garden', 'plant', 'outdoor', 'patio'],
    secondary: ['pot', 'soil', 'seed', 'tool', 'watering'],
    phrases: ['garden tools', 'plant pot', 'outdoor furniture']
  },
  
  'pets': {
    primary: ['pet', 'dog', 'cat', 'animal'],
    secondary: ['toy', 'food', 'bed', 'collar', 'leash'],
    phrases: ['pet toy', 'dog bed', 'cat food', 'pet grooming']
  },
  
  'automotive': {
    primary: ['car', 'auto', 'vehicle', 'automotive'],
    secondary: ['charger', 'mount', 'accessory', 'dashboard'],
    phrases: ['car charger', 'car mount', 'car accessory']
  },
  
  'toys': {
    primary: ['toy', 'lego', 'doll', 'puzzle', 'game'],
    secondary: ['kids', 'children', 'play', 'remote'],
    phrases: ['kids toy', 'rc car', 'remote control', 'educational toy']
  },
  
  'baby': {
    primary: ['baby', 'infant', 'newborn', 'toddler'],
    secondary: ['bottle', 'diaper', 'stroller', 'crib'],
    phrases: ['baby bottle', 'baby clothes', 'baby stroller']
  },
  
  'accessories': {
    primary: ['accessory', 'accessories', 'belt', 'scarf', 'hat', 'gloves'],
    secondary: ['fashion', 'style', 'wear'],
    phrases: ['fashion accessory', 'winter accessories']
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
  
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
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
