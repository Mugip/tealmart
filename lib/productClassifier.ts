// lib/productClassifier.ts
// Hybrid classifier: fast keyword matching first, Gemini AI fallback for
// low-confidence cases. Title + description are fully used, not ignored.
//
// Layer 1 — keyword scoring:  O(n) string matching, zero cost, ~5ms
// Layer 2 — Gemini Flash:     free tier 1500 req/day, called only when
//                             Layer 1 confidence < 0.6

// ── Canonical categories ──────────────────────────────────────────────────────
export const CANONICAL_CATEGORIES = [
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

// ── CJ source category → canonical (fast exact/partial match) ─────────────────
const CJ_MAP: Record<string, Category> = {
  "women's clothing":                  "Women's Clothing",
  "men's clothing":                    "Men's Clothing",
  "men clothing":                      "Men's Clothing",
  "kids clothing":                     "Toys, Kids & Baby",
  "baby & kids":                       "Toys, Kids & Baby",
  "bags & shoes":                      "Bags & Shoes",
  "bags and shoes":                    "Bags & Shoes",
  "shoes":                             "Bags & Shoes",
  "luggage & bags":                    "Bags & Shoes",
  "home, garden & furniture":          "Home & Garden",
  "home & garden":                     "Home & Garden",
  "home garden & furniture":           "Home & Garden",
  "home,garden & furniture":           "Home & Garden",
  "garden & outdoor":                  "Home & Garden",
  "furniture":                         "Home & Garden",
  "health, beauty & hair":             "Health & Beauty",
  "health & beauty":                   "Health & Beauty",
  "beauty & health":                   "Health & Beauty",
  "jewelry & watches":                 "Jewelry & Watches",
  "jewellery & watches":               "Jewelry & Watches",
  "consumer electronics":              "Consumer Electronics",
  "electronics":                       "Consumer Electronics",
  "phones & telecommunications":      "Consumer Electronics",
  "computer & office":                 "Consumer Electronics",
  "sports & outdoors":                 "Sports & Outdoors",
  "sports & entertainment":            "Sports & Outdoors",
  "outdoor fun & sports":              "Sports & Outdoors",
  "toys & hobbies":                    "Toys, Kids & Baby",
  "toys, kids & babies":               "Toys, Kids & Baby",
  "mother & kids":                     "Toys, Kids & Baby",
  "baby & maternity":                  "Toys, Kids & Baby",
  "pet supplies":                      "Pet Supplies",
  "pets":                              "Pet Supplies",
  "automobiles & motorcycles":         "Automotive",
  "automotive":                        "Automotive",
  "car & motorbike":                   "Automotive",
  "tools & home improvement":          "Tools & Hardware",
  "tools & hardware":                  "Tools & Hardware",
  "hardware":                          "Tools & Hardware",
  "office & school supplies":          "Office & Stationery",
  "stationery":                        "Office & Stationery",
  "food":                              "Food & Grocery",
  "food & grocery":                    "Food & Grocery",
  "grocery":                           "Food & Grocery",
}

// ── Title/description keyword rules ──────────────────────────────────────────
// Each entry is [keywords[], category, weight]
// Higher weight = stronger signal. Checked in order; first match above
// confidence threshold wins.
type KeywordRule = [string[], Category, number]

const KEYWORD_RULES: KeywordRule[] = [
  // ── Automotive (specific car-part terms that CJ misfiles into Home & Garden)
  [["car seat", "car cover", "car mat", "car floor", "steering wheel cover",
    "car organizer", "car phone mount", "car charger", "dash cam", "dashcam",
    "windshield", "tire", "tyre", "bumper", "headlight", "tail light",
    "motorcycle", "motorbike", "automotive", "exhaust", "engine oil",
    "car wash", "car cleaning", "wiper blade", "obd", "car air freshener",
    "vehicle", "trunk organizer", "car vacuum"], "Automotive", 0.9],

  // ── Electronics
  [["smartphone", "phone case", "earbuds", "earphone", "headphone",
    "bluetooth speaker", "smart watch", "smartwatch", "tablet", "laptop",
    "keyboard", "mouse", "usb hub", "power bank", "charging cable",
    "screen protector", "led strip", "smart bulb", "router", "webcam",
    "gaming controller", "drone", "fpv", "3d printer", "raspberry pi",
    "arduino", "microcontroller"], "Consumer Electronics", 0.85],

  // ── Tools & Hardware
  [["drill bit", "screwdriver", "wrench", "socket set", "power tool",
    "soldering", "multimeter", "level tool", "saw blade", "sandpaper",
    "cable tie", "heat shrink", "wire connector", "junction box",
    "pliers", "hex key", "allen key", "torque", "workbench",
    "toolbox", "extension cord", "electrical tape"], "Tools & Hardware", 0.85],

  // ── Health & Beauty
  [["face cream", "moisturizer", "serum", "sunscreen", "mascara",
    "lipstick", "foundation", "concealer", "eyeshadow", "nail polish",
    "shampoo", "conditioner", "hair mask", "hair oil", "hair growth",
    "skincare", "skin care", "acne", "vitamin c serum", "retinol",
    "collagen", "whitening", "face wash", "body lotion", "perfume",
    "deodorant", "trimmer", "electric shaver", "hair dryer",
    "curling iron", "straightener"], "Health & Beauty", 0.85],

  // ── Sports & Outdoors
  [["yoga mat", "resistance band", "dumbbell", "kettlebell", "barbell",
    "gym gloves", "jump rope", "foam roller", "bicycle", "cycling",
    "running shoes", "hiking", "camping", "tent", "sleeping bag",
    "fishing rod", "fishing lure", "swimming", "swim goggle",
    "football", "basketball", "tennis", "badminton", "golf",
    "treadmill", "exercise bike", "pull up bar"], "Sports & Outdoors", 0.85],

  // ── Toys, Kids & Baby
  [["toy car", "action figure", "stuffed animal", "plush toy", "lego",
    "building blocks", "board game", "puzzle", "remote control car",
    "rc car", "drone toy", "doll", "play set", "slime", "fidget",
    "baby bottle", "baby monitor", "diaper", "stroller", "baby seat",
    "teether", "rattle", "kids backpack", "school bag"], "Toys, Kids & Baby", 0.85],

  // ── Pet Supplies
  [["dog collar", "cat collar", "pet leash", "dog harness", "cat tree",
    "pet bed", "dog toy", "cat toy", "pet feeder", "pet bowl",
    "aquarium", "fish tank", "bird cage", "hamster", "pet carrier",
    "cat litter", "dog treat", "pet grooming", "flea", "pet shampoo",
    "dog crate", "pet gate"], "Pet Supplies", 0.9],

  // ── Jewelry & Watches
  [["necklace", "bracelet", "earring", "ring", "pendant", "watch",
    "wristwatch", "anklet", "brooch", "charm", "choker", "bangle",
    "jewelry box", "jewellery", "gemstone", "crystal necklace",
    "925 silver", "stainless steel ring"], "Jewelry & Watches", 0.85],

  // ── Women's Clothing
  [["women dress", "women blouse", "women skirt", "women top",
    "women legging", "women swimsuit", "lingerie", "bra", "underwear",
    "women jacket", "women coat", "women cardigan", "women shorts",
    "women jeans", "ladies dress", "ladies top", "maxi dress",
    "midi dress", "floral dress", "bodycon", "jumpsuit women"], "Women's Clothing", 0.85],

  // ── Men's Clothing
  [["men shirt", "men t-shirt", "men polo", "men jacket", "men coat",
    "men trouser", "men shorts", "men jeans", "men suit", "men tie",
    "men blazer", "men hoodie", "men vest", "men sweatshirt",
    "men underwear", "men socks", "men pajama"], "Men's Clothing", 0.85],

  // ── Bags & Shoes
  [["backpack", "handbag", "shoulder bag", "tote bag", "crossbody",
    "wallet", "purse", "clutch", "suitcase", "travel bag", "gym bag",
    "sneakers", "boots", "sandals", "heels", "loafers", "slippers",
    "running shoes", "canvas shoes", "oxford shoes"], "Bags & Shoes", 0.85],

  // ── Home & Garden (keep broad home terms but AFTER car/tool specifics)
  [["pillow", "bedsheet", "duvet", "blanket", "curtain", "rug",
    "lamp", "vase", "picture frame", "wall art", "shower curtain",
    "kitchen knife", "cutting board", "cooking pot", "frying pan",
    "storage box", "clothes hanger", "doormat", "toilet brush",
    "garden hose", "plant pot", "watering can", "solar light garden",
    "lawn mower", "weed killer"], "Home & Garden", 0.75],

  // ── Office & Stationery
  [["notebook", "pen set", "desk organizer", "file folder",
    "sticky note", "highlighter", "stapler", "hole punch",
    "calculator", "whiteboard", "desk lamp", "office chair",
    "printer ink", "paper shredder", "binder clip", "rubber stamp"],
    "Office & Stationery", 0.8],

  // ── Food & Grocery
  [["coffee beans", "tea bag", "protein powder", "vitamins",
    "supplement", "snack", "dried fruit", "spice", "seasoning",
    "olive oil", "honey", "matcha", "collagen powder"],
    "Food & Grocery", 0.85],
]

// ── Layer 1: keyword scoring ──────────────────────────────────────────────────
interface ScoredCategory {
  category: Category
  confidence: number
}

function scoreByKeywords(text: string): ScoredCategory {
  const lower = text.toLowerCase()
  let best: ScoredCategory = { category: "General", confidence: 0 }

  for (const [keywords, category, weight] of KEYWORD_RULES) {
    const hits = keywords.filter(kw => lower.includes(kw)).length
    if (hits === 0) continue

    // Confidence = weight × (hits / total keywords), capped at weight
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

  // Partial match
  for (const [mapKey, canonical] of Object.entries(CJ_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return canonical
  }

  return null
}

// ── Layer 2: Gemini Flash AI classification ───────────────────────────────────
// Called only when keyword confidence < 0.6.
// Free tier: 1,500 requests/day, 1M tokens/day.
// Requires GEMINI_API_KEY in env vars (get free at aistudio.google.com).

async function classifyWithGemini(
  title: string,
  description: string
): Promise<Category | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const prompt = `Classify this product into exactly ONE of these categories:
${CANONICAL_CATEGORIES.join(", ")}, General

Product title: ${title}
Product description: ${description?.slice(0, 300) ?? ""}

Reply with only the category name, nothing else.`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 20, temperature: 0 },
        }),
      }
    )

    if (!res.ok) return null

    const data = await res.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ""

    // Match against canonical list (case-insensitive)
    const matched = CANONICAL_CATEGORIES.find(
      c => c.toLowerCase() === raw.toLowerCase()
    )

    return matched ?? null
  } catch {
    return null
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Main classifier — uses all three signals in priority order:
 *
 * 1. Title + description keyword scoring (always runs, free)
 * 2. CJ source category mapping (fast lookup, free)
 * 3. Gemini Flash AI (only when confidence < 0.6, free tier)
 *
 * Set GEMINI_API_KEY in env to enable AI fallback.
 * Get a free key at: https://aistudio.google.com/app/apikey
 */
export async function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): Promise<Category> {
  const titleStr = title?.trim() ?? ""
  const descStr = description?.trim() ?? ""
  const combinedText = `${titleStr} ${descStr}`

  // Step 1: keyword scoring on title + description
  const keywordResult = scoreByKeywords(combinedText)

  // High confidence keyword match — use it immediately, no further checks
  if (keywordResult.confidence >= 0.6) {
    return keywordResult.category
  }

  // Step 2: CJ category mapping
  const cjResult = normaliseCJCategory(cjCategory ?? "")

  // If keyword gave a moderate signal that AGREES with CJ mapping, trust it
  if (keywordResult.confidence >= 0.3 && cjResult === keywordResult.category) {
    return keywordResult.category
  }

  // If keyword gave low signal but CJ is confident (exact match), use CJ
  if (cjResult && keywordResult.confidence < 0.3) {
    return cjResult
  }

  // Step 3: AI fallback for genuinely ambiguous products
  if (titleStr) {
    const aiResult = await classifyWithGemini(titleStr, descStr)
    if (aiResult) return aiResult
  }

  // Final fallback: CJ result or keyword result or General
  return cjResult ?? keywordResult.category ?? "General"
}

/**
 * Synchronous version — no AI fallback.
 * Use during bulk operations where you don't want async overhead.
 */
export function classifyProductSync(
  title?: string,
  description?: string,
  cjCategory?: string
): Category {
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
  if (lower.includes("electronics"))                          return "📱"
  if (lower.includes("women"))                               return "👗"
  if (lower.includes("men"))                                 return "👔"
  if (lower.includes("bags") || lower.includes("shoes"))    return "👜"
  if (lower.includes("jewelry") || lower.includes("watch")) return "💍"
  if (lower.includes("beauty") || lower.includes("hair"))   return "💄"
  if (lower.includes("home") || lower.includes("garden"))   return "🏠"
  if (lower.includes("pet"))                                 return "🐾"
  if (lower.includes("toy") || lower.includes("kids") || lower.includes("baby")) return "🧸"
  if (lower.includes("sports") || lower.includes("outdoor")) return "⚽"
  if (lower.includes("automotive") || lower.includes("car")) return "🚗"
  if (lower.includes("tools") || lower.includes("hardware")) return "🔧"
  if (lower.includes("office") || lower.includes("stationery")) return "📎"
  if (lower.includes("food") || lower.includes("grocery"))  return "🛒"
  return "🛍️"
  }
