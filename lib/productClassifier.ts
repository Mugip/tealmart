// lib/productClassifier.ts

// ── Canonical store categories ────────────────────────────────────────────────
// These are the display names shown in the storefront filter.
// Add new entries here whenever CJ introduces a new root category.

const CJ_CATEGORY_MAP: Record<string, string> = {
  // Clothing & Fashion
  "women's clothing":                     "Women's Clothing",
  "men's clothing":                        "Men's Clothing",
  "men clothing":                          "Men's Clothing",
  "kids clothing":                         "Toys, Kids & Baby",
  "baby & kids":                           "Toys, Kids & Baby",

  // Bags & Shoes
  "bags & shoes":                          "Bags & Shoes",
  "bags and shoes":                        "Bags & Shoes",
  "shoes":                                 "Bags & Shoes",
  "luggage & bags":                        "Bags & Shoes",

  // Home & Garden (all CJ variants collapse to one)
  "home, garden & furniture":              "Home & Garden",
  "home & garden":                         "Home & Garden",
  "home garden & furniture":               "Home & Garden",
  "home,garden & furniture":               "Home & Garden",
  "home, garden, furniture & bedding":     "Home & Garden",
  "home & garden, furniture":              "Home & Garden",
  "garden & outdoor":                      "Home & Garden",
  "furniture":                             "Home & Garden",

  // Health & Beauty
  "health, beauty & hair":                 "Health & Beauty",
  "health & beauty":                       "Health & Beauty",
  "health beauty & hair":                  "Health & Beauty",
  "beauty & health":                       "Health & Beauty",

  // Jewelry & Watches
  "jewelry & watches":                     "Jewelry & Watches",
  "jewelry and watches":                   "Jewelry & Watches",
  "jewellery & watches":                   "Jewelry & Watches",

  // Electronics
  "consumer electronics":                  "Consumer Electronics",
  "electronics":                           "Consumer Electronics",
  "phones & telecommunications":          "Consumer Electronics",
  "computer & office":                     "Consumer Electronics",

  // Sports & Outdoors
  "sports & outdoors":                     "Sports & Outdoors",
  "sports and outdoors":                   "Sports & Outdoors",
  "sports & entertainment":               "Sports & Outdoors",
  "outdoor fun & sports":                  "Sports & Outdoors",

  // Toys, Kids & Baby
  "toys & hobbies":                        "Toys, Kids & Baby",
  "toys, kids & babies":                   "Toys, Kids & Baby",
  "toys":                                  "Toys, Kids & Baby",
  "mother & kids":                         "Toys, Kids & Baby",
  "baby & maternity":                      "Toys, Kids & Baby",

  // Pet Supplies
  "pet supplies":                          "Pet Supplies",
  "pets":                                  "Pet Supplies",

  // Automotive
  "automobiles & motorcycles":             "Automotive",
  "automotive":                            "Automotive",
  "car & motorbike":                       "Automotive",

  // Tools & Hardware
  "tools & home improvement":              "Tools & Hardware",
  "tools & hardware":                      "Tools & Hardware",
  "hardware":                              "Tools & Hardware",

  // Office & Stationery
  "office & school supplies":              "Office & Stationery",
  "stationery":                            "Office & Stationery",

  // Food
  "food":                                  "Food & Grocery",
  "food & grocery":                        "Food & Grocery",
  "grocery":                               "Food & Grocery",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extracts the root segment from a CJ hierarchical category string.
 * Handles both ">" and "/" separators.
 *
 * "Women's Clothing > Accessories > Scarves" → "Women's Clothing"
 * "Home, Garden & Furniture > Home Textiles" → "Home, Garden & Furniture"
 */
function extractRootCategory(cjCategory: string): string {
  if (!cjCategory || cjCategory.trim() === "") return ""

  return cjCategory
    .split(/[>/]/)
    .map((p) => p.trim())
    .filter(Boolean)[0] ?? ""
}

/**
 * Normalises a raw CJ root category string to a canonical store category.
 * Falls back to the original root string (title-cased) if no mapping found.
 */
function normaliseCategory(root: string): string {
  const key = root.toLowerCase().trim()

  if (CJ_CATEGORY_MAP[key]) return CJ_CATEGORY_MAP[key]

  // Partial-match fallback — handles slight wording differences
  for (const [mapKey, canonical] of Object.entries(CJ_CATEGORY_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return canonical
  }

  // Last resort: return the root as-is (title-cased)
  return root
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Main classifier.
 * Returns a normalised, canonical store category for the product.
 */
export function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): string {
  if (!cjCategory || cjCategory.trim() === "") return "General"

  const root = extractRootCategory(cjCategory)
  if (!root) return "General"

  return normaliseCategory(root)
}

/**
 * Formats a canonical category name for display in the storefront.
 */
export function formatCategoryName(category: string): string {
  if (!category || category === "General") return "All Products"
  return category
}

/**
 * Returns an emoji icon for a canonical category.
 */
export function getCategoryIcon(category: string): string {
  const lower = category.toLowerCase()

  if (lower.includes("electronics"))                        return "📱"
  if (lower.includes("women"))                              return "👗"
  if (lower.includes("men"))                                return "👔"
  if (lower.includes("bags") || lower.includes("shoes"))   return "👜"
  if (lower.includes("jewelry") || lower.includes("watch")) return "💍"
  if (lower.includes("beauty") || lower.includes("hair"))  return "💄"
  if (lower.includes("home") || lower.includes("garden"))  return "🏠"
  if (lower.includes("pet"))                                return "🐾"
  if (lower.includes("toy") || lower.includes("kids") || lower.includes("baby")) return "🧸"
  if (lower.includes("sports") || lower.includes("outdoor")) return "⚽"
  if (lower.includes("automotive") || lower.includes("car")) return "🚗"
  if (lower.includes("tools") || lower.includes("hardware")) return "🔧"
  if (lower.includes("office") || lower.includes("stationery")) return "📎"
  if (lower.includes("food") || lower.includes("grocery")) return "🛒"

  return "🛍️"
    }
      
