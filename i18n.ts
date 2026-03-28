// i18n.ts
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const locales = ['en', 'fr', 'es', 'sw'];

export default getRequestConfig(async () => {
  // Read the locale from the cookie we set in the middleware
  const cookieStore = cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  
  // Default to 'en' if no cookie is found
  const locale = locales.includes(localeCookie as any) ? localeCookie : 'en';

  return {
    locale: locale as string,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
