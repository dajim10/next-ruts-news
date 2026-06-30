'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, AlertCircle, Newspaper } from 'lucide-react';
import { hasAuthToken, setAuthToken, validateCurrentToken, isFromMobileApp } from '@/lib/token';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  // ตรวจสอบว่ามี token อยู่แล้วหรือไม่
  useEffect(() => {
    async function checkToken() {
      if (hasAuthToken()) {
        // ตรวจสอบว่า token ยัง valid อยู่หรือไม่
        const userInfo = await validateCurrentToken();
        if (userInfo) {
          // ถ้ามี token และ valid แล้ว ให้ redirect ไปหน้าแรก
          router.replace(redirectTo);
          return;
        }
      }
      setCheckingToken(false);
    }
    checkToken();
  }, [router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://api.rmutsv.ac.th/elogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (data.status !== 'ok' || !data.token) {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        setLoading(false);
        return;
      }

      // เก็บ token และข้อมูลผู้ใช้
      const fromMobile = isFromMobileApp();
      const tokenSource = fromMobile ? 'mobile' : 'web';
      
      setAuthToken(data.token, username, tokenSource, fromMobile);

      // Validate token และดึงข้อมูลผู้ใช้
      // ถ้า validate ไม่สำเร็จก็ยังให้ login ได้ (เพราะ token ถูกต้องแล้ว)
      try {
        const userInfo = await validateCurrentToken(true);
        if (userInfo) {
          console.log('User info retrieved:', userInfo);
        } else {
          console.warn('Could not retrieve user info, but token is valid');
        }
      } catch (err) {
        console.error('Error validating token:', err);
        // ไม่ throw error เพราะ token ถูกต้องแล้ว
      }

      // Redirect ไปหน้าที่ต้องการ (ไม่ว่าจะดึงข้อมูลผู้ใช้สำเร็จหรือไม่)
      router.replace(redirectTo);
    } catch (err) {
      console.error('Login error:', err);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      setLoading(false);
    }
  };

  // แสดง loading ขณะตรวจสอบ token
  if (checkingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 dark:from-gray-950 dark:to-slate-900">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-base font-medium text-gray-600 dark:text-gray-400">กำลังตรวจสอบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 dark:from-gray-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              RUTS News
            </h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ข่าวสาร มทร.ศรีวิชัย
          </p>
        </div>

        <Card className="w-full shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-center text-xl dark:text-white">
              เข้าสู่ระบบ
            </CardTitle>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
              ใช้บัญชีมหาวิทยาลัย (RUTS Account)
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ชื่อผู้ใช้ (Username)
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="e-passport"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    tabIndex={-1}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>ใช้ username และ password เดียวกับระบบของมหาวิทยาลัย</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          © 2025 มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 dark:from-gray-950 dark:to-slate-900">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-base font-medium text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
