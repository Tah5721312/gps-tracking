import { getServerSession } from "next-auth";
import { authOptions } from "./app/auth";
import { DOMAIN } from "@/lib/constants";

export { authOptions };

// Extended session user type
export interface SessionUser {
  id: string;
  userId?: number;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

// Helper function to get session in API routes
export async function auth() {
  return await getServerSession(authOptions);
}

// Helper function to get user from session with proper typing
export function getSessionUser(session: any): SessionUser | null {
  if (!session?.user) return null;
  return session.user as SessionUser;
}

// Helper function for signIn in API routes
export async function signIn(
  provider: string,
  options: { redirect?: boolean; email?: string; password?: string }
) {
  // في NextAuth v4، نستخدم NextAuth API endpoint مباشرة
  // استخدام DOMAIN من constants.ts لتجنب التكرار
  const baseUrl = process.env.NEXTAUTH_URL || DOMAIN;

  try {
    const response = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: options.email || '',
        password: options.password || '',
        redirect: options.redirect === false ? 'false' : 'true',
        json: 'true',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { error: error.error || 'Authentication failed' };
    }

    return { ok: true };
  } catch (error) {
    return { error: 'Authentication failed' };
  }
}

