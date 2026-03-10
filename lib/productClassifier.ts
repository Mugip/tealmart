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
    phrases: ['graphics card', 'usb hub', 'usb android cable', '32g android mobile computer'],
    excludeIfContains: ['baby', 'dress', 'evening dress', 'wedding dress']
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
    excludeIfContains: ['baby', 'women dress', 'womens dress', 'ladies dress', 'womens', 'women']
  },
  
  'mens-fashion': {
    primary: ['mens dress shoes', 'mens patent', 'mens fitness', 'mens clothing', 'mens gym'],
    secondary: ['jacket', 'jeans', 'hoodie'],
    phrases: ['mens shirt', 'mens jacket', 'mens clothing', 'mens dress shoes', 'mens fitness sports', 'gym wear mens', 'custom mens fitness'],
    excludeIfContains: ['baby', 'womens', 'women', 'ladies', 'dress women', 'dress ladies', 'evening dress', 'wedding dress']
  },
  
  'womens-fashion': {
    primary: ['womens clothing', 'ladies clothing', 'women clothing', 'evening dress', 'wedding dress'],
    secondary: ['skirt', 'blouse', 'gown', 'top', 'leggings', 'pants', 'trousers', 'mermaid', 'fishtail', 'sequined', 'party dress', 'clutch'],
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
      'sexy one shoulder women dress', 'printed office midi', 'ugly christmas sweater womens',
      'vacation santa elf womens', 'evening dress', 'evening evening dress', 'lace evening dress', 
      'waist evening dress', 'velvet evening dress', 'mermaid dress', 'one-shoulder evening dress', 
      'shoulder lace wedding evening dress', 'sequined evening dress', 'fishtail dress', 
      'sexy evening dress', 'v-neck sequined evening dress', 'party white evening dress', 
      'backless tight dress', 'european american evening dress', 'evening dress clutch',
      'women shirt dress', 'shirt dress women'
    ],
    excludeIfContains: ['baby', 'infant', 'mens', 'men', 'shoes', 'sandals', 'sneakers', 'heels', 'boots', 'flats', 'slippers', 'bedding', 'mink velvet']
  },

  'kids-fashion': {
    primary: ['kids', 'children', 'boys', 'girls'],
    secondary: ['school', 'playground'],
    phrases: ['kids clothing', 'boys clothing'],
    excludeIfContains: ['baby', 'womens', 'mens']
  },

  'shoes': {
    primary: ['shoes', 'sneakers', 'boots', 'footwear', 'sandals', 'heels', 'slippers'],
    secondary: ['casual', 'running', 'walking', 'sports'],
    phrases: [
      'casual shoes', 'running shoes', 'sports shoes', 'leisure shoes', 'canvas shoes',
      'women shoes', 'womens shoes', 'ladies shoes', 'women casual shoes', 'women sandal',
      'women jelly shoes', 'women sporting shoes', 'women sports sneakers', 'flat shoes women',
      'high heels women', 'women flats', 'sandals women', 'women mesh shoes', 'daddy shoes women',
      'fisherman shoes women', 'high heel women shoes', 'nude shoes women', 'single shoes women',
      'pointed stiletto women', 'loafer shoes women', 'ballet flats women', 'mens dress shoes',
      'dress shoes mens', 'men and women shoes', 'bicycle shoes men and women', 'football shoes men and women'
    ],
    excludeIfContains: ['baby', 'knife', 'fork', 'chopsticks', 'kitchen', 'dress women', 'sweater', 'clothing', 'shirt', 'blouse', 'evening', 'wedding']
  },
  
  'bags': {
    primary: ['backpack', 'handbag', 'purse', 'wallet', 'luggage'],
    secondary: ['shoulder bag', 'crossbody', 'tote'],
    phrases: ['shoulder bag', 'travel bag', 'laptop bag', 'banquet bag', 'sequin bag ladies', 'diamond-studded ladies bag'],
    excludeIfContains: ['baby', 'power bank', 'battery', 'charger', 'clutch', 'evening']
  },
  
  'jewelry': {
    primary: ['jewelry', 'necklace', 'bracelet', 'ring', 'earring', 'pendant'],
    secondary: ['gold', 'silver', 'diamond'],
    phrases: ['gold necklace', 'silver ring'],
    excludeIfContains: ['baby', 'charger', 'cable', 'usb', 'android', 'mobile', 'phone', 'women dress', 'womens clothing']
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
    phrases: ['kitchen knife', 'kitchen cloth', 'knife and fork', 'kitchen shelf', 'kitchen knife and fork chopsticks', 'creative kitchen knife and fork'],
    excludeIfContains: ['baby', 'bedding', 'android', 'women', 'womens', 'dress']
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
    excludeIfContains: ['baby', 'android', 'women', 'dress', 'clothing', 'bedding set', '3-piece bedding', '4-piece bedding', 'four sets']
  },
  
  'bedding': {
    primary: ['bedding', 'duvet', 'comforter', 'bedsheet', 'quilt cover'],
    secondary: ['quilt', 'brushed', 'printing', 'reactive', 'imitation silk', 'mink velvet', 'pug', 'customized', 'warm'],
    phrases: [
      'bed sheet', 'duvet cover', 'bedding set', 'brushed bedding', '3d printing bedding',
      'cotton bedding', 'bedding quilt', 'printing bedding', '3-piece bedding', '4-piece bedding',
      'reactive printing bedding', 'imitation silk bedding', 'underwater world bedding',
      'printing and dyeing bedding', 'hotel bedding', 'four-piece bedding', 'three-piece bedding',
      '3d digital printed bedding', 'cartoon pug bedding', 'customized bedding sets', 'mink velvet warm bedding',
      'textile bedding', 'korean mink velvet warm bedding', 'velvet bedding'
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
    excludeIfContains: ['baby', 'women', 'womens', 'kitchen']
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
    primary: ['android', 'projector', 'endoscope', 'dongle', 'tv stick', 'set-top box', 'power bank', 'charging treasure', 'flash drive'],
    secondary: ['mini', 'portable', 'wifi', 'micro', 'typec', 'dlp'],
    phrases: [
      'mini projector', 'android fan', 'web player', 'micro projector', 'wifi endoscope',
      'dlp projector', 'tv stick', 'set-top box', 'android box', 'power bank', 'charging treasure',
      'battery power bank', 'android typec', 'android mini', 'mobile power', 'phone charging power',
      'usb charging treasure', 'wireless charging treasure', 'mini power bank', 'android waterproof endoscope',
      'android tv player', 'android web player', 'battery charging treasure', 'charging treasure handle',
      'universal usb flash drive', 'android mobile computer universal'
    ],
    excludeIfContains: ['baby', 'women', 'womens', 'dress', 'bedding', 'evening', 'wedding']
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
  if (['baby', 'infant', 'newborn', 'toddler'].some(k => combinedText.includes(k))) {
    return 'baby'
  }
  
  // SHOES PRIORITY
  const shoeKeywords = ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'slippers', 'flats', 'stiletto', 'loafer']
  if (shoeKeywords.some(s => combinedText.includes(s))) {
    const shoesPatterns = CATEGORY_PATTERNS['shoes']
    let shoesScore = 0
    
    for (const phrase of shoesPatterns.phrases) {
      if (combinedText.includes(phrase)) {
        shoesScore += 50
        break
      }
    }
    
    for (const keyword of shoesPatterns.primary) {
      if (combinedText.includes(keyword)) shoesScore += 30
    }
    
    if (shoesScore > 0) {
      return 'shoes'
    }
  }
  
  // BEDDING PRIORITY - Check before womens-fashion (velvet can appear in both)
  const beddingKeywords = ['bedding', 'duvet', 'comforter', 'bedsheet', 'quilt']
  if (beddingKeywords.some(b => combinedText.includes(b))) {
    const beddingPatterns = CATEGORY_PATTERNS['bedding']
    let beddingScore = 0
    
    for (const phrase of beddingPatterns.phrases) {
      if (combinedText.includes(phrase)) {
        beddingScore += 50
        break
      }
    }
    
    for (const keyword of beddingPatterns.primary) {
      if (combinedText.includes(keyword)) beddingScore += 30
    }
    
    if (beddingScore > 0) {
      return 'bedding'
    }
  }
  
  // KITCHEN PRIORITY - Check before shoes (knife/fork can trigger shoes)
  const kitchenKeywords = ['kitchen', 'knife', 'fork', 'chopsticks', 'cookware']
  if (kitchenKeywords.some(k => combinedText.includes(k))) {
    const kitchenPatterns = CATEGORY_PATTERNS['kitchen']
    let kitchenScore = 0
    
    for (const phrase of kitchenPatterns.phrases) {
      if (combinedText.includes(phrase)) {
        kitchenScore += 50
        break
      }
    }
    
    for (const keyword of kitchenPatterns.primary) {
      if (combinedText.includes(keyword)) kitchenScore += 30
    }
    
    if (kitchenScore > 0) {
      return 'kitchen'
    }
  }
  
  // MENS FASHION PRIORITY - Check before womens
  const mensIndicators = ['mens', 'men gym', 'men fitness', 'custom mens']
  if (mensIndicators.some(m => combinedText.includes(m))) {
    const mensPatterns = CATEGORY_PATTERNS['mens-fashion']
    let mensScore = 0
    
    for (const phrase of mensPatterns.phrases) {
      if (combinedText.includes(phrase)) {
        mensScore += 50
        break
      }
    }
    
    for (const keyword of mensPatterns.primary) {
      if (combinedText.includes(keyword)) mensScore += 30
    }
    
    if (mensScore > 0) {
      return 'mens-fashion'
    }
  }
  
  // WOMENS FASHION PRIORITY
  const womensIndicators = ['women', 'womens', 'ladies', 'lady', 'female']
  const dressIndicators = ['dress', 'skirt', 'blouse', 'gown']
  const clothingIndicators = ['clothing', 'shirt', 'top', 'pants', 'trousers', 'sweater']
  
  const hasDress = dressIndicators.some(d => combinedText.includes(d))
  const hasWomens = womensIndicators.some(w => combinedText.includes(w))
  const hasClothing = clothingIndicators.some(c => combinedText.includes(c))
  
  if ((hasWomens && (hasClothing || hasDress)) || hasDress) {
    const womensPatterns = CATEGORY_PATTERNS['womens-fashion']
    let womensScore = 0
    
    for (const phrase of womensPatterns.phrases) {
      if (combinedText.includes(phrase)) {
        womensScore += 50
        break
      }
    }
    
    for (const keyword of womensPatterns.primary) {
      if (combinedText.includes(keyword)) womensScore += 30
    }
    
    for (const keyword of womensPatterns.secondary) {
      if (combinedText.includes(keyword)) womensScore += 10
    }
    
    if (womensScore > 0) {
      return 'womens-fashion'
    }
  }
  
  // Check all other categories
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (['baby', 'womens-fashion', 'shoes', 'bedding', 'kitchen', 'mens-fashion'].includes(category)) continue
    
    if (patterns.excludeIfContains?.some(excluded => combinedText.includes(excluded))) {
      continue
    }
    
    let score = 0
    
    for (const phrase of patterns.phrases) {
      if (combinedText.includes(phrase)) score += 20
    }
    
    for (const keyword of patterns.primary) {
      if (combinedText.includes(keyword)) score += 15
    }
    
    for (const keyword of patterns.secondary) {
      if (combinedText.includes(keyword)) score += 5
    }
    
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
