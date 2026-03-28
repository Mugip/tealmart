// i18n.ts
import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

// Define your supported languages
const locales = ['en', 'fr', 'es', 'sw']

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound()
  }

  return {
    // ✅ FIXED: You must explicitly return the locale string here 
    // to satisfy the latest next-intl type requirements.
    locale, 
    messages: (await import(`./messages/${locale}.json`)).default
  }
})
