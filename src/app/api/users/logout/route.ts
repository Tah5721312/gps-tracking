import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'Not logged in' }, { status: 401 });
    }

    // حذف الكوكيز الخاصة بالجلسة
    const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });

    // حذف جميع الكوكيز المتعلقة بـ NextAuth
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('__Secure-next-auth.session-token');
    response.cookies.delete('next-auth.csrf-token');
    response.cookies.delete('__Host-next-auth.csrf-token');
    response.cookies.delete('next-auth.callback-url');
    response.cookies.delete('__Secure-next-auth.callback-url');

    return response;
  } catch (error) {
    console.error('Logout Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
