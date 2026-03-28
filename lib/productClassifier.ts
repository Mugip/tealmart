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

// Point-based system with strict word boundaries
const KEYWORD_RULES: { keywords: string[], category: Category, weight: number }[] =[
  {
    category: "Automotive",
    weight: 10,
    keywords:["car", "auto", "vehicle", "motorcycle", "dashboard", "dash cam", "dashcam", "windshield", "tire", "tyre", "steering wheel", "car charger", "car wash", "obd", "air freshener"]
  },
  {
    category: "Consumer Electronics",
    weight: 8,
    keywords:["smartphone", "phone", "usb", "bluetooth", "wireless", "earbuds", "earphone", "headphone", "speaker", "smart watch", "smartwatch", "laptop", "tablet", "power bank", "charger", "cable", "drone", "led", "camera", "nfc"]
  },
  {
    category: "Tools & Hardware",
    weight: 9,
    keywords:["drill", "wrench", "screwdriver", "soldering", "multimeter", "pliers", "toolbox", "hardware", "socket set", "caliper", "saw"]
  },
  {
    category: "Health & Beauty",
    weight: 9,
    keywords:["makeup", "cosmetic", "skincare", "skin care", "serum", "moisturizer", "perfume", "mascara", "lipstick", "nail polish", "gel nail", "nail art", "hair dryer", "shampoo", "trimmer", "shaver", "acne"]
  },
  {
    category: "Sports & Outdoors",
    weight: 8,
    keywords:["sports", "outdoor", "fitness", "gym", "yoga", "dumbbell", "cycling", "bicycle", "camping", "hiking", "fishing", "treadmill", "swim", "tactical", "running", "walking"]
  },
  {
    category: "Toys, Kids & Baby",
    weight: 9,
    keywords:["toy", "plush", "lego", "puzzle", "action figure", "doll", "rc car", "baby", "infant", "toddler", "stroller", "diaper", "maternity", "kids", "educational"]
  },
  {
    category: "Pet Supplies",
    weight: 10,
    keywords:["pet", "dog", "cat", "puppy", "kitten", "aquarium", "bird cage", "leash", "pet bed", "dog collar", "cat litter", "pet grooming"]
  },
  {
    category: "Jewelry & Watches",
    weight: 9,
    keywords:["jewelry", "jewellery", "necklace", "bracelet", "earring", "ring", "pendant", "watch", "wristwatch", "sterling silver", "gemstone", "chain"]
  },
  {
    category: "Bags & Shoes",
    weight: 9,
    keywords:["bag", "backpack", "handbag", "purse", "wallet", "luggage", "shoe", "sneaker", "boot", "sandal", "slipper", "tote", "crossbody", "messenger", "bucket bag"]
  },
  {
    category: "Women's Clothing",
    weight: 8,
    keywords:["women", "womens", "ladies", "dress", "skirt", "blouse", "bra", "lingerie", "cheongsam", "camisole", "legging", "swimsuit", "two-piece", "two piece"]
  },
  {
    category: "Men's Clothing",
    weight: 8,
    keywords:["men", "mens", "boy", "shirt", "polo", "suit", "blazer", "hoodie", "t-shirt", "tshirt", "menswear"]
  },
  {
    category: "Office & Stationery",
    weight: 9,
    keywords:["office", "stationery", "notebook", "pen", "pencil", "desk organizer", "stapler", "journal", "diary", "planner", "gel pen", "ballpoint", "ink"]
  },
  {
    category: "Home & Garden",
    weight: 6, // Lower weight as it's broad
    keywords:["home", "garden", "furniture", "sofa", "bedding", "bedsheet", "pillow", "blanket", "rug", "lamp", "decor", "kitchen", "utensil", "cookware", "mug", "wall sticker", "home textile", "divider", "shelf"]
  }
];

export function classifyProductSync(title?: string, description?: string, cjCategoryHint?: string): Category {
  // Combine text for searching
  const text = `${title || ""} ${description || ""} ${cjCategoryHint || ""}`.toLowerCase();
  
  const scores: Record<string, number> = {};

  for (const rule of KEYWORD_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      // \b ensures we only match whole words.
      // e.g., \bcat\b matches "cat" but NOT "category".
      // We allow optional 's' or 'es' for simple plurals.
      const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKw}(s|es)?\\b`, 'g');
      
      const matches = text.match(regex);
      if (matches) {
        score += matches.length * rule.weight;
      }
    }
    
    if (score > 0) {
      scores[rule.category] = (scores[rule.category] || 0) + score;
    }
  }

  // Sort by highest score
  const sortedCategories = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  
  if (sortedCategories.length > 0) {
    return sortedCategories[0][0] as Category;
  }

  return "General";
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
