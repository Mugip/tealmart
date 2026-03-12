// lib/productClassifier.ts
import OpenAI from 'openai'

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
})

const CATEGORIES = [
  'baby', 'shoes', 'womens-fashion', 'mens-fashion', 'kids-fashion',
  'bedding', 'kitchen', 'electronics', 'phone', 'computer', 'audio',
  'camera', 'gaming', 'sports', 'fitness', 'bags', 'jewelry', 'watches',
  'beauty', 'skincare', 'furniture', 'decor', 'home-garden', 'pets',
  'automotive', 'toys', 'accessories', 'tools', 'protective-wear'
]

// Cache to avoid re-classifying
const classificationCache = new Map<string, string>()

export async function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): Promise<string> {
  try {
    const text = `${title || ''} ${description || ''}`.trim()
    
    if (!text) return 'general'
    
    // Check cache
    const cacheKey = text.toLowerCase()
    if (classificationCache.has(cacheKey)) {
      return classificationCache.get(cacheKey)!
    }
    
    const response = await openrouter.chat.completions.create({
      model: 'meta-llama/llama-3.2-3b-instruct:free', // FREE model!
      messages: [
        {
          role: 'system',
          content: `You are a product categorizer. Classify products into ONE category from this list:
${CATEGORIES.join(', ')}

CRITICAL RULES:
- "dress" + "women/womens/ladies" = womens-fashion
- "dress" + "evening/wedding/party" = womens-fashion  
- "clothing" + "children/kids/boys/girls" = kids-fashion
- "clothing" + "baby/infant/newborn" = baby
- "clothing" + "mens/men" = mens-fashion
- "clothing" + "womens/women/ladies" = womens-fashion
- "shoes/sneakers/boots/sandals/heels" = shoes
- "bedding/duvet/sheets/comforter" = bedding
- "android/power bank/usb/charging treasure" = electronics
- "phone case/phone holder" = phone

Reply with ONLY the category name.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0,
      max_tokens: 20
    })
    
    const category = response.choices[0]?.message?.content?.trim().toLowerCase() || 'general'
    const finalCategory = CATEGORIES.includes(category) ? category : 'general'
    
    // Cache result
    classificationCache.set(cacheKey, finalCategory)
    
    return finalCategory
  } catch (error) {
    console.error('OpenRouter classification error:', error)
    return 'general'
  }
}

// Export sync version for compatibility
export function classifyProductSync(
  title?: string,
  description?: string,
  cjCategory?: string
): string {
  return 'general'
}
