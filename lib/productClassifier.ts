// lib/productClassifier.ts

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
] as const;

export type Category = (typeof CANONICAL_CATEGORIES)[number] | "General";

interface CategoryRule {
  category: Category;
  weight: number;
  pattern: RegExp;
}

/**
 * 1. ADVANCED HEURISTIC ENGINE RULES
 * Phrases (weight 80) override single words (weight 20).
 */
const RULES: CategoryRule[] = [
  // ── HIGH PRIORITY PHRASES (Weight: 80) ──
  { category: "Office & Stationery", weight: 80, pattern: /\b(gel pen|fountain pen|ballpoint|ink pen|sticky note|desk organizer|memo pad|pencil case|notebook planner)\b/gi },
  { category: "Health & Beauty", weight: 80, pattern: /\b(nail polish|gel nail|phototherapy pen|nail art|face cream|skin care|essential oil|hair dryer|hair clipper|makeup brush)\b/gi },
  { category: "Automotive", weight: 80, pattern: /\b(car bracket|car mount|car phone|car charger|steering wheel|dash cam|dashcam|car seat|tire pressure|car air freshener|car organizer|car decor)\b/gi },
  { category: "Toys, Kids & Baby", weight: 80, pattern: /\b(baby shoes|toddler shoes|educational toy|remote control car|action figure|mummy bag)\b/gi },
  { category: "Tools & Hardware", weight: 80, pattern: /\b(screwdriver set|electric drill|hand tool kit|impact drill|torque|socket set)\b/gi },
  { category: "Home & Garden", weight: 80, pattern: /\b(bedding set|bed sheet|wall sticker|storage box|storage rack|kitchen cabinet|cake decorating)\b/gi },
  { category: "Consumer Electronics", weight: 80, pattern: /\b(mobile phone holder|laptop stand|smart ring|power bank|smart watch|usb cable|tablet holder|cleaning kit)\b/gi },
  { category: "Women's Clothing", weight: 80, pattern: /\b(two-piece|two piece|evening dress|crop top|women's clothing|ladies blouse|cheongsam)\b/gi },
  { category: "Bags & Shoes", weight: 80, pattern: /\b(canvas shoes|running shoes|leather shoes|sports shoes|messenger bag|shoulder bag|tote bag|bucket bag|daddy shoes|pea shoes)\b/gi },

  // ── STRONG EXACT MATCHES (Weight: 35) ──
  { category: "Bags & Shoes", weight: 35, pattern: /\b(shoes?|sneakers?|boots?|sandals?|slippers?|backpacks?|handbags?|purse|wallet|luggage)\b/gi },
  { category: "Jewelry & Watches", weight: 35, pattern: /\b(jewelry|jewellery|necklace|bracelet|earrings?|rings?|pendant|watches|wristwatch|silver|gold|diamond|gemstone)\b/gi },

  // ── STANDARD SINGLE WORDS (Weight: 20) ──
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

/**
 * 2. AI POWERED CLASSIFICATION (Hugging Face)
 */
let hfEnabled = true;
let hfConsecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 5;

async function classifyWithHuggingFace(
  title: string,
  description: string,
  cjCategoryHint?: string
): Promise<Category | null> {
  if (!hfEnabled || hfConsecutiveFailures >= MAX_CONSECUTIVE_FAILURES) return null;

  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      hfEnabled = false;
      return null;
    }

    // Clean HTML and noise from description
    const cleanDesc = (description || "").replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').slice(0, 300);
    const text = `Product: ${title}. Description: ${cleanDesc}. Native Category: ${cjCategoryHint || 'None'}`;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          parameters: { candidate_labels: CANONICAL_CATEGORIES, multi_label: false },
        }),
        signal: AbortSignal.timeout(6000),
      }
    );

    const result = await response.json();

    // Handle Model Loading State
    if (result.error && result.error.includes('loading')) {
      console.log(`🔄 HF Model waking up (Estimated: ${result.estimated_time || '5'}s)... using fallback`);
      return null;
    }

    if (!response.ok) throw new Error(`HF Status: ${response.status}`);

    hfConsecutiveFailures = 0;

    // Return best match if confidence > 35%
    if (result.scores && result.scores[0] > 0.35) {
      console.log(`🤖 AI Result: ${result.labels[0]} (${(result.scores[0] * 100).toFixed(1)}%)`);
      return result.labels[0] as Category;
    }

    return null;
  } catch (error) {
    hfConsecutiveFailures++;
    console.error(`❌ AI Failed (${hfConsecutiveFailures}/${MAX_CONSECUTIVE_FAILURES})`);
    if (hfConsecutiveFailures >= MAX_CONSECUTIVE_FAILURES) hfEnabled = false;
    return null;
  }
}

