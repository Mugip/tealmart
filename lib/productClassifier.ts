// lib/productClassifier.ts
import nlp from 'compromise'

// Define category patterns with weighted keywords
const CATEGORY_RULES = {
  // Priority 1: Baby (check first)
  'baby': {
    required: ['baby', 'infant', 'newborn', 'toddler', 'nursery', 'maternity'],
    keywords: ['onesie', 'romper', 'bib', 'stroller', 'crib', 'bottle', 'diaper'],
    weight: 10
  },

  // Priority 2: Specific product types
  'shoes': {
    required: ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'slippers', 'footwear', 'flats'],
    exclude: ['box', 'organizer', 'rack', 'shelf'],
    weight: 9
  },

  'bedding': {
    required: ['bedding', 'duvet', 'comforter', 'bedsheet', 'quilt'],
    keywords: ['pillow', 'sheet', 'cover', 'blanket', 'mattress', 'velvet', 'cotton', 'brushed', '3-piece', '4-piece', 'printing'],
    weight: 9
  },

  'kitchen': {
    required: ['kitchen', 'cookware', 'utensil', 'bakeware'],
    keywords: ['knife', 'fork', 'spoon', 'pan', 'pot', 'spatula', 'bowl', 'chopsticks', 'cutting board', 'cloth'],
    phrases: ['knife and fork', 'kitchen cloth', 'kitchen knife'],
    exclude: ['shoes', 'dress'],
    weight: 9
  },

  // Priority 3: Fashion categories
  'womens-fashion': {
    patterns: [
      // Dress patterns (highest priority for womens)
      { match: ['dress'], with: ['women', 'womens', 'ladies', 'lady', 'female', 'evening', 'wedding', 'party', 'cocktail'], score: 20 },
      { match: ['dress'], without: ['men', 'mens', 'shoes', 'bedding'], score: 15 },
      // Clothing patterns
      { match: ['clothing', 'shirt', 'blouse', 'top', 'pants', 'skirt'], with: ['women', 'womens', 'ladies'], score: 20 },
      // Sweater patterns
      { match: ['sweater'], with: ['women', 'womens', 'ladies', 'ugly christmas'], score: 18 },
    ],
    keywords: ['gown', 'skirt', 'blouse', 'leggings', 'lace', 'sequin', 'bodycon', 'mermaid', 'fishtail', 'clutch'],
    exclude: ['shoes', 'sandals', 'boots', 'sneakers', 'bedding', 'mink velvet'],
    weight: 8
  },

  'mens-fashion': {
    patterns: [
      { match: ['mens', 'men'], with: ['clothing', 'shirt', 'jacket', 'fitness', 'gym'], score: 20 },
      { match: ['sweater'], with: ['mens', 'men', 'ugly christmas'], without: ['womens', 'women'], score: 18 },
    ],
    keywords: ['suit', 'jacket', 'jeans', 'hoodie', 'pants', 'coat'],
    exclude: ['women', 'womens', 'ladies', 'dress'],
    weight: 8
  },

  'kids-fashion': {
    required: ['kids', 'children', 'boys', 'girls', 'youth', 'teen'],
    exclude: ['baby', 'infant', 'womens', 'mens'],
    weight: 8
  },

  // Priority 4: Electronics & Tech
  'electronics': {
    required: ['android', 'projector', 'dongle', 'power bank', 'charging treasure', 'flash drive', 'endoscope', 'tv stick', 'set-top box'],
    keywords: ['usb', 'wifi', 'wireless', 'portable', 'mini', 'micro', 'smart', 'digital', 'led', 'battery'],
    phrases: ['mobile power', 'web player', 'tv player', 'android box', 'dlp projector'],
    exclude: ['dress', 'clothing', 'bedding'],
    weight: 7
  },

  'phone': {
    patterns: [
      { match: ['phone', 'smartphone', 'iphone', 'samsung'], with: ['case', 'holder', 'screen', 'protector'], score: 20 },
    ],
    exclude: ['projector', 'endoscope', 'power bank', 'charging', 'android box'],
    weight: 7
  },

  'computer': {
    required: ['laptop', 'computer', 'pc', 'desktop', 'macbook', 'tablet'],
    keywords: ['keyboard', 'mouse', 'monitor', 'webcam', 'ssd', 'ram'],
    exclude: ['dress', 'clothing'],
    weight: 7
  },

  'audio': {
    required: ['headphones', 'earbuds', 'earphones', 'speaker', 'soundbar', 'microphone'],
    keywords: ['bluetooth', 'wireless', 'noise cancelling'],
    exclude: ['android', 'projector'],
    weight: 7
  },

  'camera': {
    required: ['camera', 'dslr', 'mirrorless', 'gopro', 'telescope', 'endoscope'],
    keywords: ['lens', 'tripod', 'photography', '18x', 'zoom'],
    phrases: ['waterproof endoscope', 'telescope zoom', 'mobile lens'],
    weight: 7
  },

  // Priority 5: Other categories
  'gaming': {
    required: ['gaming', 'game', 'console', 'playstation', 'xbox', 'nintendo', 'gamepad'],
    keywords: ['controller', 'joystick', 'rgb'],
    exclude: ['dress', 'clothing'],
    weight: 6
  },

  'sports': {
    required: ['football', 'soccer', 'basketball', 'tennis', 'volleyball', 'golf', 'baseball', 'cycling'],
    keywords: ['ball', 'net', 'racket', 'bat'],
    exclude: ['dress', 'clothing'],
    weight: 6
  },

  'fitness': {
    required: ['fitness', 'gym', 'workout', 'exercise', 'yoga'],
    keywords: ['dumbbell', 'resistance', 'mat'],
    exclude: ['dress', 'clothing', 'women', 'womens'],
    weight: 6
  },

  'bags': {
    required: ['bag', 'backpack', 'handbag', 'purse', 'luggage', 'wallet', 'suitcase'],
    keywords: ['shoulder', 'crossbody', 'tote', 'travel'],
    exclude: ['power bank', 'battery', 'clutch', 'evening'],
    weight: 6
  },

  'jewelry': {
    required: ['jewelry', 'necklace', 'bracelet', 'ring', 'earring', 'pendant'],
    keywords: ['gold', 'silver', 'diamond'],
    exclude: ['charger', 'cable', 'usb', 'phone'],
    weight: 6
  },

  'watches': {
    required: ['watch', 'smartwatch', 'wristwatch', 'timepiece'],
    weight: 6
  },

  'beauty': {
    required: ['makeup', 'cosmetic', 'beauty', 'lipstick', 'mascara'],
    keywords: ['foundation', 'eyeshadow'],
    weight: 6
  },

  'skincare': {
    required: ['skincare', 'serum', 'moisturizer', 'cleanser', 'face cream'],
    keywords: ['facial', 'anti-aging'],
    weight: 6
  },

  'furniture': {
    required: ['furniture', 'chair', 'table', 'sofa', 'desk', 'cabinet'],
    exclude: ['android', 'usb', 'projector', 'bedding', 'dress'],
    weight: 5
  },

  'decor': {
    required: ['decor', 'decoration', 'lamp', 'vase', 'candle', 'ornament'],
    exclude: ['bedding', 'dress', 'clothing'],
    weight: 5
  },

  'home-garden': {
    required: ['garden', 'plant', 'outdoor', 'patio', 'gardening'],
    keywords: ['pot', 'soil', 'seed'],
    weight: 5
  },

  'pets': {
    required: ['pet', 'dog', 'cat', 'puppy', 'kitten'],
    keywords: ['collar', 'leash'],
    exclude: ['kitchen'],
    weight: 5
  },

  'automotive': {
    required: ['car', 'auto', 'vehicle', 'automotive'],
    keywords: ['dashboard', 'navigation'],
    weight: 5
  },

  'toys': {
    required: ['toy', 'lego', 'doll', 'puzzle'],
    exclude: ['baby', 'kitchen'],
    weight: 5
  },

  'accessories': {
    required: ['belt', 'scarf', 'hat', 'gloves', 'sunglasses'],
    exclude: ['cable', 'usb', 'dress'],
    weight: 5
  },

  'tools': {
    required: ['screwdriver', 'wrench', 'hammer', 'drill', 'tool'],
    keywords: ['magnetic', 'multi-function'],
    phrases: ['25-in-1'],
    weight: 5
  },

  'protective-wear': {
    required: ['bee protective', 'anti-bee', 'beekeeping'],
    phrases: ['protective clothing', 'bee clothing'],
    weight: 5
  },
}

