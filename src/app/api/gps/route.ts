import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// دالة مساعدة لمعالجة بيانات GPS
async function processGPSData(data: any) {
  // دعم البيانات من query parameters (GET) أو body (POST)
  const deviceImei = data.deviceImei || data.imei || data.id;
  const latitude = data.latitude || data.lat;
  const longitude = data.longitude || data.lng || data.lon;
  const speed = data.speed || data.spd || 0;
  const batteryLevel = data.batteryLevel || data.battery || data.bat || 100;
  const timestamp = data.timestamp || data.time || data.date;

  // التحقق من البيانات المطلوبة
  if (!deviceImei || latitude === undefined || longitude === undefined) {
    return {
      error: 'Missing required fields: deviceImei, latitude, longitude',
      status: 400
    };
  }

  // البحث عن المركبة بناءً على IMEI
  const vehicle = await prisma.vehicle.findUnique({
    where: { deviceImei: String(deviceImei) }
  }) as any; // Type assertion مؤقت حتى يتم تحديث Prisma Client

  if (!vehicle) {
    return {
      error: `Vehicle not found with IMEI: ${deviceImei}`,
      status: 404
    };
  }

  // حفظ نقطة التتبع في قاعدة البيانات
  const currentTime = timestamp ? new Date(timestamp) : new Date();
  const currentSpeed = parseFloat(speed || 0);
  const isMoving = currentSpeed > 5;
  const wasMoving = (vehicle.lastSpeed || 0) > 5;
  // إذا كانت المركبة مطفأة (turnoff)، لا نحدث الحالة إلا إذا بدأت الحركة
  const isTurnedOff = vehicle.status === 'turnoff';
  
  const trackingPoint = await prisma.trackingPoint.create({
    data: {
      vehicleId: vehicle.id,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed: currentSpeed,
      batteryLevel: parseInt(batteryLevel || 100),
      timestamp: currentTime
    }
  });

  // حساب وقت الوقوف
  let updateData: any = {
    lastLatitude: parseFloat(latitude),
    lastLongitude: parseFloat(longitude),
    lastSpeed: currentSpeed,
    status: isTurnedOff && !isMoving ? 'turnoff' : (isMoving ? 'moving' : 'stopped'),
    lastUpdate: currentTime
  };

  // إذا كانت المركبة متوقفة الآن
  if (!isMoving) {
    // إذا كانت متحركة قبل ذلك، نبدأ حساب وقت الوقوف
    if (wasMoving && vehicle.lastUpdate) {
      updateData.stoppedAt = currentTime;
    }
    // إذا كانت متوقفة من قبل، نحسب الوقت الإضافي
    else if (!wasMoving && vehicle.stoppedAt && vehicle.lastUpdate) {
      const stoppedDuration = Math.floor((currentTime.getTime() - vehicle.lastUpdate.getTime()) / 1000);
      updateData.totalStoppedTime = (vehicle.totalStoppedTime || 0) + stoppedDuration;
      updateData.stoppedAt = vehicle.stoppedAt; // الحفاظ على وقت بدء الوقوف
    }
    // إذا لم يكن هناك stoppedAt، نبدأ حساب جديد
    else if (!vehicle.stoppedAt) {
      updateData.stoppedAt = currentTime;
    }
  }
  // إذا كانت المركبة متحركة الآن
  else {
    // إذا كانت متوقفة قبل ذلك، نحسب وقت الوقوف ونضيفه
    if (!wasMoving && vehicle.stoppedAt && vehicle.lastUpdate) {
      const stoppedDuration = Math.floor((currentTime.getTime() - vehicle.lastUpdate.getTime()) / 1000);
      updateData.totalStoppedTime = (vehicle.totalStoppedTime || 0) + stoppedDuration;
    }
    // إعادة تعيين stoppedAt لأن المركبة تتحرك الآن
    updateData.stoppedAt = null;
  }

  // تحديث آخر موقع للمركبة
  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: updateData
  });

  // التحقق من الرحلات الجارية والتحقق من الوصول للوجهة
  const activeTrips = await prisma.trip.findMany({
    where: {
      vehicleId: vehicle.id,
      endTime: null // رحلات جارية فقط
    }
  }) as any[]; // Temporary until Prisma Client is regenerated

  // حساب المسافة للوجهة لكل رحلة جارية
  for (const trip of activeTrips) {
    if (trip.destinationLat && trip.destinationLng && 
        (trip.arrivalStatus === 'in_progress' || trip.arrivalStatus === 'not_set' || !trip.arrivalStatus)) {
      const distanceToDestination = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        trip.destinationLat,
        trip.destinationLng
      );

      // إذا كانت المسافة أقل من 100 متر، نعتبر أن المركبة وصلت
      if (distanceToDestination < 0.1 && trip.arrivalStatus !== 'arrived') {
        await prisma.trip.update({
          where: { id: trip.id },
          data: {
            arrivalStatus: 'arrived',
            arrivalTime: currentTime
          } as any
        });
      }
    }
  }

  return {
    success: true,
    trackingPoint,
    vehicle: updatedVehicle
  };
}

// دالة لحساب المسافة بين نقطتين (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // المسافة بالكيلومتر
}

// POST: استقبال بيانات GPS من الأجهزة (JSON)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await processGPSData(data);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('GPS POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET: استقبال بيانات GPS من الأجهزة (Query Parameters) - لبعض أنواع الأجهزة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const data: any = {};
    
    // استخراج البيانات من query parameters
    searchParams.forEach((value, key) => {
      data[key] = value;
    });

    const result = await processGPSData(data);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // بعض الأجهزة تتوقع رد بسيط مثل "OK"
    return NextResponse.json({ success: true, message: 'OK' });
  } catch (error) {
    console.error('GPS GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

