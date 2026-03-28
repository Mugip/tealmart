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
] as const;

export type Category = (typeof CANONICAL_CATEGORIES)[number] | "General";

interface CategoryRule {
  category: Category;
  weight: number;
  pattern: RegExp;
}

// ADVANCED HEURISTIC ENGINE:
// Higher weight rules OVERRIDE lower weight rules. 
// Phrases (weight 50+) beat single words (weight 20).
const RULES: CategoryRule[] =[
  // ── 1. HIGH PRIORITY PHRASES (Weight: 50-100) ──
  { category: "Office & Stationery", weight: 80, pattern: /\b(gel pen|fountain pen|ballpoint|ink pen|sticky note|desk organizer|memo pad|pencil case|notebook planner)\b/gi },
  { category: "Health & Beauty", weight: 80, pattern: /\b(nail polish|gel nail|phototherapy pen|nail art|face cream|skin care|essential oil|hair dryer|hair clipper|makeup brush)\b/gi },
  { category: "Automotive", weight: 80, pattern: /\b(car bracket|car mount|car phone|car charger|steering wheel|dash cam|dashcam|car seat|tire pressure|car air freshener|car organizer|car decor)\b/gi },
  { category: "Toys, Kids & Baby", weight: 80, pattern: /\b(baby shoes|toddler shoes|educational toy|remote control car|action figure|mummy bag)\b/gi },
  { category: "Tools & Hardware", weight: 80, pattern: /\b(screwdriver set|electric drill|hand tool kit|impact drill|torque|socket set)\b/gi },
  { category: "Home & Garden", weight: 80, pattern: /\b(bedding set|bed sheet|wall sticker|storage box|storage rack|kitchen cabinet|cake decorating)\b/gi },
  { category: "Consumer Electronics", weight: 80, pattern: /\b(mobile phone holder|laptop stand|smart ring|power bank|smart watch|usb cable|tablet holder|cleaning kit)\b/gi },
  { category: "Women's Clothing", weight: 80, pattern: /\b(two-piece|two piece|evening dress|crop top|women's clothing|ladies blouse|cheongsam)\b/gi },
  { category: "Bags & Shoes", weight: 80, pattern: /\b(canvas shoes|running shoes|leather shoes|sports shoes|messenger bag|shoulder bag|tote bag|bucket bag|daddy shoes|pea shoes)\b/gi },

  // ── 2. STRONG EXACT MATCHES (Weight: 30) ──
  { category: "Bags & Shoes", weight: 35, pattern: /\b(shoes?|sneakers?|boots?|sandals?|slippers?|backpacks?|handbags?|purse|wallet|luggage)\b/gi },
  { category: "Jewelry & Watches", weight: 35, pattern: /\b(jewelry|jewellery|necklace|bracelet|earrings?|rings?|pendant|watches|wristwatch|silver|gold|diamond|gemstone)\b/gi },

  // ── 3. STANDARD SINGLE WORDS (Weight: 20) ──
  { category: "Pet Supplies", weight: 20, pattern: /\b(pet|pets|dogs?|cats?|puppy|kitten|aquarium|bird cage|leash|harness|litter)\b/gi },
  { category: "Automotive", weight: 20, pattern: /\b(car|cars|auto|vehicle|motorcycle|windshield|tires?|tyres?|obd)\b/gi },
  { category: "Toys, Kids & Baby", weight: 20, pattern: /\b(toy|toys|plush|lego|puzzle|doll|baby|infant|toddler|stroller|diaper|kids?|childrens?|boys?|girls?)\b/gi },
  { category: "Consumer Electronics", weight: 20, pattern: /\b(smartphone|phones?|usb|bluetooth|wireless|earbuds?|earphones?|headphones?|speakers?|laptop|tablet|charger|drone|camera|webcam|monitor|keyboard|mouse|electronics?)\b/gi },
  { category: "Tools & Hardware", weight: 20, pattern: /\b(drill|wrench|screwdriver|soldering|multimeter|pliers|toolbox|hardware|caliper|saw|screws|nails)\b/gi },
  { category: "Health & Beauty", weight: 20, pattern: /\b(makeup|cosmetics?|skincare|serum|moisturizer|perfume|mascara|lipstick|nails?|shampoo|trimmer|shaver|acne|beauty|hair|teeth|massager)\b/gi },
  { category: "Sports & Outdoors", weight: 20, pattern: /\b(sports?|outdoors?|fitness|gym|yoga|dumbbell|cycling|bicycle|camping|hiking|fishing|treadmill|swim|tactical|running)\b/gi },
  { category: "Women's Clothing", weight: 20, pattern: /\b(womens?|ladies|dress|skirt|blouse|bra|lingerie|camisole|leggings?|swimsuit|bikini|gown)\b/gi },
  { category: "Men's Clothing", weight: 20, pattern: /\b(mens?|male|shirt|polo|suit|blazer|hoodie|t-shirt|tshirt|menswear|trousers?|jeans)\b/gi },
  { category: "Office & Stationery", weight: 20, pattern: /\b(office|stationery|notebooks?|pens?|pencils?|stapler|journal|diary|planners?|ink|paper|folder)\b/gi },
  { category: "Home & Garden", weight: 15, pattern: /\b(home|garden|furniture|sofa|bedding|pillows?|blankets?|rugs?|lamps?|decor|kitchen|utensils?|cookware|mugs?|curtains?|towels?|storage)\b/gi },
  { category: "Food & Grocery", weight: 20, pattern: /\b(food|grocery|snacks?|coffee|tea|chocolate|candy|spice|seasoning)\b/gi },
];

export function classifyProductSync(title?: string, description?: string): Category {
  // We strictly search the Title. (Descriptions often contain generic words that confuse algorithms).
  const text = `${title || ""} ${description?.slice(0, 100) || ""}`.toLowerCase();
  
  const scores: Record<string, number> = {};

  for (const rule of RULES) {
    const matches = text.match(rule.pattern);
    if (matches) {
      scores[rule.category] = (scores[rule.category] || 0) + (matches.length * rule.weight);
    }
  }

  // Sort by highest score
  const sortedCategories = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  
  if (sortedCategories.length > 0 && sortedCategories[0][1] >= 15) {
    return sortedCategories[0][0] as Category;
  }

  return "General";
}

export async function classifyProduct(title?: string, description?: string): Promise<Category> {
  return classifyProductSync(title, description);
}

export function formatCategoryName(category: string): string {
  if (!category || category === "General") return "All Products";
  return category;
}

export function getCategoryIcon(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("electronics")) return "📱";
  if (lower.includes("women")) return "👗";
  if (lower.includes("men")) return "👔";
  if (lower.includes("bags") || lower.includes("shoes")) return "👜";
  if (lower.includes("jewelry") || lower.includes("watch")) return "💍";
  if (lower.includes("beauty") || lower.includes("hair")) return "💄";
  if (lower.includes("home") || lower.includes("garden")) return "🏠";
  if (lower.includes("pet")) return "🐾";
  if (lower.includes("toy") || lower.includes("kids") || lower.includes("baby")) return "🧸";
  if (lower.includes("sports") || lower.includes("outdoor")) return "⚽";
  if (lower.includes("automotive") || lower.includes("car")) return "🚗";
  if (lower.includes("tools") || lower.includes("hardware")) return "🔧";
  if (lower.includes("office") || lower.includes("stationery")) return "📎";
  if (lower.includes("food") || lower.includes("grocery")) return "🛒";
  return "🛍️";
}
