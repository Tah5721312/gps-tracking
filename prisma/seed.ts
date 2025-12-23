import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء إضافة البيانات التجريبية...');

  // حذف البيانات القديمة إذا كانت موجودة
  console.log('🗑️  حذف البيانات القديمة...');
  await prisma.trackingPoint.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.vehicle.deleteMany({});
  console.log('✅ تم حذف البيانات القديمة');

  // إعادة تعيين sequences في PostgreSQL
  console.log('🔄 إعادة تعيين Sequences...');
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Vehicle_id_seq" RESTART WITH 1`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "TrackingPoint_id_seq" RESTART WITH 1`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Trip_id_seq" RESTART WITH 1`);
  console.log('✅ تم إعادة تعيين Sequences');

  // إضافة المركبات
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        name: 'شاحنة 1',
        plateNumber: 'أ ب ج 1234',
        deviceImei: '123456789012345',
        driverName: 'أحمد محمد',
        driverPhone: '01234567890',
        status: 'moving',
        lastLatitude: 30.0444,
        lastLongitude: 31.2357,
        lastSpeed: 45,
        lastUpdate: new Date(),
      } as any, // Temporary until Prisma Client is regenerated
    }),
    prisma.vehicle.create({
      data: {
        name: 'شاحنة 2',
        plateNumber: 'د ه و 5678',
        deviceImei: '123456789012346',
        driverName: 'محمود علي',
        driverPhone: '01123456789',
        status: 'stopped',
        lastLatitude: 30.0500,
        lastLongitude: 31.2400,
        lastSpeed: 0,
        lastUpdate: new Date(),
      } as any, // Temporary until Prisma Client is regenerated
    }),
    prisma.vehicle.create({
      data: {
        name: 'شاحنة 3',
        plateNumber: 'ز ح ط 9012',
        deviceImei: '123456789012347',
        driverName: 'خالد حسن',
        driverPhone: '01012345678',
        status: 'moving',
        lastLatitude: 30.0350,
        lastLongitude: 31.2200,
        lastSpeed: 60,
        lastUpdate: new Date(),
      } as any, // Temporary until Prisma Client is regenerated
    }),
    prisma.vehicle.create({
      data: {
        name: 'شاحنة 4',
        plateNumber: 'ي ك ل 3456',
        deviceImei: '123456789012348',
        driverName: 'عمر سعيد',
        driverPhone: '01501234567',
        status: 'turnoff',
        lastLatitude: 30.0600,
        lastLongitude: 31.2500,
        lastSpeed: 0,
        lastUpdate: new Date(),
      } as any, // Temporary until Prisma Client is regenerated
    }),
  ]);

  console.log(`✅ تم إضافة ${vehicles.length} مركبة`);

  // إضافة نقاط تتبع متعددة الأيام لكل مركبة
  const trackingPoints = [];
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

  // إضافة رحلات تجريبية
  const trips = [];
  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    const startTime = new Date();
    startTime.setHours(8 + i, 30, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 4, 15, 0, 0);

    trips.push(
      prisma.trip.create({
        data: {
          vehicleId: vehicle.id,
          startTime: startTime,
          endTime: endTime,
          distance: Math.random() * 150 + 50,
          avgSpeed: Math.random() * 30 + 25,
          maxSpeed: Math.random() * 40 + 60,
          stops: Math.floor(Math.random() * 5) + 1,
        },
      })
    );
  }

  await Promise.all(trips);
  console.log(`✅ تم إضافة ${trips.length} رحلة`);

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

