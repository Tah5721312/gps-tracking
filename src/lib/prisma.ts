// @ts-ignore - Prisma Client import may have type issues in Next.js environment
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// إعدادات Prisma Client مع دعم Neon DB و Vercel
// في Vercel (serverless): كل function call يحتاج Prisma Client جديد
// في Development: نستخدم global caching لتجنب إنشاء اتصالات متعددة
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// في Development فقط: نستخدم global caching
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;

  // إغلاق الاتصال عند إيقاف التطبيق (فقط في development)
  // التحقق من عدم إضافة listener مكرر
  const disconnectListenerKey = '__disconnectListenerAdded';
  if (!(globalForPrisma as any)[disconnectListenerKey]) {
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
    });
    // وضع علامة لتجنب إضافة listener مكرر
    (globalForPrisma as any)[disconnectListenerKey] = true;
  }
}

