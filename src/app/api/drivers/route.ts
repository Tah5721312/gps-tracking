import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

// GET - جلب جميع السائقين
export async function GET(request: NextRequest) {
  try {
    // الحصول على المستخدم الحالي
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    const userId = parseInt(user.id as string);
    const userRole = user.role as string;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const whereClause: any = {};

    // ADMIN يرى كل السائقين، USER يرى فقط سائقيه
    if (userRole !== 'ADMIN') {
      whereClause.userId = userId;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const drivers = await (prisma as any).driver.findMany({
      where: whereClause,
      include: {
        vehicles: {
          select: {
            id: true,
            name: true,
            plateNumber: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - إنشاء سائق جديد
export async function POST(request: NextRequest) {
  try {
    // الحصول على المستخدم الحالي
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    const userId = parseInt(user.id as string);

    // التحقق من صحة userId
    if (isNaN(userId) || userId <= 0) {
      console.error('Invalid userId from session:', user.id);
      return NextResponse.json(
        { error: 'خطأ في بيانات المستخدم' },
        { status: 401 }
      );
    }

    // التحقق من وجود المستخدم في قاعدة البيانات
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true }
    });

    if (!existingUser) {
      console.error('User not found in database:', userId);
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    if (!existingUser.isActive) {
      return NextResponse.json(
        { error: 'حساب المستخدم غير نشط' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, phone, address, nationalId, province, birthDate, notes } = body;

    // التحقق من الحقول المطلوبة
    if (!name || !phone || !address) {
      return NextResponse.json(
        { error: 'الاسم ورقم التليفون والعنوان مطلوبون' },
        { status: 400 }
      );
    }

    // التحقق من عدم تكرار رقم التليفون (فقط للمستخدم الحالي)
    const existingDriver = await (prisma as any).driver.findFirst({
      where: {
        phone,
        userId: userId // التحقق فقط ضمن سائقين المستخدم الحالي
      }
    });

    if (existingDriver) {
      return NextResponse.json(
        { error: 'رقم التليفون مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // التحقق من عدم تكرار الرقم القومي إذا كان موجوداً (فقط للمستخدم الحالي)
    if (nationalId) {
      const existingNationalId = await (prisma as any).driver.findFirst({
        where: {
          nationalId,
          userId: userId // التحقق فقط ضمن سائقين المستخدم الحالي
        }
      });

      if (existingNationalId) {
        return NextResponse.json(
          { error: 'الرقم القومي مستخدم بالفعل' },
          { status: 400 }
        );
      }
    }

    const driver = await (prisma as any).driver.create({
      data: {
        name,
        phone,
        address,
        userId: userId, // ربط السائق بالمستخدم الحالي
        nationalId: nationalId || null,
        province: province || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        notes: notes || null
      },
      include: {
        vehicles: true
      }
    });

    return NextResponse.json(driver, { status: 201 });
  } catch (error: any) {
    console.error('Error creating driver:', error);

    // معالجة أخطاء Prisma بشكل أفضل
    if (error.code === 'P2003') {
      const field = error.meta?.field_name;
      if (field === 'userId' || field?.includes('userId')) {
        return NextResponse.json(
          { error: 'المستخدم غير موجود في قاعدة البيانات' },
          { status: 404 }
        );
      }
    }

    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'phone') {
        return NextResponse.json(
          { error: 'رقم التليفون مستخدم بالفعل' },
          { status: 400 }
        );
      }
      if (field === 'nationalId') {
        return NextResponse.json(
          { error: 'الرقم القومي مستخدم بالفعل' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء السائق', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

