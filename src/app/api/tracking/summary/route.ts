import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ملخص الأيام التي تحركت فيها المركبة مع أول وآخر وقت
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const daysParam = searchParams.get('days');
    const limitParam = searchParams.get('limit');

    if (!vehicleId) {
      return NextResponse.json({ error: 'vehicleId is required' }, { status: 400 });
    }

    const days = daysParam ? parseInt(daysParam, 10) : 14; // آخر 14 يوم افتراضياً
    const maxPoints = limitParam ? parseInt(limitParam, 10) : 5000;

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const points = await prisma.trackingPoint.findMany({
      where: {
        vehicleId: parseInt(vehicleId, 10),
        timestamp: {
          gte: since,
        },
      },
      select: {
        timestamp: true,
        speed: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
      take: maxPoints,
    });

    const byDate: Record<
      string,
      {
        start: Date;
        end: Date;
        count: number;
        movingCount: number;
      }
    > = {};

    points.forEach((p) => {
      const d = new Date(p.timestamp);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!byDate[key]) {
        byDate[key] = { start: d, end: d, count: 0, movingCount: 0 };
      }
      byDate[key].count += 1;
      if (p.speed > 0) {
        byDate[key].movingCount += 1;
      }
      if (d < byDate[key].start) byDate[key].start = d;
      if (d > byDate[key].end) byDate[key].end = d;
    });

    const result = Object.entries(byDate)
      .map(([date, info]) => ({
        date,
        start: info.start,
        end: info.end,
        count: info.count,
        movingCount: info.movingCount,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({ days: result });
  } catch (error) {
    console.error('Error fetching tracking summary:', error);
    return NextResponse.json({ error: 'Failed to fetch tracking summary' }, { status: 500 });
  }
}

