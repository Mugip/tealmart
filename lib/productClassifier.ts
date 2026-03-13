// lib/productClassifier.ts

export function classifyProduct(
  title?: string,
  description?: string,
  cjCategory?: string
): string {
  console.log('🔍 ===== CLASSIFICATION DEBUG =====')
  console.log('📝 Title:', title?.substring(0, 100))
  console.log('🏷️  CJ Category (RAW):', cjCategory)
  
  if (cjCategory) {
    // Split by / or > to get hierarchy
    const parts = cjCategory.split(/[/>]/).map(p => p.trim()).filter(Boolean)
    console.log('📊 Category parts:', parts)
    
    if (parts.length > 0) {
      // Use the FIRST category from CJ
      const firstCategory = parts[0]
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .trim()
      
      console.log(`✅ Using first CJ category: "${parts[0]}" → "${firstCategory}"`)
      console.log('🔍 ===== END DEBUG =====\n')
      
      return firstCategory
    }
  }
  
  console.log('⚠️  No CJ category - defaulting to "general"')
  console.log('🔍 ===== END DEBUG =====\n')
  
  return 'general'
}
