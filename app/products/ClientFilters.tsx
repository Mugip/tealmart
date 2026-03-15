// app/products/ClientFilters.tsx
'use client'

export function CategorySelect({ 
  categories, 
  defaultValue 
}: { 
  categories: any[]
  defaultValue?: string 
}) {
  return (
    <select
      name="category"
      defaultValue={defaultValue || ''}
      onChange={(e) => {
        const url = new URL(window.location.href)
        if (e.target.value) {
          url.searchParams.set('category', e.target.value)
        } else {
          url.searchParams.delete('category')
        }
        window.location.href = url.toString()
      }}
      className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500"
    >
      <option value="">All Products</option>
      {categories.map((cat) => (
        <option key={cat.name} value={cat.name}>
          {cat.name} ({cat.count})
        </option>
      ))}
    </select>
  )
}
