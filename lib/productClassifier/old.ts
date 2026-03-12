// lib/productClassifier.ts
import nlp from 'compromise'

interface CategoryPattern {
  match: string[]
  with?: string[]
  without?: string[]
  score: number
}

interface CategoryRule {
  required?: string[]
  keywords?: string[]
  phrases?: string[]
  patterns?: CategoryPattern[]
  exclude?: string[]
  weight: number
  minScore?: number // NEW: minimum score threshold
}

const CATEGORY_RULES: Record<string, CategoryRule> = {
  'baby': {
    required: ['baby', 'infant', 'newborn', 'toddler', 'nursery', 'maternity'],
    keywords: ['onesie', 'romper', 'bib', 'stroller', 'crib', 'bottle', 'diaper'],
    weight: 10,
    minScore: 50
  },

  'shoes': {
    required: ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'slippers', 'footwear', 'flats', 'stiletto'],
    exclude: ['box', 'organizer', 'rack', 'shelf', 'dress', 'clothing', 'shirt'],
    weight: 9,
    minScore: 60
  },

  'bedding': {
    required: ['bedding', 'duvet', 'comforter', 'bedsheet', 'quilt'],
    keywords: ['pillow', 'sheet', 'cover', 'blanket', 'mattress', 'velvet', 'cotton', 'brushed', '3-piece', '4-piece', 'printing', 'imitation silk'],
    weight: 9,
    minScore: 60
  },

  'kitchen': {
    required: ['kitchen', 'cookware', 'utensil', 'bakeware'],
    keywords: ['knife', 'fork', 'spoon', 'pan', 'pot', 'spatula', 'bowl', 'chopsticks'],
    phrases: ['knife and fork', 'kitchen cloth', 'kitchen knife'],
    exclude: ['shoes', 'dress', 'clothing'],
    weight: 9,
    minScore: 60
  },

  'womens-fashion': {
    patterns: [
      { match: ['dress'], with: ['women', 'womens', 'ladies', 'lady', 'female'], score: 100 },
      { match: ['dress'], without: ['men', 'mens', 'shoes', 'bedding', 'bag', 'evening bag'], score: 80 },
      { match: ['clothing', 'shirt', 'blouse', 'top'], with: ['women', 'womens', 'ladies'], score: 100 },
      { match: ['sweater', 'jacket', 'coat'], with: ['women', 'womens', 'ladies'], score: 100 },
      { match: ['evening'], with: ['dress'], score: 100 },
    ],
    keywords: ['gown', 'skirt', 'blouse', 'leggings', 'lace', 'sequin', 'bodycon', 'mermaid', 'fishtail', 'sling', 'camisole', 'pencil', 'midi'],
    exclude: ['shoes', 'sandals', 'boots', 'sneakers', 'bedding', 'bag', 'cycling', 'bike', 'men', 'mens'],
    weight: 8,
    minScore: 70
  },

  'mens-fashion': {
    patterns: [
      { match: ['mens', 'men'], with: ['shirt', 'jacket', 'clothing', 't-shirt', 'tshirt', 'coat'], score: 100 },
      { match: ['sweater', 'jacket', 'coat', 'hoodie'], with: ['mens', 'men'], without: ['womens', 'women'], score: 100 },
      { match: ['cycling', 'bike'], with: ['jersey', 'clothing'], score: 100 },
    ],
    keywords: ['suit', 'jacket', 'jeans', 'hoodie', 'pants', 'coat', 'slim', 'casual', 'fitness', 'outdoor', 'oversized', 'fleece'],
    exclude: ['women', 'womens', 'ladies', 'dress', 'evening'],
    weight: 8,
    minScore: 70
  },

  'kids-fashion': {
    required: ['kids', 'children', 'boys', 'girls', 'youth', 'teen'],
    exclude: ['baby', 'infant', 'womens', 'mens', 'adult'],
    weight: 8,
    minScore: 60
  },

  'electronics': {
    required: ['android', 'projector', 'dongle', 'power bank', 'charging treasure', 'flash drive', 'endoscope', 'tv stick', 'set-top box', 'gamepad', 'adapter', 'usb'],
    keywords: ['wifi', 'wireless', 'portable', 'mini', 'micro', 'smart', 'digital', 'led', 'battery', 'rechargeable', 'type-c', 'splitter', 'hub'],
    phrases: ['mobile power', 'web player', 'tv player', 'android box', 'dlp projector', 'power bank', 'charging treasure', 'android cable', 'usb cable'],
    exclude: ['dress', 'clothing', 'bedding', 'shirt', 'jacket'],
    weight: 7,
    minScore: 50
  },

  'phone': {
    patterns: [
      { match: ['phone', 'smartphone'], with: ['case', 'holder', 'screen', 'protector', 'pouch', 'stand'], score: 100 },
    ],
    exclude: ['projector', 'endoscope', 'power bank', 'charging treasure', 'android box', 'adapter', 'cable', 'usb', 'wireless charger'],
    weight: 7,
    minScore: 80
  },

  'computer': {
    required: ['laptop', 'computer', 'pc', 'desktop', 'macbook', 'tablet', 'notebook'],
    keywords: ['keyboard', 'mouse', 'monitor', 'webcam', 'ssd', 'ram', 'hub', 'splitter'],
    exclude: ['dress', 'clothing', 'phone', 'android', 'shoes'],
    weight: 7,
    minScore: 60
  },

  'audio': {
    required: ['headphones', 'earbuds', 'earphones', 'speaker', 'soundbar', 'microphone', 'headset', 'bluetooth headset'],
    keywords: ['bluetooth', 'wireless', 'noise cancelling'],
    exclude: ['android', 'projector', 'phone'],
    weight: 7,
    minScore: 60
  },

  'camera': {
    required: ['camera', 'dslr', 'mirrorless', 'gopro', 'telescope', 'endoscope', 'selfie stick'],
    keywords: ['lens', 'tripod', 'photography', '18x', 'zoom', 'waterproof'],
    phrases: ['waterproof endoscope', 'telescope zoom', 'mobile lens', 'selfie stick'],
    weight: 7,
    minScore: 60
  },

  'gaming': {
    required: ['gaming', 'game', 'console', 'playstation', 'xbox', 'nintendo', 'gamepad'],
    keywords: ['controller', 'joystick', 'rgb', 'wireless gamepad'],
    phrases: ['game controller', 'gaming chair', 'gamepad smartphone'],
    exclude: ['dress', 'clothing'],
    weight: 6,
    minScore: 50
  },

  'sports': {
    required: ['football', 'soccer', 'basketball', 'tennis', 'volleyball', 'golf', 'baseball', 'cycling'],
    keywords: ['ball', 'net', 'racket', 'bat', 'jersey', 'bicycle'],
    exclude: ['dress', 'clothing', 'women', 'mens'],
    weight: 6,
    minScore: 50
  },

  'fitness': {
    required: ['fitness', 'gym', 'workout', 'exercise', 'yoga'],
    keywords: ['dumbbell', 'resistance', 'mat'],
    exclude: ['dress', 'clothing', 'women', 'womens', 'mens'],
    weight: 6,
    minScore: 50
  },

  'bags': {
    required: ['bag', 'backpack', 'handbag', 'purse', 'luggage', 'wallet', 'suitcase'],
    keywords: ['shoulder', 'crossbody', 'tote', 'travel', 'banquet', 'tassel', 'diamond-studded'],
    exclude: ['power bank', 'battery', 'hip dress', 'hollow bag hip'],
    weight: 6,
    minScore: 50
  },

  'jewelry': {
    required: ['jewelry', 'necklace', 'bracelet', 'ring', 'earring', 'pendant', 'jewellery'],
    keywords: ['gold', 'silver', 'diamond'],
    exclude: ['charger', 'cable', 'usb', 'phone', 'dress', 'clothing'],
    weight: 6,
    minScore: 50
  },

  'watches': {
    required: ['watch', 'smartwatch', 'wristwatch', 'timepiece'],
    weight: 6,
    minScore: 50
  },

  'beauty': {
    required: ['makeup', 'cosmetic', 'beauty', 'lipstick', 'mascara'],
    keywords: ['foundation', 'eyeshadow'],
    exclude: ['bag', 'clutch', 'dress'],
    weight: 6,
    minScore: 50
  },

  'skincare': {
    required: ['skincare', 'serum', 'moisturizer', 'cleanser', 'face cream'],
    keywords: ['facial', 'anti-aging'],
    weight: 6,
    minScore: 50
  },

  'furniture': {
    required: ['furniture', 'chair', 'table', 'sofa', 'desk', 'cabinet', 'shelf'],
    exclude: ['android', 'usb', 'projector', 'bedding', 'dress', 'clothing', 'shirt', 'jacket', 't-shirt'],
    weight: 5,
    minScore: 40
  },

  'decor': {
    required: ['decor', 'decoration', 'lamp', 'vase', 'candle', 'ornament', 'lights', 'magic ball'],
    exclude: ['bedding', 'dress', 'clothing'],
    weight: 5,
    minScore: 40
  },

  'home-garden': {
    required: ['garden', 'plant', 'outdoor', 'patio', 'gardening'],
    keywords: ['pot', 'soil', 'seed'],
    weight: 5,
    minScore: 40
  },

  'pets': {
    required: ['pet', 'dog', 'cat', 'puppy', 'kitten', 'hamster'],
    keywords: ['collar', 'leash', 'rogue dog'],
    exclude: ['kitchen', 'dress', 'clothing', 'evening', 'ladies', 'women'],
    weight: 5,
    minScore: 40
  },

  'automotive': {
    required: ['car', 'auto', 'vehicle', 'automotive', 'carplay'],
    keywords: ['dashboard', 'navigation', 'magnetic car', 'air vent'],
    phrases: ['car phone holder', 'car navigation', 'hands-free'],
    exclude: ['dress', 'clothing', 'shirt', 'sweater', 'blouse', 'women', 'mens', 'evening'],
    weight: 5,
    minScore: 50
  },

  'toys': {
    required: ['toy', 'lego', 'doll', 'puzzle'],
    exclude: ['baby', 'kitchen'],
    weight: 5,
    minScore: 40
  },

  'accessories': {
    required: ['belt', 'scarf', 'hat', 'gloves', 'sunglasses'],
    exclude: ['cable', 'usb', 'dress', 'android'],
    weight: 5,
    minScore: 40
  },

  'tools': {
    required: ['screwdriver', 'wrench', 'hammer', 'drill', 'tool'],
    keywords: ['magnetic', 'multi-function'],
    phrases: ['25-in-1'],
    weight: 5,
    minScore: 40
  },

  'protective-wear': {
    required: ['bee protective', 'anti-bee', 'beekeeping'],
    phrases: ['protective clothing', 'bee clothing'],
    weight: 5,
    minScore: 40
  },
}

