import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - جلب جميع السائقين
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const whereClause: any = {};
    
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
    const body = await request.json();
    const { name, phone, address, nationalId, province, birthDate, notes } = body;

    // التحقق من الحقول المطلوبة
    if (!name || !phone || !address) {
      return NextResponse.json(
        { error: 'الاسم ورقم التليفون والعنوان مطلوبون' },
        { status: 400 }
      );
    }

    // التحقق من عدم تكرار رقم التليفون
    const existingDriver = await (prisma as any).driver.findUnique({
      where: { phone }
    });

    if (existingDriver) {
      return NextResponse.json(
        { error: 'رقم التليفون مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // التحقق من عدم تكرار الرقم القومي إذا كان موجوداً
    if (nationalId) {
      const existingNationalId = await (prisma as any).driver.findUnique({
        where: { nationalId }
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
  } catch (error) {
    console.error('Error creating driver:', error);
    return NextResponse.json(
      { error: 'Failed to create driver', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

