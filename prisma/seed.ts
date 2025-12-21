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

  // إضافة نقاط تتبع للمركبات
  const trackingPoints = [];
  for (const vehicle of vehicles) {
    // إضافة 5 نقاط تتبع لكل مركبة
    for (let i = 0; i < 5; i++) {
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - i * 10);
      
      trackingPoints.push(
        prisma.trackingPoint.create({
          data: {
            vehicleId: vehicle.id,
            latitude: vehicle.lastLatitude! + (Math.random() - 0.5) * 0.01,
            longitude: vehicle.lastLongitude! + (Math.random() - 0.5) * 0.01,
            speed: (vehicle.status === 'moving' || vehicle.status === 'MOVING') ? Math.random() * 80 : 0,
            batteryLevel: Math.floor(Math.random() * 30) + 70,
            timestamp: timestamp,
          },
        })
      );
    }
  }

  await Promise.all(trackingPoints);
  console.log(`✅ تم إضافة ${trackingPoints.length} نقطة تتبع`);

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