export function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): string {
  const text = `${title || ''} ${description || ''} ${cjCategory || ''}`.toLowerCase().trim()
  
  if (!text) return 'general'
  
  const doc = nlp(text)
  
  // Score each category
  const scores: Record<string, number> = {}
  
  for (const [category, rules] of Object.entries(CATEGORY_RULES)) {
    let score = 0
    
    // Check exclusions first (immediate disqualification)
    if (rules.exclude) {
      const hasExcluded = rules.exclude.some(term => text.includes(term))
      if (hasExcluded) continue
    }
    
    // Check required keywords
    if (rules.required) {
      const hasRequired = rules.required.some(term => text.includes(term))
      if (hasRequired) {
        score += rules.weight * 10
      } else {
        continue // Skip if no required terms found
      }
    }
    
    // Check pattern matching (for complex rules)
    if (rules.patterns) {
      for (const pattern of rules.patterns) {
        const hasMatch = pattern.match.some(term => text.includes(term))
        
        if (hasMatch) {
          // Check "with" conditions
          if (pattern.with) {
            const hasWithTerm = pattern.with.some(term => text.includes(term))
            if (hasWithTerm) {
              score += pattern.score
            }
          }
          
          // Check "without" conditions
          if (pattern.without) {
            const hasWithoutTerm = pattern.without.some(term => text.includes(term))
            if (!hasWithoutTerm) {
              score += pattern.score
            }
          }
          
          // If no conditions, just add score
          if (!pattern.with && !pattern.without) {
            score += pattern.score
          }
        }
      }
    }
    
    // Check additional keywords
    if (rules.keywords) {
      const keywordMatches = rules.keywords.filter(kw => text.includes(kw)).length
      score += keywordMatches * 3
    }
    
    // Check phrases (higher weight)
    if (rules.phrases) {
      const phraseMatches = rules.phrases.filter(phrase => text.includes(phrase)).length
      score += phraseMatches * 8
    }
    
    // Store score
    if (score > 0) {
      scores[category] = score
    }
  }
  
  // Find best category
  const entries = Object.entries(scores)
  if (entries.length === 0) return 'general'
  
  entries.sort((a, b) => b[1] - a[1])
  
  const [bestCategory, bestScore] = entries[0]
  
  // Require minimum confidence
  if (bestScore < 5) return 'general'
  
  return bestCategory
}
