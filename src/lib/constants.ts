export const ARTICLE_PER_PAGE = 6;

// استخدام متغيرات البيئة للنشر على Vercel
// ملاحظة: في Vercel، يمكنك تعيين NEXT_PUBLIC_APP_URL أو سيتم استخدام localhost في التطوير
const getDomain = () => {
  // أولوية: NEXT_PUBLIC_APP_URL (يجب تعيينه في Vercel Environment Variables)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // في الإنتاج: استخدام NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    // في Vercel: يمكنك تعيين NEXT_PUBLIC_APP_URL في Environment Variables
    // أو استخدام VERCEL_URL (لكن يجب تعيينه كـ NEXT_PUBLIC_VERCEL_URL)
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    }
    // افتراضي للإنتاج (يجب تعيين NEXT_PUBLIC_APP_URL في Vercel)
    return 'https://your-app.vercel.app';
  }
  
  // التطوير المحلي
  return 'http://localhost:3000';
};

export const DOMAIN = getDomain();
