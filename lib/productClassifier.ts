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

// Pre-compiled lexicon for instant O(1) lookups
const LEXICON: Record<string, Record<string, number>> = {};

function addTerms(category: Category, terms: Record<string, number>) {
  for (const[term, weight] of Object.entries(terms)) {
    if (!LEXICON[term]) LEXICON[term] = {};
    LEXICON[term][category] = weight;
  }
}

// Highly-curated e-commerce dictionary
function initLexicon() {
  addTerms("Automotive", {
    "car": 10, "auto": 8, "vehicle": 10, "motorcycle": 10, "dashboard": 8,
    "dash cam": 20, "dashcam": 20, "windshield": 10, "tire": 15, "tyre": 15,
    "steering wheel": 20, "car charger": 15, "car wash": 15, "obd": 20,
    "air freshener": 10, "seat cover": 10, "rearview": 15, "dvr": 15,
    "car organizer": 20, "car phone mount": 20
  });

  addTerms("Consumer Electronics", {
    "smartphone": 20, "phone": 8, "usb": 10, "bluetooth": 10, "wireless": 5,
    "earbuds": 20, "earphone": 20, "headphone": 20, "speaker": 15,
    "smart watch": 20, "smartwatch": 20, "laptop": 20, "tablet": 15,
    "power bank": 20, "charger": 10, "cable": 5, "drone": 20, "led": 5,
    "camera": 15, "nfc": 15, "adapter": 10, "screen": 5, "monitor": 15, 
    "keyboard": 15, "mouse": 15, "electronics": 20, "projector": 20, "wifi": 10,
    "laptop stand": 20
  });

  addTerms("Tools & Hardware", {
    "drill": 20, "wrench": 20, "screwdriver": 20, "soldering": 20,
    "multimeter": 20, "pliers": 20, "toolbox": 20, "hardware": 15,
    "socket set": 20, "caliper": 20, "saw": 15, "electric drill": 20,
    "tape measure": 15, "screws": 10, "nails": 5, "clamp": 15, "tool": 10,
    "hand tool": 20, "power tool": 20
  });

  addTerms("Health & Beauty", {
    "makeup": 20, "cosmetic": 20, "skincare": 20, "skin care": 20,
    "serum": 15, "moisturizer": 15, "perfume": 20, "mascara": 20,
    "lipstick": 20, "nail": 10, "nail polish": 20, "gel nail": 20,
    "nail art": 20, "hair dryer": 20, "shampoo": 20, "trimmer": 15,
    "shaver": 15, "acne": 15, "essential oil": 15, "eyelash": 20,
    "beauty": 15, "hair": 5, "comb": 10, "brush": 5, "teeth": 10, 
    "dental": 15, "phototherapy": 15, "clipper": 15, "massager": 15
  });

  addTerms("Sports & Outdoors", {
    "sports": 15, "outdoor": 8, "fitness": 15, "gym": 15, "yoga": 20,
    "dumbbell": 20, "cycling": 15, "bicycle": 20, "camping": 15,
    "hiking": 15, "fishing": 20, "treadmill": 20, "swim": 15,
    "tactical": 15, "running": 10, "walking": 5, "tent": 20,
    "sleeping bag": 20, "soccer": 20, "basketball": 20, "tennis": 20,
    "wading": 15, "diving": 15, "resistance band": 20, "yoga mat": 20
  });

  addTerms("Toys, Kids & Baby", {
    "toy": 20, "plush": 20, "lego": 20, "puzzle": 15, "action figure": 20,
    "doll": 20, "rc car": 20, "baby": 20, "infant": 20, "toddler": 20,
    "stroller": 20, "diaper": 20, "maternity": 20, "kids": 15,
    "children": 15, "educational": 10, "pacifier": 20, "onesie": 15,
    "boys": 5, "girls": 5, "childrens": 15, "baby shoes": 25, "kids shoes": 25
  });

  addTerms("Pet Supplies", {
    "pet": 20, "dog": 20, "cat": 20, "puppy": 20, "kitten": 20,
    "aquarium": 20, "bird cage": 20, "leash": 20, "harness": 15,
    "litter": 20, "pet bed": 20, "grooming": 15, "hamster": 20,
    "fish tank": 20, "dog collar": 20, "cat toy": 20
  });

  addTerms("Jewelry & Watches", {
    "jewelry": 20, "jewellery": 20, "necklace": 20, "bracelet": 20,
    "earring": 20, "ring": 10, "pendant": 20, "watch": 20,
    "wristwatch": 20, "silver": 10, "gold": 10, "diamond": 15,
    "gemstone": 15, "chain": 10, "brooch": 20, "anklet": 20,
    "luxury": 5, "smart ring": 20
  });

  addTerms("Bags & Shoes", {
    "bag": 15, "backpack": 20, "handbag": 20, "purse": 20, "wallet": 20,
    "luggage": 20, "shoe": 15, "shoes": 15, "sneaker": 20, "sneakers": 20,
    "boot": 15, "boots": 15, "sandal": 20, "sandals": 20, "slipper": 20,
    "slippers": 20, "tote": 20, "crossbody": 20, "messenger bag": 20,
    "bucket bag": 20, "canvas shoes": 20, "leather shoes": 20,
    "daddy shoes": 20, "pea shoes": 20, "loafers": 20, "heels": 20,
    "mens shoes": 25, "womens shoes": 25, "running shoes": 25, "sports shoes": 25
  });

  addTerms("Women's Clothing", {
    "women": 10, "womens": 10, "lady": 10, "ladies": 10, "female": 10,
    "dress": 20, "skirt": 20, "blouse": 20, "bra": 20, "lingerie": 20,
    "cheongsam": 20, "camisole": 20, "legging": 20, "leggings": 20,
    "swimsuit": 20, "bikini": 20, "gown": 20, "two piece": 15,
    "romper": 20, "cardigan": 15, "panties": 20, "corset": 20,
    "apparel": 5, "clothing": 5, "top": 5, "womens clothing": 25
  });

  addTerms("Men's Clothing", {
    "men": 10, "mens": 10, "male": 10, "shirt": 15, "polo": 15,
    "suit": 20, "blazer": 20, "hoodie": 15, "t shirt": 15, "tshirt": 15,
    "menswear": 20, "trouser": 15, "jeans": 15, "jacket": 12,
    "coat": 12, "sweatshirt": 15, "apparel": 5, "clothing": 5, "mens clothing": 25
  });

  addTerms("Office & Stationery", {
    "office": 10, "stationery": 20, "notebook": 20, "pen": 10,
    "pencil": 15, "desk organizer": 20, "stapler": 20, "journal": 20,
    "diary": 20, "planner": 20, "gel pen": 20, "ballpoint": 20,
    "ink": 15, "paper": 5, "folder": 15, "marker": 15,
    "fountain pen": 20, "book": 10
  });

  addTerms("Home & Garden", {
    "home": 5, "garden": 10, "furniture": 20, "sofa": 20, "bedding": 20,
    "bedsheet": 20, "pillow": 15, "blanket": 15, "rug": 15,
    "lamp": 12, "decor": 10, "kitchen": 15, "utensil": 15,
    "cookware": 20, "mug": 12, "wall sticker": 20, "home textile": 20,
    "divider": 10, "shelf": 15, "curtain": 20, "towel": 15, "storage": 10,
    "organizer": 10, "bed": 12, "bathroom": 15, "toilet": 15,
    "living room": 15, "bedroom": 15, "bedding set": 25
  });

  addTerms("Food & Grocery", {
    "food": 20, "grocery": 20, "snack": 20, "coffee": 20, "tea": 20,
    "chocolate": 20, "candy": 20, "spice": 20, "seasoning": 20
  });
}

