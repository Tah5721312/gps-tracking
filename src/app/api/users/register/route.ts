import { registerSchema } from '@/lib/validationSchemas';
import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from "@/lib/prisma";

/**
 *  @method  POST
 *  @route   ~/api/users/register
 *  @desc    Create New User [(Register) (Sign Up) (انشاء حساب)]
 *  @access  public
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ✅ Validate
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // ✅ Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: body.email, mode: 'insensitive' }
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // ✅ Insert user (role defaults to USER in schema)
    const newUser = await prisma.user.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        password: hashedPassword,
        role: 'USER', // Default role from enum
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      }
    });

    const userResponse = {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role
    };

    return NextResponse.json(
      { ...userResponse, message: "تم التسجيل بنجاح. يرجى تسجيل الدخول" },
      { status: 201 }
    );

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء التسجيل' },
      { status: 500 }
    );
  }
}
