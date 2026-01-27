import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // البيانات المتوقعة من جهاز GPS
    const {
      deviceImei,      // رقم الجهاز الفريد
      latitude,
      longitude,
      speed,
      batteryLevel,
      timestamp
    } = data;

    // البحث عن المركبة بناءً على IMEI
    const vehicle = await prisma.vehicle.findUnique({
      where: { deviceImei }
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // التحقق من البيانات المطلوبة
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: latitude, longitude' },
        { status: 400 }
      );
    }

    // معالجة batteryLevel بشكل صحيح
    let finalBatteryLevel = 100; // القيمة الافتراضية
    if (batteryLevel !== undefined && batteryLevel !== null && String(batteryLevel).trim() !== '') {
      finalBatteryLevel = Number(batteryLevel);
    }
    finalBatteryLevel = Math.max(0, Math.min(100, Math.round(finalBatteryLevel)));

    // حفظ نقطة التتبع في قاعدة البيانات
    const trackingPoint = await prisma.trackingPoint.create({
      data: {
        vehicleId: vehicle.id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        speed: parseFloat(speed || 0),
        batteryLevel: finalBatteryLevel,
        timestamp: timestamp ? new Date(timestamp) : new Date()
      }
    });

    // تحديث آخر موقع للمركبة
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        lastLatitude: parseFloat(latitude),
        lastLongitude: parseFloat(longitude),
        lastSpeed: parseFloat(speed || 0),
        status: parseFloat(speed || 0) > 5 ? 'moving' : 'stopped',
        lastUpdate: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      trackingPoint,
      vehicle: updatedVehicle
    });

  } catch (error) {
    console.error('GPS Update Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}