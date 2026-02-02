import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    // التحقق من تسجيل الدخول
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const userId = (session.user as any).userId;
    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم غير موجود' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم رفع ملف' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'gpstracking/users',
          resource_type: 'image',
          transformation: [{ width: 300, height: 300, crop: 'fill' }],
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('فشل رفع الصورة'));
          resolve(result as { secure_url: string });
        }
      ).end(buffer);
    });

    // تحديث صورة المستخدم في قاعدة البيانات
    await prisma.user.update({
      where: { id: userId },
      data: {
        image: uploadResult.secure_url,
      } as any,
    });

    return NextResponse.json({
      url: uploadResult.secure_url,
      message: 'تم رفع الصورة بنجاح',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء رفع الصورة' },
      { status: 500 }
    );
  }
}