/**
 * 3. HEURISTIC FALLBACK ENGINE
 */
function classifyWithHeuristics(
  title?: string,
  description?: string,
  cjCategoryHint?: string
): Category {
  const text = `${title || ""} ${description?.slice(0, 150) || ""} ${cjCategoryHint || ""}`.toLowerCase();
  const scores: Record<string, number> = {};

  for (const rule of RULES) {
    const matches = text.match(rule.pattern);
    if (matches) {
      scores[rule.category] = (scores[rule.category] || 0) + (matches.length * rule.weight);
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  
  if (sorted.length > 0 && sorted[0][1] >= 20) {
    return sorted[0][0] as Category;
  }

  return "General";
}

/**
 * 4. PUBLIC INTERFACE
 */

export function classifyProductSync(
  title?: string,
  description?: string,
  cjCategoryHint?: string
): Category {
  return classifyWithHeuristics(title, description, cjCategoryHint);
}

export async function classifyProduct(
  title?: string,
  description?: string,
  cjCategoryHint?: string,
  options?: { useAI?: boolean; forceHeuristic?: boolean }
): Promise<Category> {
  const shouldAttemptAI = options?.useAI !== false && !options?.forceHeuristic && title && title.length > 5;

  if (shouldAttemptAI && hfEnabled) {
    const aiResult = await classifyWithHuggingFace(title!, description || "", cjCategoryHint);
    if (aiResult) return aiResult;
  }

  return classifyWithHeuristics(title, description, cjCategoryHint);
}

/**
 * Smart batch: Calls AI only when heuristics are not confident ("General")
 */
export async function classifyProductsBatchSmart(
  products: Array<{ title?: string; description?: string; cjCategoryHint?: string }>
): Promise<Category[]> {
  const results: Category[] = [];
  
  for (const p of products) {
    const heuristic = classifyProductSync(p.title, p.description, p.cjCategoryHint);
    
    if (heuristic !== "General" || !hfEnabled) {
      results.push(heuristic);
    } else {
      const aiResult = await classifyProduct(p.title, p.description, p.cjCategoryHint);
      results.push(aiResult);
      // Small delay to prevent rate-limiting on bulk AI calls
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  return results;
}

/**
 * UTILITIES
 */
export function formatCategoryName(category: string): string {
  if (!category || category === "General") return "All Products";
  return category;
}

export function getCategoryIcon(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("clothing")) {
     if (lower.includes("women")) return "👗";
     return "👔";
  }
  if (lower.includes("shoe") || lower.includes("footwear")) return "👟";
  if (lower.includes("bag") || lower.includes("backpack")) return "🎒";
  if (lower.includes("jewelry") || lower.includes("watch") || lower.includes("ring")) return "💍";
  if (lower.includes("beauty") || lower.includes("makeup") || lower.includes("hair")) return "💄";
  if (lower.includes("electronics") || lower.includes("phone") || lower.includes("tech")) return "📱";
  if (lower.includes("home") || lower.includes("garden") || lower.includes("furniture")) return "🏠";
  if (lower.includes("pet")) return "🐾";
  if (lower.includes("toy") || lower.includes("kids") || lower.includes("baby")) return "🧸";
  if (lower.includes("sports") || lower.includes("outdoor") || lower.includes("fitness")) return "⚽";
  if (lower.includes("automotive") || lower.includes("car")) return "🚗";
  if (lower.includes("tools") || lower.includes("hardware")) return "🔧";
  if (lower.includes("office") || lower.includes("stationery") || lower.includes("pen")) return "✒️";
  if (lower.includes("food") || lower.includes("grocery") || lower.includes("snack")) return "🛒";
  return "🛍️";
}

export function getClassifierHealth() {
  return {
    aiEnabled: hfEnabled,
    consecutiveFailures: hfConsecutiveFailures,
    status: hfEnabled ? 'healthy' : 'disabled (too many failures)',
  };
            }
