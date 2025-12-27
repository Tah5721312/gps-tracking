import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Note: After running `npx prisma generate` and `npx prisma db push`,
// the dailyReport model should be available in Prisma Client

// دالة لحساب المسافة بين نقطتين (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// دالة لإنشاء/تحديث تقرير يومي من TrackingPoints
async function generateDailyReport(vehicleId: number, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // جلب جميع نقاط التتبع لليوم
  const points = await prisma.trackingPoint.findMany({
    where: {
      vehicleId,
      timestamp: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    orderBy: {
      timestamp: 'asc'
    }
  });

  if (points.length === 0) {
    return null;
  }

  // حساب الإحصائيات
  let totalDistance = 0;
  let maxSpeed = 0;
  let totalSpeed = 0;
  let movingPoints = 0;
  let stops = 0;
  let totalStoppedTime = 0; // بالثواني
  let totalMovingTime = 0; // بالثواني
  let lastStopStart: Date | null = null;
  let longestStop = 0;

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    
    // حساب المسافة
    const distance = calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    totalDistance += distance;

    // تحديث السرعة القصوى
    if (curr.speed > maxSpeed) {
      maxSpeed = curr.speed;
    }

    // حساب الوقت بين النقاط (بالثواني)
    const timeDiff = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000;

    // تحديد إذا كانت المركبة متوقفة (سرعة < 5 كم/س)
    if (curr.speed < 5) {
      if (!lastStopStart) {
        lastStopStart = curr.timestamp;
        stops++;
      }
      totalStoppedTime += timeDiff;
    } else {
      if (lastStopStart) {
        const stopDuration = (curr.timestamp.getTime() - lastStopStart.getTime()) / 1000 / 60; // بالدقائق
        if (stopDuration > longestStop) {
          longestStop = stopDuration;
        }
        lastStopStart = null;
      }
      totalMovingTime += timeDiff;
      totalSpeed += curr.speed;
      movingPoints++;
    }
  }

  // حساب آخر توقف إذا استمر حتى نهاية اليوم
  if (lastStopStart) {
    const stopDuration = (endOfDay.getTime() - lastStopStart.getTime()) / 1000 / 60;
    if (stopDuration > longestStop) {
      longestStop = stopDuration;
    }
  }

  const avgSpeed = movingPoints > 0 ? totalSpeed / movingPoints : 0;
  const totalDuration = Math.floor((lastPoint.timestamp.getTime() - firstPoint.timestamp.getTime()) / 1000 / 60); // بالدقائق

  // إنشاء أو تحديث التقرير اليومي
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  const report = await prisma.dailyReport.upsert({
    where: {
      vehicleId_date: {
        vehicleId,
        date: dateOnly
      }
    },
    update: {
      totalDistance,
      totalDuration,
      totalStoppedTime: Math.floor(totalStoppedTime / 60), // تحويل للدقائق
      totalMovingTime: Math.floor(totalMovingTime / 60), // تحويل للدقائق
      maxSpeed,
      avgSpeed,
      numberOfStops: stops,
      longestStop: Math.floor(longestStop),
      firstMovement: firstPoint.timestamp,
      lastMovement: lastPoint.timestamp,
      startLat: firstPoint.latitude,
      startLng: firstPoint.longitude,
      endLat: lastPoint.latitude,
      endLng: lastPoint.longitude,
      updatedAt: new Date()
    },
    create: {
      vehicleId,
      date: dateOnly,
      totalDistance,
      totalDuration,
      totalStoppedTime: Math.floor(totalStoppedTime / 60),
      totalMovingTime: Math.floor(totalMovingTime / 60),
      maxSpeed,
      avgSpeed,
      numberOfStops: stops,
      longestStop: Math.floor(longestStop),
      firstMovement: firstPoint.timestamp,
      lastMovement: lastPoint.timestamp,
      startLat: firstPoint.latitude,
      startLng: firstPoint.longitude,
      endLat: lastPoint.latitude,
      endLng: lastPoint.longitude
    },
    include: {
      vehicle: {
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        } as any
      }
    }
  });

  return report;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const startTime = searchParams.get('startTime'); // format: HH:mm
    const endTime = searchParams.get('endTime'); // format: HH:mm

    const whereClause: any = {};
    
    // فلتر المركبة
    if (vehicleId && vehicleId !== 'all') {
      whereClause.vehicleId = parseInt(vehicleId);
    }
    
    // فلتر التاريخ - تبسيط المنطق
    if (startDate || endDate) {
      const dateFilter: any = {};
      
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }
      
      whereClause.date = dateFilter;
    }

    // جلب التقارير الموجودة مع الفلاتر
    let reports = await prisma.dailyReport.findMany({
      where: whereClause,
      include: {
        vehicle: {
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          } as any
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // إذا كان هناك تاريخ محدد، تأكد من إنشاء التقارير لجميع الأيام
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date('2000-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-12-31');
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      const vehicleIds = vehicleId && vehicleId !== 'all' 
        ? [parseInt(vehicleId)] 
        : await prisma.vehicle.findMany({ select: { id: true } }).then(v => v.map(v => v.id));
      
      for (const vid of vehicleIds) {
        const currentDate = new Date(start);
        while (currentDate <= end) {
          // تحقق إذا كان التقرير موجود
          const dateOnly = new Date(currentDate);
          dateOnly.setHours(0, 0, 0, 0);
          
          const existingReport = reports.find((r: any) => 
            r.vehicleId === vid && 
            r.date.toISOString().split('T')[0] === dateOnly.toISOString().split('T')[0]
          );

          if (!existingReport) {
            // إنشاء التقرير من TrackingPoints
            const report = await generateDailyReport(vid, currentDate);
            if (report) {
              reports.push(report);
            }
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      // إعادة ترتيب التقارير
      reports.sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
    }
    
    // فلترة إضافية حسب الوقت إذا كان محدداً (بعد جلب البيانات)
    if (startTime || endTime) {
      reports = reports.filter((report: any) => {
        if (!report.firstMovement || !report.lastMovement) return false;
        
        if (startTime) {
          const [hours, minutes] = startTime.split(':').map(Number);
          const startDateTime = new Date(report.date);
          startDateTime.setHours(hours || 0, minutes || 0, 0, 0);
          if (new Date(report.lastMovement) < startDateTime) return false;
        }
        
        if (endTime) {
          const [hours, minutes] = endTime.split(':').map(Number);
          const endDateTime = new Date(report.date);
          endDateTime.setHours(hours || 23, minutes || 59, 59, 999);
          if (new Date(report.firstMovement) > endDateTime) return false;
        }
        
        return true;
      });
    }

    // تنسيق البيانات للعرض
    const formattedReports = reports.map((report: any) => ({
      id: report.id,
      vehicleId: report.vehicleId,
      date: report.date.toISOString().split('T')[0],
      startTime: report.firstMovement 
        ? new Date(report.firstMovement).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        : '-',
      endTime: report.lastMovement
        ? new Date(report.lastMovement).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        : '-',
      distance: report.totalDistance,
      duration: `${Math.floor(report.totalDuration / 60)}س ${report.totalDuration % 60}د`,
      stops: report.numberOfStops,
      avgSpeed: report.avgSpeed,
      maxSpeed: report.maxSpeed,
      vehicle: report.vehicle,
      driverName: report.vehicle?.driver?.name || null
    }));

    // حساب الإحصائيات الإجمالية
    const stats = {
      totalDistance: reports.reduce((sum: number, r: any) => sum + r.totalDistance, 0),
      totalTrips: reports.length,
      avgSpeed: reports.length > 0 
        ? reports.reduce((sum: number, r: any) => sum + r.avgSpeed, 0) / reports.length 
        : 0,
      totalStops: reports.reduce((sum: number, r: any) => sum + r.numberOfStops, 0)
    };

    return NextResponse.json({ trips: formattedReports, stats });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}