'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { extractTokenFromUrl, setAuthToken, isFromMobileApp } from '@/lib/token';

function TokenHandler() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string[] | undefined;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ใช้ utility function เพื่อ extract token จาก URL
    let tokenData = extractTokenFromUrl();
    
    // ถ้าไม่มี token ใน URL ให้ลองดึงจาก query params หรือ path
    if (!tokenData) {
      // วิธีที่ 1: ตรวจสอบ query parameters (เช่น ?username=xxx&token=yyy)
      const queryUsername = searchParams?.get('username');
      const queryToken = searchParams?.get('token');
      
      if (queryUsername && queryToken) {
        try {
          tokenData = {
            username: decodeURIComponent(queryUsername),
            token: decodeURIComponent(queryToken),
          };
        } catch (err) {
          console.error('Error decoding query params:', err);
          setError('รูปแบบ URL ไม่ถูกต้อง');
          setTimeout(() => router.replace('/'), 2000);
          return;
        }
      }
      // วิธีที่ 2: ตรวจสอบจาก path (Format: /username:token)
      else if (slug && slug.length > 0) {
        try {
          const fullSlug = slug.join('/');
          const parts = fullSlug.split(':');
          
          if (parts.length >= 2) {
            tokenData = {
              username: decodeURIComponent(parts[0]),
              token: decodeURIComponent(parts.slice(1).join(':')),
            };
          }
        } catch (err) {
          console.error('Error parsing token from URL:', err);
          setError('รูปแบบ URL ไม่ถูกต้อง');
          setTimeout(() => router.replace('/'), 2000);
          return;
        }
      }
    }

    // Validate และเก็บ token
    if (tokenData && tokenData.username && tokenData.token) {
      const { username, token } = tokenData;
      
      // ตรวจสอบว่า token ไม่ว่าง
      if (token.trim() === '') {
        setError('Token ไม่ถูกต้อง');
        setTimeout(() => router.replace('/'), 2000);
        return;
      }

      // ตรวจสอบว่ามาจาก mobile app หรือไม่
      const fromMobile = isFromMobileApp();
      const tokenSource = fromMobile ? 'mobile' : 'web';
      
      // เก็บ token (persistent สำหรับ mobile app)
      try {
        setAuthToken(token, username, tokenSource, fromMobile);
        
        // Log สำหรับ debugging (สามารถลบออกได้ใน production)
        if (process.env.NODE_ENV === 'development') {
          console.log('Token stored:', {
            source: tokenSource,
            fromMobile,
            persistent: fromMobile,
          });
        }
        
        // Redirect ไปหน้าแรกพร้อม token (ใช้ replace เพื่อไม่ให้มี history ของ token URL)
        router.replace('/');
      } catch (err) {
        console.error('Error storing token:', err);
        setError('ไม่สามารถเก็บ token ได้');
        setTimeout(() => router.replace('/'), 2000);
      }
    } else {
      // ถ้าไม่มี token ให้ redirect ไปหน้าแรก
      router.replace('/');
    }
  }, [slug, router, searchParams]);

  // แสดง loading หรือ error
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 px-4 dark:from-gray-950 dark:to-slate-900">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
            <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-base font-medium text-red-600 dark:text-red-400">{error}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">กำลังเปลี่ยนเส้นทาง...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 dark:from-gray-950 dark:to-slate-900">
      <div className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
        </div>
        <p className="text-base font-medium text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
      </div>
    </div>
  );
}

export default function TokenPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 dark:from-gray-950 dark:to-slate-900">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          </div>
          <p className="text-base font-medium text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <TokenHandler />
    </Suspense>
  );
}
