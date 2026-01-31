import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validationSchemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ✅ Validate
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // ✅ Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        }
      },
      select: {
        id: true,
        email: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    // Update password
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      }
    });

    return NextResponse.json({ message: "تم تحديث كلمة المرور بنجاح" });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحديث كلمة المرور" },
      { status: 500 }
    );
  }
}