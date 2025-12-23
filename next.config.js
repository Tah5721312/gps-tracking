/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // إعدادات Prisma للتأكد من عمله بشكل صحيح
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // إعدادات Turbopack (فارغة لتجنب خطأ التكوين)
  turbopack: {},

  // Uncoment to add domain whitelist
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'res.cloudinary.com',
  //     },
  //   ]
  // },
};

module.exports = nextConfig;
