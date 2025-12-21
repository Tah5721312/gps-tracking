/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // إعدادات Prisma للتأكد من عمله بشكل صحيح
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // Uncoment to add domain whitelist
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'res.cloudinary.com',
  //     },
  //   ]
  // },

  // إعدادات Turbopack
  turbopack: {
    // يمكن إضافة إعدادات Turbopack هنا إذا لزم الأمر
  },
};

module.exports = nextConfig;
