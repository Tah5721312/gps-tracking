import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - جلب سائق محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    const driver = await (prisma as any).driver.findUnique({
      where: { id },
      include: {
        vehicles: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
            status: true
          }
        }
      }
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'السائق غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(driver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - تحديث سائق
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();
    const { name, phone, address, nationalId, province, birthDate, notes } = body;

    // التحقق من الحقول المطلوبة
    if (!name || !phone || !address) {
      return NextResponse.json(
        { error: 'الاسم ورقم التليفون والعنوان مطلوبون' },
        { status: 400 }
      );
    }

    // التحقق من وجود السائق
    const existingDriver = await (prisma as any).driver.findUnique({
      where: { id }
    });

    if (!existingDriver) {
      return NextResponse.json(
        { error: 'السائق غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من عدم تكرار رقم التليفون (إذا تم تغييره)
    if (phone !== existingDriver.phone) {
      const phoneExists = await (prisma as any).driver.findUnique({
        where: { phone }
      });

      if (phoneExists) {
        return NextResponse.json(
          { error: 'رقم التليفون مستخدم بالفعل' },
          { status: 400 }
        );
      }
    }

    // التحقق من عدم تكرار الرقم القومي (إذا تم تغييره)
    if (nationalId && nationalId !== existingDriver.nationalId) {
      const nationalIdExists = await (prisma as any).driver.findUnique({
        where: { nationalId }
      });

      if (nationalIdExists) {
        return NextResponse.json(
          { error: 'الرقم القومي مستخدم بالفعل' },
          { status: 400 }
        );
      }
    }

    const driver = await (prisma as any).driver.update({
      where: { id },
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
        vehicles: {
          select: {
            id: true,
            name: true,
            plateNumber: true
          }
        }
      }
    });

    return NextResponse.json(driver);
  } catch (error) {
    console.error('Error updating driver:', error);
    return NextResponse.json(
      { error: 'Failed to update driver', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - حذف سائق
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    // التحقق من وجود السائق
    const driver = await (prisma as any).driver.findUnique({
      where: { id },
      include: {
        vehicles: true
      }
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'السائق غير موجود' },
        { status: 404 }
      );
    }

    // إذا كان السائق مرتبط بمركبات، إزالة الربط أولاً
    if (driver.vehicles.length > 0) {
      await prisma.vehicle.updateMany({
        where: { driverId: id } as any,
        data: { driverId: null } as any
      });
    }

    // حذف السائق
    await (prisma as any).driver.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'تم حذف السائق بنجاح' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json(
      { error: 'Failed to delete driver', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

