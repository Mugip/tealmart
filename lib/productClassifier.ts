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
 * Now highly upgraded to catch generic clothing items natively.
 */
const RULES: CategoryRule[] = [
  // ── HIGH PRIORITY EXACT MATCHES (Weight: 80) ──
  { category: "Women's Clothing", weight: 80, pattern: /\b(womens?|ladies|dress|skirt|blouse|bra|lingerie|camisole|swimsuit|bikini|gown|sleepwear|lace|satin|romper|jumpsuit|womenswear)\b/gi },
  { category: "Men's Clothing", weight: 80, pattern: /\b(mens?|male|suit|tuxedo|menswear)\b/gi },
  
  { category: "Office & Stationery", weight: 80, pattern: /\b(gel pen|fountain pen|ballpoint|ink pen|sticky note|desk organizer|memo pad|pencil case|notebook planner)\b/gi },
  { category: "Health & Beauty", weight: 80, pattern: /\b(nail polish|gel nail|phototherapy pen|nail art|face cream|skin care|essential oil|hair dryer|hair clipper|makeup brush)\b/gi },
  { category: "Automotive", weight: 80, pattern: /\b(car bracket|car mount|car phone|car charger|steering wheel|dash cam|dashcam|car seat|tire pressure|car air freshener|car organizer|car decor)\b/gi },
  { category: "Toys, Kids & Baby", weight: 80, pattern: /\b(baby shoes|toddler shoes|educational toy|remote control car|action figure|mummy bag)\b/gi },
  { category: "Tools & Hardware", weight: 80, pattern: /\b(screwdriver set|electric drill|hand tool kit|impact drill|torque|socket set)\b/gi },
  { category: "Home & Garden", weight: 80, pattern: /\b(bedding set|bed sheet|wall sticker|storage box|storage rack|kitchen cabinet|cake decorating)\b/gi },
  { category: "Consumer Electronics", weight: 80, pattern: /\b(mobile phone holder|laptop stand|smart ring|power bank|smart watch|usb cable|tablet holder|cleaning kit)\b/gi },
  { category: "Bags & Shoes", weight: 80, pattern: /\b(canvas shoes|running shoes|leather shoes|sports shoes|messenger bag|shoulder bag|tote bag|bucket bag|daddy shoes|pea shoes)\b/gi },

  // ── STRONG GENERIC MATCHES (Weight: 35) ──
  { category: "Bags & Shoes", weight: 35, pattern: /\b(shoes?|sneakers?|boots?|sandals?|slippers?|backpacks?|handbags?|purse|wallet|luggage)\b/gi },
  { category: "Jewelry & Watches", weight: 35, pattern: /\b(jewelry|jewellery|necklace|bracelet|earrings?|rings?|pendant|watches|wristwatch|silver|gold|diamond|gemstone)\b/gi },
  
  // ── GENERIC CLOTHING FALLBACKS (Weight: 20) ──
  // If it's a generic jacket/tracksuit/pants without "women" in the title, default to Men's.
  { category: "Men's Clothing", weight: 20, pattern: /\b(shirt|polo|blazer|hoodie|t-shirt|tshirt|trousers?|jeans|jacket|puffer|tracksuit|coat|shorts?|pants?|vest|sweatshirt|sweater)\b/gi },

  // ── STANDARD SINGLE WORDS (Weight: 20) ──
  { category: "Pet Supplies", weight: 20, pattern: /\b(pet|pets|dogs?|cats?|puppy|kitten|aquarium|bird cage|leash|harness|litter)\b/gi },
  { category: "Automotive", weight: 20, pattern: /\b(car|cars|auto|vehicle|motorcycle|windshield|tires?|tyres?|obd)\b/gi },
  { category: "Toys, Kids & Baby", weight: 20, pattern: /\b(toy|toys|plush|lego|puzzle|doll|baby|infant|toddler|stroller|diaper|kids?|childrens?|boys?|girls?)\b/gi },
  { category: "Consumer Electronics", weight: 20, pattern: /\b(smartphone|phones?|usb|bluetooth|wireless|earbuds?|earphones?|headphones?|speakers?|laptop|tablet|charger|drone|camera|webcam|monitor|keyboard|mouse|electronics?)\b/gi },
  { category: "Tools & Hardware", weight: 20, pattern: /\b(drill|wrench|screwdriver|soldering|multimeter|pliers|toolbox|hardware|caliper|saw|screws|nails)\b/gi },
  { category: "Health & Beauty", weight: 20, pattern: /\b(makeup|cosmetics?|skincare|serum|moisturizer|perfume|mascara|lipstick|nails?|shampoo|trimmer|shaver|acne|beauty|hair|teeth|massager)\b/gi },
  { category: "Sports & Outdoors", weight: 20, pattern: /\b(sports?|outdoors?|fitness|gym|yoga|dumbbell|cycling|bicycle|camping|hiking|fishing|treadmill|swim|tactical|running)\b/gi },
  { category: "Office & Stationery", weight: 20, pattern: /\b(office|stationery|notebooks?|pens?|pencils?|stapler|journal|diary|planners?|ink|paper|folder)\b/gi },
  { category: "Home & Garden", weight: 15, pattern: /\b(home|garden|furniture|sofa|bedding|pillows?|blankets?|rugs?|lamps?|decor|kitchen|utensils?|cookware|mugs?|curtains?|towels?|storage)\b/gi },
  { category: "Food & Grocery", weight: 20, pattern: /\b(food|grocery|snacks?|coffee|tea|chocolate|candy|spice|seasoning)\b/gi },
];

