'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Menu, X, LogIn, UserPlus, LogOut, Activity } from 'lucide-react';
import UserImageUpload from './UserImageUpload';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAuthenticated = status === 'authenticated' && !!session?.user;

  const commonItems: Array<{
    href: string;
    label: string;
  }> = [
      // { href: '/map', label: 'الخريطة المباشرة' },
      // { href: '/dashboard', label: 'لوحة التحكم' },
      // { href: '/items', label: 'إدارة السائقين/المستخدمين' },
      // { href: '/item-type', label: 'التقارير و الحصائيات' },
    ];

  const NavLink = ({ href, label, icon: Icon, onClick }: any) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 group ${isActive
          ? 'bg-blue-50 text-blue-600 shadow-sm'
          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
          }`}
      >
        {isActive && (
          <span className="absolute inset-x-0 -bottom-px h-px bg-linear-to-r from-transparent via-blue-600 to-transparent md:hidden" />
        )}
        {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />}
        {label}
      </Link>
    );
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${scrolled
        ? 'bg-white/90 backdrop-blur-md border-gray-200 shadow-lg shadow-gray-100/50'
        : 'bg-white border-transparent shadow-none'
        }`}
      dir="rtl"
    >
      <div className="bg-blue-100 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="shrink-0 flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                <Activity className="w-6 h-6 animate-pulse" />
                <div className="absolute inset-0 rounded-xl bg-white opacity-20 group-hover:opacity-0 transition-opacity" />
              </div>
              <div className="flex flex-col">
                <span className="bg-linear-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent font-extrabold text-xl tracking-tight">
                  GPS Tracking
                </span>
                <span className="text-xs text-gray-500 font-medium tracking-wide">
                  نظام التتبع الذكي
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated && commonItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}

            <div className="h-6 w-px bg-gray-200 mx-2" />

            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${pathname === '/login'
                    ? 'text-white bg-linear-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                >
                  <LogIn className="w-4 h-4" />
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${pathname === '/register'
                    ? 'text-white bg-linear-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                >
                  <UserPlus className="w-4 h-4" />
                  مستخدم جديد
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="pt-4 [&_img]:w-15! [&_img]:h-15! [&_img]:border-2! [&_img]:border-white! [&_img]:shadow-md!">
                    <UserImageUpload />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-400 font-medium">مرحباً بك</span>
                    <span className="text-sm font-bold text-gray-800">{(session?.user as any)?.name || 'مستخدم'}</span>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-all duration-300 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  خروج
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-2.5 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div
        className={`md:hidden fixed top-20 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-xl transition-all duration-300 transform origin-top ${isMobileOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
          }`}
      >
        <div className="px-4 py-6 space-y-3">
          {isAuthenticated && commonItems.map((item) => (
            <Link
              key={`mobile-${item.href}`}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${pathname === item.href
                ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              {item.label}
            </Link>
          ))}

          {!isAuthenticated ? (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
              <Link
                href="/login"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${pathname === '/login'
                  ? 'text-white bg-blue-600 shadow-lg shadow-blue-500/30'
                  : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                  }`}
              >
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${pathname === '/register'
                  ? 'text-white bg-blue-600 shadow-lg shadow-blue-500/30'
                  : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                  }`}
              >
                <UserPlus className="w-4 h-4" />
                مستخدم جديد
              </Link>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div className="px-2 flex items-center gap-3">
                <div className="[&_img]:w-10! [&_img]:h-10! [&_img]:border-2! [&_img]:border-gray-200!">
                  <UserImageUpload />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">تم تسجيل الدخول كـ</span>
                  <span className="text-sm font-bold text-gray-900">{(session?.user as any)?.name || 'مستخدم'}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  signOut({ redirect: true, callbackUrl: '/login' });
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
