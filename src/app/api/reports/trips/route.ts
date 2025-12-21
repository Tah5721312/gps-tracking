import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = {};
    
    if (vehicleId) {
      whereClause.vehicleId = parseInt(vehicleId);
    }
    
    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
            driverName: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    // حساب الإحصائيات
    const stats = {
      totalDistance: trips.length > 0 ? trips.reduce((sum, trip) => sum + trip.distance, 0) : 0,
      totalTrips: trips.length,
      avgSpeed: trips.length > 0 ? trips.reduce((sum, trip) => sum + trip.avgSpeed, 0) / trips.length : 0,
      totalStops: trips.reduce((sum, trip) => sum + trip.stops, 0)
    };

    return NextResponse.json({ trips, stats });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}