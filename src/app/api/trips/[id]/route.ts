import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: جلب رحلة محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const trip = await prisma.trip.findUnique({
      where: { id: parseInt(id) },
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
            driverName: true
          }
        }
      }
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ trip });
  } catch (error) {
    console.error('Error fetching trip:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    );
  }
}

// PUT: تحديث رحلة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const trip = await prisma.trip.update({
      where: { id: parseInt(id) },
      data: {
        vehicleId: data.vehicleId ? parseInt(data.vehicleId) : undefined,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime !== undefined ? (data.endTime ? new Date(data.endTime) : null) : undefined,
        distance: data.distance !== undefined ? parseFloat(data.distance) : undefined,
        avgSpeed: data.avgSpeed !== undefined ? parseFloat(data.avgSpeed) : undefined,
        maxSpeed: data.maxSpeed !== undefined ? parseFloat(data.maxSpeed) : undefined,
        stops: data.stops !== undefined ? parseInt(data.stops) : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        destinationLat: data.destinationLat !== undefined ? (data.destinationLat ? parseFloat(data.destinationLat) : null) : undefined,
        destinationLng: data.destinationLng !== undefined ? (data.destinationLng ? parseFloat(data.destinationLng) : null) : undefined,
        destinationName: data.destinationName !== undefined ? data.destinationName : undefined,
        arrivalStatus: data.arrivalStatus !== undefined ? data.arrivalStatus : undefined
      } as any, // Temporary until Prisma Client is regenerated
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
            driverName: true
          }
        }
      }
    });

    return NextResponse.json({ trip });
  } catch (error) {
    console.error('Error updating trip:', error);
    return NextResponse.json(
      { error: 'Failed to update trip', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: حذف رحلة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.trip.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { error: 'Failed to delete trip', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

