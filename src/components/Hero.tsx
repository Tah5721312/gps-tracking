'use client';

import Image from 'next/image';
import ThreeDGallery from '@/components/ThreeDGallery';

export default function Hero() {
  return (
    <header className=''>
      <div className='container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-center my-10'>
        {/* البلوك الأول: النص */}
        <div
          className='flex flex-col items-center justify-center text-center lg:col-span-2 space-y-6 px-4 mt-15'
          dir='rtl'
        >
          <h1 className='card-text text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight lg:leading-snug w-full max-w-full text-center text-gray-800 wrap-break-word'>
            مراقبة مباشرة لأسطول المركبات / أجهزة الموبايلات GPS
          </h1>
          {/* <h2 className="text-[30px] lg:text-[48px] font-bold leading-[45px] lg:leading-[60px] w-full max-w-full wrap-break-word text-gray-800">
            تااااااااااااح
          </h2> */}
        </div>



        {/* البلوك الثاني: الصورة أو 3D gallery */}
        <div className='flex justify-center lg:justify-end z-40'>
          <ThreeDGallery />
        </div>
      </div>
    </header>
  );
}
