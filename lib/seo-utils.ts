// lib/seo-utils.ts

export interface SEOConfig {
  title: string;
  category: string | null;
  maxPrice: number | null;
  sort: string;
  description: string;
}

export function parseSEOSlug(slug: string): SEOConfig {
  const parts = slug.split('-');
  
  let maxPrice: number | null = null;
  let category: string | null = null;
  let sort = 'createdAt';
  let titleParts: string[] = [];

  // 1. Detect Price (e.g., "under-50")
  const underIndex = parts.indexOf('under');
  if (underIndex !== -1 && parts[underIndex + 1]) {
    maxPrice = parseInt(parts[underIndex + 1]);
  }

  // 2. Detect Intent/Sort
  if (parts.includes('best') || parts.includes('top')) {
    sort = 'rating';
    titleParts.push('Best');
  } else if (parts.includes('cheap') || parts.includes('affordable')) {
    sort = 'price-asc';
    titleParts.push('Affordable');
  } else if (parts.includes('new') || parts.includes('latest')) {
    sort = 'createdAt';
    titleParts.push('Latest');
  }

  // 3. Detect Category (The remaining words)
  // Logic: Filter out keywords like 'best', 'under', '50', etc.
  const keywords = ['best', 'top', 'rated', 'under', 'cheap', 'affordable', 'new', 'latest', 'in', 'for'];
  const categoryParts = parts.filter(p => !keywords.includes(p) && isNaN(parseInt(p)));
  
  if (categoryParts.length > 0) {
    category = categoryParts.join(' ');
    titleParts.push(category.charAt(0).toUpperCase() + category.slice(1));
  } else {
    titleParts.push('Products');
  }

  if (maxPrice) titleParts.push(`under $${maxPrice}`);

  const title = titleParts.join(' ');
  const description = `Shop the ${title.toLowerCase()} at TealMart. Verified quality, fast global shipping, and unbeatable prices on all ${category || 'our'} items.`;

  return { title, category, maxPrice, sort, description };
}