/**
 * 2. LLAMA 3.1 AI CONFIGURATION
 */
let hfEnabled = true;
let hfConsecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 5;
const MODEL_ID = "meta-llama/Llama-3.1-8B-Instruct";
const API_URL = "https://api-inference.huggingface.co/v1/chat/completions";

// ✅ NEW: Function to manually revive the AI if it crashed previously
export function resetAIHealth() {
  hfEnabled = true;
  hfConsecutiveFailures = 0;
}

async function classifyWithLlama(
  title: string,
  description: string,
  cjCategoryHint?: string
): Promise<Category | null> {
  if (!hfEnabled || hfConsecutiveFailures >= MAX_CONSECUTIVE_FAILURES) return null;

  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) return null;

    const cleanDesc = (description || "").replace(/<[^>]*>?/gm, '').slice(0, 300);

    const systemPrompt = `You are a product categorization expert. Pick exactly ONE category from this list: [${CANONICAL_CATEGORIES.join(", ")}]. 
    Respond ONLY with the category name. If unsure, respond "General".`;

    const userPrompt = `Title: ${title}\nDescription: ${cleanDesc}\nHint: ${cjCategoryHint || 'None'}\n\nCategory:`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "x-wait-for-model": "true"
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 15,
        temperature: 0.1
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.error?.includes("loading")) return null;
      throw new Error(result.error || "API Error");
    }

    const aiChoice = result.choices?.[0]?.message?.content?.trim();
    const validatedCategory = CANONICAL_CATEGORIES.find(c => aiChoice?.includes(c));
    
    if (validatedCategory) {
      hfConsecutiveFailures = 0;
      return validatedCategory as Category;
    }

    return null;
  } catch (error) {
    hfConsecutiveFailures++;
    console.error("❌ AI Classification Failure:", error);
    if (hfConsecutiveFailures >= MAX_CONSECUTIVE_FAILURES) hfEnabled = false;
    return null;
  }
}

/**
 * 3. HEURISTIC ENGINE
 */
function classifyWithHeuristics(title?: string, description?: string, hint?: string): Category {
  const text = `${title || ""} ${description?.slice(0, 150) || ""} ${hint || ""}`.toLowerCase();
  const scores: Record<string, number> = {};

  for (const rule of RULES) {
    const matches = text.match(rule.pattern);
    if (matches) {
      scores[rule.category] = (scores[rule.category] || 0) + (matches.length * rule.weight);
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0 && sorted[0][1] >= 20) return sorted[0][0] as Category;
  
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
  cjCategoryHint?: string
): Promise<Category> {
  // Try Heuristics first (Fast & Free)
  const heuristicResult = classifyWithHeuristics(title, description, cjCategoryHint);
  
  // If heuristics found a specific department, return it immediately
  if (heuristicResult !== "General") return heuristicResult;

  // Fallback to Llama 3.1 if title exists
  if (title && hfEnabled) {
    const aiResult = await classifyWithLlama(title, description || "", cjCategoryHint);
    if (aiResult) return aiResult;
  }

  return "General";
}

export function getClassifierHealth() {
  return {
    aiEnabled: hfEnabled,
    consecutiveFailures: hfConsecutiveFailures,
    status: hfEnabled ? 'healthy' : 'disabled (too many failures)',
  };
}

export function formatCategoryName(category: string): string {
  if (!category || category === "General") return "All Products";
  return category;
}

export function getCategoryIcon(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("clothing")) return lower.includes("women") ? "👗" : "👔";
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
