import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: جلب نقاط التتبع لمركبة معينة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit') || '100';

    const whereClause: any = {};
    
    if (vehicleId) {
      whereClause.vehicleId = parseInt(vehicleId);
    }
    
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const trackingPoints = await prisma.trackingPoint.findMany({
      where: whereClause,
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
            driver: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        }
      } as any,
      orderBy: {
        timestamp: 'desc'
      },
      take: parseInt(limit)
    });

    return NextResponse.json({ trackingPoints });
  } catch (error) {
    console.error('Error fetching tracking points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking points' },
      { status: 500 }
    );
  }
}

