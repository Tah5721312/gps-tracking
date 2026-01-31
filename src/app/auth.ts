import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here',
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours when user is active
  },
  pages: {
    signIn: "/login", // تحديد صفحة الـ login
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email || "").toString().trim();
        const password = (credentials?.password || "").toString();

        if (!email || !password) {
          console.log("❌ Missing email or password");
          return null;
        }

        try {
          // التحقق من الاتصال بقاعدة البيانات أولاً
          await prisma.$connect();

          const user = await prisma.user.findFirst({
            where: {
              email: {
                equals: email,
                mode: 'insensitive',
              },
              isActive: true,
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              password: true,
              role: true,
            },
          });

          if (!user) {
            console.log(`❌ User not found or inactive: ${email}`);
            // محاولة البحث بدون شرط isActive للتحقق
            const inactiveUser = await prisma.user.findFirst({
              where: {
                email: {
                  equals: email,
                  mode: 'insensitive',
                },
              },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                isActive: true,
              },
            });
            if (inactiveUser) {
              console.log(`⚠️ User found but inactive: ${email}, isActive: ${inactiveUser.isActive}`);
            }
            return null;
          }

          // التحقق من كلمة المرور
          const ok = await compare(password, user.password);

          if (!ok) {
            console.log(`❌ Password mismatch for user: ${email}`);
            return null;
          }

          const userSession = {
            id: String(user.id),
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
          };

          console.log(`✅ Authentication successful for user: ${email}`);
          return userSession as any;
        } catch (err: any) {
          // تسجيل الأخطاء بشكل مفصل
          console.error("❌ Authorization error:", {
            message: err.message,
            stack: err.stack,
            name: err.name,
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // JWT callback يتم استدعاؤه بشكل متكرر - لا نضع console logs هنا
      if (user) {
        token.id = (user as any).id;
        token.userId = (user as any).id;
        token.role = (user as any).role ?? 'USER';
      }

      return token;
    },
    async session({ session, token }) {
      // Session callback يتم استدعاؤه بشكل متكرر - لا نضع console logs هنا
      session.user = {
        id: String((token as any).id ?? (token as any).userId ?? ""),
        userId: Number((token as any).userId ?? (token as any).id ?? 0),
        name: session.user?.name || "",
        email: session.user?.email || "",
        role: String((token as any).role ?? 'USER'),
      } as any;

      return session;
    },
  },
  debug: false, // تعطيل debug logs لتجنب التكرار المفرط
};
