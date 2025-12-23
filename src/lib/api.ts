import { DOMAIN } from './constants';

/**
 * دالة مساعدة لاستخدام DOMAIN تلقائياً في جميع طلبات fetch
 * @param url - الرابط (يمكن أن يكون نسبي مثل /api/vehicles أو كامل)
 * @param options - خيارات fetch العادية
 * @returns Promise<Response>
 */
export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // إذا كان الرابط يبدأ بـ http أو https، استخدمه كما هو
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return fetch(url, options);
  }

  // إذا كان الرابط نسبي (يبدأ بـ /)، أضف DOMAIN قبله
  const fullUrl = url.startsWith('/') 
    ? `${DOMAIN}${url}` 
    : `${DOMAIN}/${url}`;

  return fetch(fullUrl, options);
}

