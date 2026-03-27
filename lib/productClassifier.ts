// lib/productClassifier.ts

export const CANONICAL_CATEGORIES =[
  "Women's Clothing",
  "Men's Clothing",
  "Bags & Shoes",
  "Jewelry & Watches",
  "Health & Beauty",
  "Consumer Electronics",
  "Home & Garden",
  "Sports & Outdoors",
  "Toys, Kids & Baby",
  "Pet Supplies",
  "Automotive",
  "Tools & Hardware",
  "Office & Stationery",
  "Food & Grocery",
] as const

export type Category = (typeof CANONICAL_CATEGORIES)[number] | "General"

// EXPANDED CJ MAPPING
const CJ_MAP: Record<string, Category> = {
  "women's clothing": "Women's Clothing",
  "men's clothing": "Men's Clothing",
  "apparel": "Women's Clothing", // Defaulting generic apparel slightly to women's as it's the dominant volume
  "baby & kids": "Toys, Kids & Baby",
  "shoes": "Bags & Shoes",
  "luggage & bags": "Bags & Shoes",
  "home, garden & furniture": "Home & Garden",
  "home improvement": "Home & Garden",
  "health & beauty": "Health & Beauty",
  "beauty & health": "Health & Beauty",
  "personal care": "Health & Beauty",
  "jewelry & watches": "Jewelry & Watches",
  "consumer electronics": "Consumer Electronics",
  "cellphones & telecommunications": "Consumer Electronics",
  "computer & office": "Consumer Electronics",
  "sports & outdoors": "Sports & Outdoors",
  "toys & hobbies": "Toys, Kids & Baby",
  "pet supplies": "Pet Supplies",
  "automobiles & motorcycles": "Automotive",
  "tools & hardware": "Tools & Hardware",
  "office & school supplies": "Office & Stationery",
}

type KeywordRule = [string[], Category, number]

// EXPANDED KEYWORD DICTIONARY FOR DROPSHIPPING
const KEYWORD_RULES: KeywordRule[] = [
  [["car seat", "dash cam", "car charger", "tire", "windshield", "automotive", "car wash", "obd", "car organizer"], "Automotive", 0.9],
  [["smartphone", "earbuds", "headphone", "speaker", "smart watch", "laptop", "power bank", "usb hub", "drone", "led strip"], "Consumer Electronics", 0.85],
  [["drill", "wrench", "soldering", "multimeter", "saw blade", "pliers", "toolbox"], "Tools & Hardware", 0.85],
  [["face cream", "serum", "mascara", "shampoo", "skincare", "acne", "perfume", "trimmer", "hair dryer", "posture corrector", "blackhead"], "Health & Beauty", 0.85],
  [["yoga mat", "resistance band", "dumbbell", "cycling", "camping", "fishing", "treadmill", "tactical"], "Sports & Outdoors", 0.85],
  [["toy", "plush", "lego", "rc car", "baby monitor", "stroller", "diaper"], "Toys, Kids & Baby", 0.85],
  [["dog", "cat", "pet bed", "aquarium", "bird cage", "pet grooming", "litter"], "Pet Supplies", 0.9],
  [["necklace", "bracelet", "earring", "ring", "watch", "jewelry", "sterling"], "Jewelry & Watches", 0.85],
  [["dress", "blouse", "skirt", "lingerie", "bra", "leggings", "women's"], "Women's Clothing", 0.85],
  [["men shirt", "men polo", "men jacket", "men suit", "men hoodie", "men's"], "Men's Clothing", 0.85],
  [["backpack", "handbag", "wallet", "sneakers", "boots", "sandals", "orthopedic"], "Bags & Shoes", 0.85],
  [["pillow", "bedsheet", "rug", "lamp", "kitchen", "cutting board", "garden", "decor", "humidifier", "purifier"], "Home & Garden", 0.75],
  [["notebook", "pen", "desk organizer", "stapler", "office chair"], "Office & Stationery", 0.8],
]

function scoreByKeywords(text: string): { category: Category; confidence: number } {
  const lower = text.toLowerCase()
  let best = { category: "General" as Category, confidence: 0 }

  for (const [keywords, category, weight] of KEYWORD_RULES) {
    const hits = keywords.filter(kw => lower.includes(kw)).length
    if (hits === 0) continue

    const confidence = Math.min(weight, weight * (hits / Math.max(keywords.length * 0.1, 1)))
    if (confidence > best.confidence) {
      best = { category, confidence }
    }
  }

  return best
}

function normaliseCJCategory(cjCategory: string): Category | null {
  if (!cjCategory?.trim()) return null
  const root = cjCategory.split(/[>/]/).map(p => p.trim()).filter(Boolean)[0] ?? ""
  const key = root.toLowerCase().trim()

  if (CJ_MAP[key]) return CJ_MAP[key]
  for (const[mapKey, canonical] of Object.entries(CJ_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return canonical
  }
  return null
}

export async function classifyProduct(title?: string, description?: string, cjCategory?: string): Promise<Category> {
  const combinedText = `${title?.trim() ?? ""} ${description?.trim() ?? ""}`
  
  const keywordResult = scoreByKeywords(combinedText)
  if (keywordResult.confidence >= 0.6) return keywordResult.category

  const cjResult = normaliseCJCategory(cjCategory ?? "")
  if (keywordResult.confidence >= 0.3 && cjResult === keywordResult.category) return keywordResult.category
  if (cjResult && keywordResult.confidence < 0.3) return cjResult

  return cjResult ?? keywordResult.category ?? "General"
}

export function classifyProductSync(title?: string, description?: string, cjCategory?: string): Category {
  const combined = `${title?.trim() ?? ""} ${description?.trim() ?? ""}`
  const keywordResult = scoreByKeywords(combined)
  if (keywordResult.confidence >= 0.5) return keywordResult.category

  const cjResult = normaliseCJCategory(cjCategory ?? "")
  return cjResult ?? keywordResult.category ?? "General"
}

export function formatCategoryName(category: string): string {
  if (!category || category === "General") return "All Products"
  return category
}

export function getCategoryIcon(category: string): string {
  const lower = category.toLowerCase()
  if (lower.includes("electronics")) return "📱"
  if (lower.includes("women")) return "👗"
  if (lower.includes("men")) return "👔"
  if (lower.includes("bags") || lower.includes("shoes")) return "👜"
  if (lower.includes("jewelry") || lower.includes("watch")) return "💍"
  if (lower.includes("beauty") || lower.includes("hair")) return "💄"
  if (lower.includes("home") || lower.includes("garden")) return "🏠"
  if (lower.includes("pet")) return "🐾"
  if (lower.includes("toy") || lower.includes("kids") || lower.includes("baby")) return "🧸"
  if (lower.includes("sports") || lower.includes("outdoor")) return "⚽"
  if (lower.includes("automotive") || lower.includes("car")) return "🚗"
  if (lower.includes("tools") || lower.includes("hardware")) return "🔧"
  if (lower.includes("office") || lower.includes("stationery")) return "📎"
  if (lower.includes("food") || lower.includes("grocery")) return "🛒"
  return "🛍️"
}
