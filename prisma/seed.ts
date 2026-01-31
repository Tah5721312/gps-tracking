import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء إضافة البيانات التجريبية...');

  // حذف البيانات القديمة إذا كانت موجودة
  console.log('🗑️  حذف البيانات القديمة...');
  await prisma.trackingPoint.deleteMany({});
  await (prisma as any).dailyReport.deleteMany({});
  await (prisma as any).alert.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await (prisma as any).driver.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ تم حذف البيانات القديمة');

  // إعادة تعيين sequences في PostgreSQL
  console.log('🔄 إعادة تعيين Sequences...');
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Vehicle_id_seq" RESTART WITH 1`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "TrackingPoint_id_seq" RESTART WITH 1`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Driver_id_seq" RESTART WITH 1`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "DailyReport_id_seq" RESTART WITH 1`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Alert_id_seq" RESTART WITH 1`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`);
  console.log('✅ تم إعادة تعيين Sequences');

  // إضافة المستخدمين أولاً
  console.log('👤 إضافة المستخدمين...');
  const hashedPassword = await bcrypt.hash('123456', 10); // كلمة مرور افتراضية

  const adminUser = await prisma.user.create({
    data: {
      firstName: 'مدير',
      lastName: 'النظام',
      email: 'tah@gmail.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      firstName: 'مستخدم',
      lastName: 'تجريبي',
      email: 'test@gmail.com',
      password: hashedPassword,
      role: 'USER',
      isActive: true,
    },
  });

  console.log(`✅ تم إضافة ${2} مستخدم (admin@example.com / user@example.com - كلمة المرور: 123456)`);

  // إضافة السائقين (مرتبطين بالمستخدم العادي)
  console.log('👤 إضافة السائقين...');
  const drivers = await Promise.all([
    (prisma as any).driver.create({
      data: {
        name: 'أحمد محمد',
        phone: '01234567890',
        address: 'القاهرة، مصر الجديدة',
        province: 'القاهرة',
        nationalId: '12345678901234',
        userId: regularUser.id, // ربط السائق بالمستخدم العادي
      },
    }),
    (prisma as any).driver.create({
      data: {
        name: 'محمود علي',
        phone: '01123456789',
        address: 'الجيزة، الدقي',
        province: 'الجيزة',
        nationalId: '23456789012345',
        userId: regularUser.id,
      },
    }),
    (prisma as any).driver.create({
      data: {
        name: 'خالد حسن',
        phone: '01012345678',
        address: 'الإسكندرية، سيدي بشر',
        province: 'الإسكندرية',
        nationalId: '34567890123456',
        userId: adminUser.id, // ربط سائق بالمدير
      },
    }),
    (prisma as any).driver.create({
      data: {
        name: 'عمر سعيد',
        phone: '01501234567',
        address: 'القاهرة، المعادي',
        province: 'القاهرة',
        nationalId: '45678901234567',
        userId: regularUser.id,
      },
    }),
  ]);

  console.log(`✅ تم إضافة ${drivers.length} سائق`);

  // إضافة المركبات (مرتبطة بالمستخدمين)
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        name: 'شاحنة 1',
        plateNumber: 'أ ب ج 1234',
        deviceImei: '123456789012345',
        userId: regularUser.id, // ربط المركبة بالمستخدم العادي
        driverId: drivers[0].id,
        status: 'moving',
        lastLatitude: 30.0444,
        lastLongitude: 31.2357,
        lastSpeed: 45,
        lastUpdate: new Date(),
      } as any,
    }),
    prisma.vehicle.create({
      data: {
        name: 'شاحنة 2',
        plateNumber: 'د ه و 5678',
        deviceImei: '123456789012346',
        userId: regularUser.id,
        driverId: drivers[1].id,
        status: 'stopped',
        lastLatitude: 30.0500,
        lastLongitude: 31.2400,
        lastSpeed: 0,
        lastUpdate: new Date(),
      } as any,
    }),
    prisma.vehicle.create({
      data: {
        name: 'شاحنة 3',
        plateNumber: 'ز ح ط 9012',
        deviceImei: '123456789012347',
        userId: adminUser.id, // ربط مركبة بالمدير
        driverId: drivers[2].id,
        status: 'moving',
        lastLatitude: 30.0350,
        lastLongitude: 31.2200,
        lastSpeed: 60,
        lastUpdate: new Date(),
      } as any,
    }),
    prisma.vehicle.create({
      data: {
        name: 'شاحنة 4',
        plateNumber: 'ي ك ل 3456',
        deviceImei: '123456789012348',
        userId: regularUser.id,
        driverId: drivers[3].id,
        status: 'turnoff',
        lastLatitude: 30.0600,
        lastLongitude: 31.2500,
        lastSpeed: 0,
        lastUpdate: new Date(),
      } as any,
    }),
  ]);

  console.log(`✅ تم إضافة ${vehicles.length} مركبة`);

  // إضافة نقاط تتبع متعددة الأيام لكل مركبة
  const trackingPoints: Promise<any>[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOffsets = [0, -1, -2, -3, -4]; // اليوم، أمس، أول أمس... حتى 4 أيام قبل

  const buildRoute = (baseLat: number, baseLng: number, startMinute = 8 * 60) => ([
    { lat: baseLat, lng: baseLng, speed: 40, minutes: startMinute + 0 },
    { lat: baseLat + 0.004, lng: baseLng + 0.003, speed: 42, minutes: startMinute + 10 },
    { lat: baseLat + 0.006, lng: baseLng + 0.007, speed: 0.2, minutes: startMinute + 22 }, // توقف قصير
    { lat: baseLat + 0.010, lng: baseLng + 0.012, speed: 48, minutes: startMinute + 38 },
    { lat: baseLat + 0.013, lng: baseLng + 0.016, speed: 0, minutes: startMinute + 55 }, // توقف واضح
    { lat: baseLat + 0.017, lng: baseLng + 0.018, speed: 50, minutes: startMinute + 70 },
    { lat: baseLat + 0.019, lng: baseLng + 0.014, speed: 32, minutes: startMinute + 85 },
    { lat: baseLat + 0.021, lng: baseLng + 0.009, speed: 0.5, minutes: startMinute + 100 }, // توقف قصير
    { lat: baseLat + 0.022, lng: baseLng + 0.003, speed: 37, minutes: startMinute + 115 },
    { lat: baseLat + 0.023, lng: baseLng - 0.002, speed: 44, minutes: startMinute + 130 },
  ]);

  vehicles.forEach((vehicle, idx) => {
    // أيام حديثة (أسبوع حالي)
    dayOffsets.forEach(offset => {
      const baseLat = (vehicle.lastLatitude || 30.0444) + idx * 0.005 + offset * 0.0005;
      const baseLng = (vehicle.lastLongitude || 31.2357) + idx * 0.005 - offset * 0.0005;
      const startMinute = 7 * 60 + idx * 20; // تباين وقت البدء لكل مركبة
      const route = buildRoute(baseLat, baseLng, startMinute);

      route.forEach(point => {
        const ts = new Date(today);
        ts.setDate(ts.getDate() + offset);
        ts.setMinutes(point.minutes);
        trackingPoints.push(
          prisma.trackingPoint.create({
            data: {
              vehicleId: vehicle.id,
              latitude: point.lat,
              longitude: point.lng,
              speed: point.speed,
              batteryLevel: Math.floor(Math.random() * 20) + 70,
              timestamp: ts,
            },
          })
        );
      });
    });

    // أيام أقدم في نوفمبر (لتجربة فلترة الأشهر)
    const novemberDays = [5, 10, 15, 20, 25];
    novemberDays.forEach(day => {
      const baseLat = (vehicle.lastLatitude || 30.0444) + idx * 0.004 + day * 0.0001;
      const baseLng = (vehicle.lastLongitude || 31.2357) + idx * 0.004 - day * 0.0001;
      const startMinute = 8 * 60 + idx * 15;
      const route = buildRoute(baseLat, baseLng, startMinute);

      route.forEach(point => {
        const ts = new Date(today);
        ts.setMonth(10); // نوفمبر (صفرية)
        ts.setDate(day);
        ts.setMinutes(point.minutes);
        trackingPoints.push(
          prisma.trackingPoint.create({
            data: {
              vehicleId: vehicle.id,
              latitude: point.lat,
              longitude: point.lng,
              speed: point.speed,
              batteryLevel: Math.floor(Math.random() * 20) + 70,
              timestamp: ts,
            },
          })
        );
      });
    });
  });

  await Promise.all(trackingPoints);
  console.log(`✅ تم إضافة ${trackingPoints.length} نقطة تتبع (عدة أيام لكل مركبة)`);

  // إنشاء التقارير اليومية من نقاط التتبع
  console.log('📊 إنشاء التقارير اليومية...');

  // دالة لحساب المسافة بين نقطتين (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // المسافة بالكيلومتر
  };

  // جلب جميع نقاط التتبع
  const allTrackingPoints = await prisma.trackingPoint.findMany({
    orderBy: { timestamp: 'asc' }
  });

  // تجميع النقاط حسب المركبة والتاريخ
  const pointsByVehicleAndDate = new Map<string, any[]>();

  allTrackingPoints.forEach(point => {
    const date = new Date(point.timestamp);
    date.setHours(0, 0, 0, 0);
    const key = `${point.vehicleId}_${date.toISOString().split('T')[0]}`;

    if (!pointsByVehicleAndDate.has(key)) {
      pointsByVehicleAndDate.set(key, []);
    }
    pointsByVehicleAndDate.get(key)!.push(point);
  });

  // إنشاء تقرير لكل مجموعة
  const reports: Promise<any>[] = [];

  for (const [key, points] of Array.from(pointsByVehicleAndDate.entries())) {
    if (points.length < 2) continue; // نحتاج نقطتين على الأقل

    const [vehicleId, dateStr] = key.split('_');
    const reportDate = new Date(dateStr);

    // ترتيب النقاط حسب الوقت
    points.sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime());

    // حساب الإحصائيات
    let totalDistance = 0;
    let maxSpeed = 0;
    let totalSpeed = 0;
    let movingTime = 0; // بالدقائق
    let stoppedTime = 0; // بالدقائق
    let numberOfStops = 0;
    let longestStop = 0; // بالدقائق
    let currentStopStart: Date | null = null;
    let isMoving = false;

    const firstMovement = points[0].timestamp;
    const lastMovement = points[points.length - 1].timestamp;
    const startLat = points[0].latitude;
    const startLng = points[0].longitude;
    const endLat = points[points.length - 1].latitude;
    const endLng = points[points.length - 1].longitude;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      // حساب المسافة
      const distance = calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
      totalDistance += distance;

      // السرعة
      if (curr.speed > maxSpeed) {
        maxSpeed = curr.speed;
      }
      totalSpeed += curr.speed;

      // حساب الوقت بين النقطتين (بالدقائق)
      const timeDiff = (curr.timestamp.getTime() - prev.timestamp.getTime()) / (1000 * 60);

      // تحديد إذا كانت المركبة متحركة (سرعة > 5 كم/س) أو متوقفة
      const wasMoving = prev.speed > 5;
      const isCurrentlyMoving = curr.speed > 5;

      if (isCurrentlyMoving) {
        movingTime += timeDiff;
        if (currentStopStart) {
          // انتهى التوقف
          const stopDuration = (curr.timestamp.getTime() - currentStopStart.getTime()) / (1000 * 60);
          if (stopDuration > longestStop) {
            longestStop = stopDuration;
          }
          currentStopStart = null;
        }
        isMoving = true;
      } else {
        stoppedTime += timeDiff;
        if (!currentStopStart) {
          // بدأ توقف جديد
          currentStopStart = prev.timestamp;
          numberOfStops++;
          isMoving = false;
        }
      }

      // إذا كانت آخر نقطة ومازالت متوقفة
      if (i === points.length - 1 && currentStopStart && !isCurrentlyMoving) {
        const stopDuration = (curr.timestamp.getTime() - currentStopStart.getTime()) / (1000 * 60);
        if (stopDuration > longestStop) {
          longestStop = stopDuration;
        }
      }
    }

    const avgSpeed = points.length > 0 ? totalSpeed / points.length : 0;
    const totalDuration = Math.round((lastMovement.getTime() - firstMovement.getTime()) / (1000 * 60));

    // إنشاء التقرير
    reports.push(
      (prisma as any).dailyReport.create({
        data: {
          vehicleId: parseInt(vehicleId),
          date: reportDate,
          totalDistance: Math.round(totalDistance * 100) / 100, // تقريب لرقمين عشريين
          totalDuration: totalDuration,
          totalStoppedTime: Math.round(stoppedTime),
          totalMovingTime: Math.round(movingTime),
          maxSpeed: Math.round(maxSpeed * 100) / 100,
          avgSpeed: Math.round(avgSpeed * 100) / 100,
          numberOfStops: numberOfStops,
          longestStop: Math.round(longestStop),
          firstMovement: firstMovement,
          lastMovement: lastMovement,
          startLat: startLat,
          startLng: startLng,
          endLat: endLat,
          endLng: endLng,
        },
      })
    );
  }

  await Promise.all(reports);
  console.log(`✅ تم إنشاء ${reports.length} تقرير يومي`);

  console.log('🎉 تم إضافة جميع البيانات التجريبية بنجاح!');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في إضافة البيانات:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

