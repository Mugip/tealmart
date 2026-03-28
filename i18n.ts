// i18n.ts
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// 1. Define your supported languages
const locales = ['en', 'fr', 'es', 'sw'];

export default getRequestConfig(async ({ locale }) => {
  // 2. Explicitly validate that the locale is a string and is supported
  // This "type guard" ensures that if we proceed, locale is definitely a valid string
  if (!locale || !locales.includes(locale as any)) {
    notFound();
  }

  return {
    // 3. We pass the locale back as a guaranteed string.
    // The "as string" tells TypeScript: "I have verified this is not undefined."
    locale: locale as string,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
