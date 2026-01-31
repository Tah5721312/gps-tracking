import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

// DELETE: حذف مستخدم (ADMIN فقط)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const sessionUser = session.user as any;
    const userRole = sessionUser.role as string;
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح - يجب أن تكون مدير' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: 'معرف المستخدم غير صحيح' },
        { status: 400 }
      );
    }

    // التحقق من وجود المستخدم
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // منع حذف المستخدم الحالي (الذي يقوم بالحذف)
    const currentUserId = parseInt(sessionUser.id as string);
    if (userId === currentUserId) {
      return NextResponse.json(
        { error: 'لا يمكنك حذف حسابك الخاص' },
        { status: 400 }
      );
    }

    // حذف المركبات المرتبطة بالمستخدم (Cascade)
    await prisma.vehicle.deleteMany({
      where: { userId: userId },
    });

    // حذف السائقين المرتبطين بالمستخدم (Cascade)
    await (prisma as any).driver.deleteMany({
      where: { userId: userId },
    });

    // حذف المستخدم
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json(
      { message: 'تم حذف المستخدم بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المستخدم' },
      { status: 500 }
    );
  }
}

// GET: جلب مستخدم محدد (ADMIN فقط)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const sessionUser = session.user as any;
    const userRole = sessionUser.role as string;
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح - يجب أن تكون مدير' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: 'معرف المستخدم غير صحيح' },
        { status: 400 }
      );
    }

    // جلب المستخدم
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المستخدم' },
      { status: 500 }
    );
  }
}

// PUT: تحديث مستخدم (ADMIN فقط)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const sessionUser = session.user as any;
    const userRole = sessionUser.role as string;
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح - يجب أن تكون مدير' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: 'معرف المستخدم غير صحيح' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, email, role, isActive } = body;

    // التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من البريد الإلكتروني إذا تم تغييره
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: { equals: email, mode: 'insensitive' },
          NOT: { id: userId },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مستخدم بالفعل' },
          { status: 409 }
        );
      }
    }

    // تحديث المستخدم
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email: email.toLowerCase() }),
        ...(role && (role === 'USER' || role === 'ADMIN') && { role }),
        ...(isActive !== undefined && { isActive }),
      },
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
    });

    return NextResponse.json(
      {
        message: 'تم تحديث المستخدم بنجاح',
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث المستخدم' },
      { status: 500 }
    );
  }
}

