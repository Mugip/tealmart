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

// 1. HIGH-SPEED HEURISTIC RULES (Free & Instant)
const RULES: CategoryRule[] = [
  { category: "Office & Stationery", weight: 80, pattern: /\b(gel pen|fountain pen|sticky note|desk organizer|notebook planner)\b/gi },
  { category: "Health & Beauty", weight: 80, pattern: /\b(nail polish|face cream|skin care|essential oil|hair dryer|makeup brush)\b/gi },
  { category: "Automotive", weight: 80, pattern: /\b(car bracket|car mount|car charger|steering wheel|dash cam|tire pressure)\b/gi },
  { category: "Toys, Kids & Baby", weight: 80, pattern: /\b(baby shoes|toddler shoes|educational toy|remote control car|mummy bag)\b/gi },
  { category: "Consumer Electronics", weight: 80, pattern: /\b(mobile phone holder|laptop stand|power bank|smart watch|usb cable)\b/gi },
  { category: "Bags & Shoes", weight: 80, pattern: /\b(canvas shoes|running shoes|messenger bag|shoulder bag|tote bag)\b/gi },
  { category: "Jewelry & Watches", weight: 35, pattern: /\b(jewelry|jewellery|necklace|bracelet|earrings?|rings?|watches)\b/gi },
  { category: "Pet Supplies", weight: 20, pattern: /\b(pet|dogs?|cats?|puppy|leash|harness|aquarium)\b/gi },
  { category: "Sports & Outdoors", weight: 20, pattern: /\b(fitness|gym|yoga|dumbbell|cycling|bicycle|camping|hiking)\b/gi },
];

// 2. LLAMA 3.1 CONFIGURATION
let hfEnabled = true;
const MODEL_ID = "meta-llama/Llama-3.1-8B-Instruct";
const API_URL = "https://api-inference.huggingface.co/v1/chat/completions";

async function classifyWithLlama(
  title: string,
  description: string,
  cjCategoryHint?: string
): Promise<Category | null> {
  if (!hfEnabled) return null;

  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) return null;

    const cleanDesc = (description || "").replace(/<[^>]*>?/gm, '').slice(0, 300);

    const systemPrompt = `You are a product categorization expert. You must pick exactly ONE category from this list: [${CANONICAL_CATEGORIES.join(", ")}].
    Output only the category name. Do not explain your choice. If you are unsure, output "General".`;

    const userPrompt = `Product Title: ${title}
    Product Description: ${cleanDesc}
    Original Category Hint: ${cjCategoryHint || 'None'}
    
    Category:`;

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
        max_tokens: 20,
        temperature: 0.1 // Low temperature for consistency
      }),
    });

    const result = await response.json();

    if (!response.ok) {
        if (result.error?.includes("loading")) return null;
        throw new Error(result.error || "HF Error");
    }

    const aiChoice = result.choices?.[0]?.message?.content?.trim();

    // Validate that the AI actually returned one of our categories
    const found = CANONICAL_CATEGORIES.find(c => aiChoice?.includes(c));
    
    if (found) {
        console.log(`🤖 Llama 3.1 Classified: [${found}]`);
        return found;
    }

    return null;
  } catch (error) {
    console.error("❌ Llama Classification Failed:", error);
    return null;
  }
}

// 3. FALLBACK HEURISTIC LOGIC
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

// 4. PUBLIC API
export async function classifyProduct(
  title?: string,
  description?: string,
  cjCategoryHint?: string
): Promise<Category> {
  // A. Try high-confidence heuristics first (Instant & Free)
  const heuristicResult = classifyWithHeuristics(title, description, cjCategoryHint);
  
  // If heuristics found something specific (not General), return it
  if (heuristicResult !== "General") return heuristicResult;

  // B. If heuristics are unsure, use Llama 3.1
  if (title) {
    const llamaResult = await classifyWithLlama(title, description || "", cjCategoryHint);
    if (llamaResult) return llamaResult;
  }

  return "General";
}

export function classifyProductSync(title?: string, description?: string, hint?: string): Category {
    return classifyWithHeuristics(title, description, hint);
}

// UTILITIES
export function formatCategoryName(category: string): string {
  if (!category || category === "General") return "All Products";
  return category;
}

export function getCategoryIcon(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("clothing")) return lower.includes("women") ? "👗" : "👔";
  if (lower.includes("shoe") || lower.includes("footwear")) return "👟";
  if (lower.includes("bag") || lower.includes("backpack")) return "🎒";
  if (lower.includes("jewelry") || lower.includes("watch")) return "💍";
  if (lower.includes("beauty") || lower.includes("makeup")) return "💄";
  if (lower.includes("electronics") || lower.includes("phone")) return "📱";
  if (lower.includes("home") || lower.includes("garden")) return "🏠";
  if (lower.includes("pet")) return "🐾";
  if (lower.includes("toy") || lower.includes("kids") || lower.includes("baby")) return "🧸";
  if (lower.includes("sports") || lower.includes("outdoor")) return "⚽";
  if (lower.includes("automotive") || lower.includes("car")) return "🚗";
  if (lower.includes("tools") || lower.includes("hardware")) return "🔧";
  if (lower.includes("office") || lower.includes("stationery")) return "✒️";
  if (lower.includes("food") || lower.includes("grocery")) return "🛒";
  return "🛍️";
}
