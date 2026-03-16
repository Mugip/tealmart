// lib/productClassifier.ts

/**
 * Extracts the MOST SPECIFIC category from CJ's hierarchical format
 * Example:
 * "Electronics > Mobile > Phones" → "phones"
 */
function extractMostSpecificCategory(cjCategory: string): string {
  if (!cjCategory || cjCategory.trim() === "") {
    return "";
  }

  const parts = cjCategory
    .split(/[/>]/)
    .map((p) => p.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts[parts.length - 1] : "";
}

/**
 * Converts category name to URL-safe slug
 */
function categoryToSlug(category: string): string {
  if (!category || category.trim() === "") {
    return "";
  }

  let slug = category
    .toLowerCase()
    .trim()
    .replace(/women's/g, "womens")
    .replace(/men's/g, "mens")
    .replace(/children's/g, "childrens")
    .replace(/\s*&\s*/g, "-and-")
    .replace(/\s*\/\s*/g, "-")
    .replace(/\s*>\s*/g, "-")
    .replace(/,\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug;
}

/**
 * Main classifier
 */
export function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): string {
  if (!cjCategory || cjCategory.trim() === "") {
    return "general";
  }

  const specificCategory = extractMostSpecificCategory(cjCategory);

  if (!specificCategory) {
    return "general";
  }

  const slug = categoryToSlug(specificCategory);

  return slug || "general";
}

/**
 * Convert slug back to readable name
 */
export function formatCategoryName(slug: string): string {
  if (!slug || slug === "general") {
    return "All Products";
  }

  return slug
    .split("-")
    .map((word) => {
      if (word === "and") return "&";
      if (word === "womens") return "Women's";
      if (word === "mens") return "Men's";
      if (word === "childrens") return "Children's";

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/**
 * Category icon helper
 */
export function getCategoryIcon(slug: string): string {
  const lower = slug.toLowerCase();

  if (lower.includes("phone") || lower.includes("mobile")) return "📱";
  if (lower.includes("laptop")) return "💻";
  if (lower.includes("watch")) return "⌚";
  if (lower.includes("chair") || lower.includes("sofa")) return "🪑";
  if (lower.includes("bed")) return "🛏️";
  if (lower.includes("lamp") || lower.includes("light")) return "💡";

  if (lower.includes("dress")) return "👗";
  if (lower.includes("shirt") || lower.includes("top")) return "👔";
  if (lower.includes("pants") || lower.includes("jeans")) return "👖";
  if (lower.includes("jacket")) return "🧥";
  if (lower.includes("shoe") || lower.includes("sneaker")) return "👟";

  if (lower.includes("makeup")) return "💄";
  if (lower.includes("perfume")) return "🌸";
  if (lower.includes("skincare")) return "🧴";

  if (lower.includes("pot") || lower.includes("pan")) return "🍳";
  if (lower.includes("knife")) return "🔪";
  if (lower.includes("plate") || lower.includes("bowl")) return "🍽️";

  if (lower.includes("camera")) return "📷";
  if (lower.includes("gaming") || lower.includes("console")) return "🎮";
  if (lower.includes("headphone")) return "🎧";

  if (lower.includes("bike")) return "🚴";
  if (lower.includes("soccer") || lower.includes("ball")) return "⚽";
  if (lower.includes("tent") || lower.includes("camping")) return "⛺";

  if (lower.includes("dog")) return "🐕";
  if (lower.includes("cat")) return "🐈";

  if (lower.includes("toy")) return "🧸";
  if (lower.includes("puzzle")) return "🧩";

  if (lower.includes("book")) return "📚";
  if (lower.includes("music")) return "🎵";

  if (lower.includes("hammer") || lower.includes("wrench")) return "🔧";

  if (lower.includes("paint")) return "🎨";

  if (lower.includes("car") || lower.includes("vehicle")) return "🚗";

  return "🛍️";
}