initLexicon();

function tokenize(text: string): string[] {
  // Normalize text: lowercase, fix apostrophes ("men's" -> "mens"), remove special chars
  const normalized = text
    .toLowerCase()
    .replace(/'s\b/g, 's')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
    
  const words = normalized.split(/\s+/).filter(w => w.length > 0);
  const tokens = [...words];
  
  // Add Bigrams (e.g. "running" + "shoes" -> "running shoes")
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]} ${words[i+1]}`);
  }
  
  // Add Trigrams (e.g. "mobile phone holder")
  for (let i = 0; i < words.length - 2; i++) {
    tokens.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
  }

  return tokens;
}

export function classifyProductSync(title?: string, description?: string, cjCategoryHint?: string): Category {
  const text = `${title || ""} ${cjCategoryHint || ""}`;
  const tokens = tokenize(text);
  
  const scores: Partial<Record<Category, number>> = {};
  
  for (const token of tokens) {
    if (LEXICON[token]) {
      for (const [cat, weight] of Object.entries(LEXICON[token])) {
        const category = cat as Category;
        scores[category] = (scores[category] || 0) + weight;
      }
    }
  }

  let bestCategory: Category = "General";
  let maxScore = 0;

  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat as Category;
    }
  }

  return maxScore >= 5 ? bestCategory : "General";
}

export async function classifyProduct(title?: string, description?: string, cjCategoryHint?: string): Promise<Category> {
  return classifyProductSync(title, description, cjCategoryHint);
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