export function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): string {
  const text = `${title || ''} ${description || ''} ${cjCategory || ''}`.toLowerCase().trim()
  
  if (!text) return 'general'
  
  // Score each category
  const scores: Record<string, number> = {}
  
  for (const [category, rules] of Object.entries(CATEGORY_RULES)) {
    let score = 0
    
    // Check exclusions first
    if (rules.exclude) {
      const hasExcluded = rules.exclude.some(term => text.includes(term))
      if (hasExcluded) continue
    }
    
    // Check required keywords (MUST have at least one)
    if (rules.required) {
      const hasRequired = rules.required.some(term => text.includes(term))
      if (!hasRequired) continue // Skip category if no required term
      
      // Add base score for having required term
      score += rules.weight * 10
    }
    
    // Check pattern matching
    if (rules.patterns) {
      for (const pattern of rules.patterns) {
        const hasMatch = pattern.match.some(term => text.includes(term))
        
        if (hasMatch) {
          if (pattern.with) {
            const hasWithTerm = pattern.with.some(term => text.includes(term))
            if (hasWithTerm) score += pattern.score
          }
          
          if (pattern.without) {
            const hasWithoutTerm = pattern.without.some(term => text.includes(term))
            if (!hasWithoutTerm) score += pattern.score
          }
          
          if (!pattern.with && !pattern.without) {
            score += pattern.score
          }
        }
      }
    }
    
    // Check additional keywords
    if (rules.keywords) {
      const keywordMatches = rules.keywords.filter(kw => text.includes(kw)).length
      score += keywordMatches * 5
    }
    
    // Check phrases
    if (rules.phrases) {
      const phraseMatches = rules.phrases.filter(phrase => text.includes(phrase)).length
      score += phraseMatches * 15
    }
    
    // Check minimum score threshold
    if (rules.minScore && score < rules.minScore) {
      continue // Skip if below minimum
    }
    
    if (score > 0) {
      scores[category] = score
    }
  }
  
  // Find best category
  const entries = Object.entries(scores)
  if (entries.length === 0) return 'general'
  
  entries.sort((a, b) => b[1] - a[1])
  
  return entries[0][0]
}
