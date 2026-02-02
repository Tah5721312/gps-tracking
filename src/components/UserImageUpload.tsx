'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function UserImageUpload({ onUploaded }: { onUploaded?: (url: string) => void }) {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>((session?.user as any)?.image || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تحديث الصورة عند تغيير الـ session
  useEffect(() => {
    const sessionImage = (session?.user as any)?.image;
    if (sessionImage && sessionImage !== imageUrl) {
      setImageUrl(sessionImage);
    }
  }, [session]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل رفع الصورة');
      }

      // تحديث الصورة المحلية في الواجهة
      setImageUrl(data.url);

      // تحديث الـ session لتحديث الصورة في NextAuth context
      await update();

      if (onUploaded) {
        onUploaded(data.url);
      }

      // إعادة تعيين input للسماح برفع نفس الصورة مرة أخرى إذا لزم الأمر
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    if (!loading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative inline-block">
        <img
          src={imageUrl ? `${imageUrl}?t=${Date.now()}` : '/avatar.png'}
          alt="User Avatar"
          onClick={handleImageClick}
          className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full pointer-events-none">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={loading}
        style={{ display: 'none' }}
      />
      {loading && <p className="text-xs text-gray-500">جاري رفع الصورة...</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
