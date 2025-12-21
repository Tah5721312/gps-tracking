import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: جلب مركبة محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(id) }
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ vehicle });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle' },
      { status: 500 }
    );
  }
}

// PUT: تحديث مركبة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const vehicle = await prisma.vehicle.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        plateNumber: data.plateNumber,
        deviceImei: data.deviceImei,
        driverName: data.driverName || null,
        driverPhone: data.driverPhone || null,
        status: data.status || 'turnoff'
      } as any // Temporary until Prisma Client is regenerated
    });

    return NextResponse.json({ vehicle });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to update vehicle', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: حذف مركبة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vehicleId = parseInt(id);
    
    // حذف جميع نقاط التتبع المرتبطة
    await prisma.trackingPoint.deleteMany({
      where: { vehicleId: vehicleId }
    });

    // حذف جميع الرحلات المرتبطة
    await prisma.trip.deleteMany({
      where: { vehicleId: vehicleId }
    });

    // حذف المركبة
    await prisma.vehicle.delete({
      where: { id: vehicleId }
    });

    return NextResponse.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to delete vehicle', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

