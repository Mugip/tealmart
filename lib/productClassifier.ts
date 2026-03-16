// lib/productClassifier.ts

/**
 * Extracts the FIRST LEVEL category from CJ's hierarchical format
 * Example:
 * "Electronics > Mobile > Phones" → "Electronics"
 */
function extractFirstCategory(cjCategory: string): string {
  if (!cjCategory || cjCategory.trim() === "") {
    return "";
  }

  const parts = cjCategory
    .split(/[>/]/)
    .map((p) => p.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts[0] : "";
}

/**
 * Main classifier
 * Returns CJ first-level category exactly as provided
 */
export function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): string {

  if (!cjCategory || cjCategory.trim() === "") {
    return "General";
  }

  const rootCategory = extractFirstCategory(cjCategory);

  return rootCategory || "General";
}

/**
 * Format category name for display
 * Since we already keep CJ formatting, just return it
 */
export function formatCategoryName(category: string): string {

  if (!category || category === "General") {
    return "All Products";
  }

  return category;
}

/**
 * Category icon helper
 */
export function getCategoryIcon(category: string): string {

  const lower = category.toLowerCase();

  if (lower.includes("electronics")) return "📱";
  if (lower.includes("clothing") || lower.includes("fashion")) return "👗";
  if (lower.includes("bags") || lower.includes("luggage")) return "👜";
  if (lower.includes("shoes")) return "👟";
  if (lower.includes("jewelry") || lower.includes("watch")) return "💍";
  if (lower.includes("beauty") || lower.includes("hair")) return "💄";
  if (lower.includes("home") || lower.includes("garden") || lower.includes("furniture")) return "🏠";
  if (lower.includes("pet")) return "🐾";
  if (lower.includes("toy") || lower.includes("kids") || lower.includes("baby")) return "🧸";
  if (lower.includes("sports") || lower.includes("outdoor")) return "⚽";
  if (lower.includes("automotive") || lower.includes("car")) return "🚗";
  if (lower.includes("tools") || lower.includes("hardware")) return "🔧";

  return "🛍️";
}
