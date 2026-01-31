import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET: جلب جميع المستخدمين (ADMIN فقط)
export async function GET(request: NextRequest) {
  try {
    // التحقق من تسجيل الدخول
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // التحقق من أن المستخدم هو ADMIN
    const user = session.user as any;
    const userRole = user.role as string;
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح - يجب أن تكون مدير' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const emailFilter = searchParams.get('email') || '';
    const roleFilter = searchParams.get('role') || '';

    // Build Prisma query conditions
    const where: any = {};

    if (emailFilter) {
      where.email = {
        contains: emailFilter,
        mode: 'insensitive',
      };
    }

    if (roleFilter && (roleFilter === 'USER' || roleFilter === 'ADMIN')) {
      where.role = roleFilter;
    }

    // Fetch users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching users:', errorMessage);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المستخدمين' },
      { status: 500 }
    );
  }
}
