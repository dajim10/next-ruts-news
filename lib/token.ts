/**
 * Token management utilities
 * รองรับการจัดการ token จาก mobile app (rutsapp) และเก็บไว้ใช้ในอนาคต
 */

import { UserInfo, TokenValidationResponse } from '@/types/user';

const TOKEN_KEY = 'auth_token';
const USERNAME_KEY = 'auth_username';
const TOKEN_SOURCE_KEY = 'auth_token_source'; // เก็บแหล่งที่มาของ token (mobile, web, etc.)
const USER_INFO_KEY = 'auth_user_info'; // เก็บข้อมูลผู้ใช้ที่ดึงมาจาก API
const TOKEN_VALIDATION_API = 'https://api.rmutsv.ac.th/elogin/token';

export type TokenSource = 'mobile' | 'web' | 'legacy' | 'unknown';

/**
 * Detect if request is from mobile app (rutsapp)
 */
export function isFromMobileApp(): boolean {
  if (typeof window === 'undefined') return false;
  
  // ตรวจสอบ referrer หรือ user agent
  const referrer = document.referrer;
  const userAgent = navigator.userAgent || '';
  
  // ตรวจสอบ referrer จาก rutsapp domain
  if (referrer && (
    referrer.includes('rutsapp.rmutsv.ac.th') ||
    referrer.includes('rutsapp') ||
    referrer.includes('mobile')
  )) {
    return true;
  }
  
  // ตรวจสอบ user agent สำหรับ mobile app
  if (userAgent.includes('RutsApp') || userAgent.includes('rutsapp')) {
    return true;
  }
  
  return false;
}

/**
 * Get auth token from storage
 * Priority: sessionStorage > localStorage (for legacy support)
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // ลองดึงจาก sessionStorage ก่อน (สำหรับ session ปัจจุบัน)
  const sessionToken = sessionStorage.getItem(TOKEN_KEY);
  if (sessionToken) {
    return sessionToken;
  }
  
  // Fallback: ลองดึงจาก localStorage (สำหรับ token เก่าที่เก็บไว้)
  const legacyToken = localStorage.getItem(TOKEN_KEY);
  if (legacyToken) {
    // ย้าย token จาก localStorage ไป sessionStorage สำหรับ session ปัจจุบัน
    sessionStorage.setItem(TOKEN_KEY, legacyToken);
    return legacyToken;
  }
  
  return null;
}

/**
 * Get username from storage
 */
export function getAuthUsername(): string | null {
  if (typeof window === 'undefined') return null;
  
  const sessionUsername = sessionStorage.getItem(USERNAME_KEY);
  if (sessionUsername) {
    return sessionUsername;
  }
  
  // Fallback: ลองดึงจาก localStorage
  const legacyUsername = localStorage.getItem(USERNAME_KEY);
  if (legacyUsername) {
    sessionStorage.setItem(USERNAME_KEY, legacyUsername);
    return legacyUsername;
  }
  
  return null;
}

/**
 * Get token source (where token came from)
 */
export function getTokenSource(): TokenSource {
  if (typeof window === 'undefined') return 'unknown';
  
  const source = sessionStorage.getItem(TOKEN_SOURCE_KEY) || 
                 localStorage.getItem(TOKEN_SOURCE_KEY);
  
  return (source as TokenSource) || 'unknown';
}

/**
 * Store auth token
 * @param token - Auth token
 * @param username - Username
 * @param source - Source of token (mobile, web, legacy, etc.)
 * @param persistent - Whether to store in localStorage for future use (default: false for web, true for mobile)
 */
export function setAuthToken(
  token: string,
  username: string,
  source: TokenSource = 'web',
  persistent: boolean = false
): void {
  if (typeof window === 'undefined') return;
  
  try {
    // เก็บใน sessionStorage เสมอ (สำหรับ session ปัจจุบัน)
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USERNAME_KEY, username);
    sessionStorage.setItem(TOKEN_SOURCE_KEY, source);
    
    // ถ้า persistent = true หรือมาจาก mobile app ให้เก็บใน localStorage ด้วย
    if (persistent || source === 'mobile') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USERNAME_KEY, username);
      localStorage.setItem(TOKEN_SOURCE_KEY, source);
    }
  } catch (err) {
    console.error('Error storing auth token:', err);
    throw err;
  }
}

/**
 * Clear auth token from all storage
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
    sessionStorage.removeItem(TOKEN_SOURCE_KEY);
    
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(TOKEN_SOURCE_KEY);
  } catch (err) {
    console.error('Error clearing auth token:', err);
  }
}

/**
 * Check if token exists
 */
export function hasAuthToken(): boolean {
  return getAuthToken() !== null;
}

/**
 * Extract token from URL (supports multiple formats)
 */
export function extractTokenFromUrl(): { username: string; token: string } | null {
  if (typeof window === 'undefined') return null;
  
  const url = new URL(window.location.href);
  
  // วิธีที่ 1: Query parameters (?username=xxx&token=yyy)
  const queryUsername = url.searchParams.get('username');
  const queryToken = url.searchParams.get('token');
  
  if (queryUsername && queryToken) {
    try {
      return {
        username: decodeURIComponent(queryUsername),
        token: decodeURIComponent(queryToken),
      };
    } catch (err) {
      console.error('Error decoding query params:', err);
      return null;
    }
  }
  
  // วิธีที่ 2: Path format (/username:token)
  const pathname = url.pathname;
  if (pathname && pathname !== '/' && pathname.includes(':')) {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      if (lastPart.includes(':')) {
        try {
          const [username, ...tokenParts] = lastPart.split(':');
          const token = tokenParts.join(':');
          
          if (username && token) {
            return {
              username: decodeURIComponent(username),
              token: decodeURIComponent(token),
            };
          }
        } catch (err) {
          console.error('Error decoding path token:', err);
          return null;
        }
      }
    }
  }
  
  return null;
}

/**
 * Validate token and get user information from API
 * @param token - Auth token to validate
 * @param forceRefresh - Force refresh even if cached (default: false)
 * @returns User information or null if invalid
 */
export async function validateToken(
  token: string,
  forceRefresh: boolean = false
): Promise<UserInfo | null> {
  if (!token || token.trim() === '') {
    return null;
  }

  // ตรวจสอบ cache ก่อน (ถ้าไม่ force refresh)
  if (!forceRefresh && typeof window !== 'undefined') {
    const cachedUserInfo = sessionStorage.getItem(USER_INFO_KEY);
    const cachedToken = sessionStorage.getItem(TOKEN_KEY);
    
    // ถ้ามี cache และ token ตรงกัน ให้ใช้ cache
    if (cachedUserInfo && cachedToken === token) {
      try {
        return JSON.parse(cachedUserInfo);
      } catch (err) {
        console.error('Error parsing cached user info:', err);
      }
    }
  }

  try {
    const response = await fetch(`${TOKEN_VALIDATION_API}/${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // ไม่ cache response เพื่อให้ได้ข้อมูลล่าสุด
      cache: 'no-store',
    });

    if (!response.ok) {
      // ถ้า token ไม่ valid ให้ลบ token และ user info
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          clearAuthToken();
          sessionStorage.removeItem(USER_INFO_KEY);
        }
      }
      return null;
    }

    const data = await response.json();

    // API อาจจะ return ข้อมูลตรงๆ หรือมี wrapper
    // รองรับทั้งสองกรณี
    let userInfo: UserInfo | null = null;

    if (data.success && data.user) {
      // กรณีที่มี wrapper { success: true, user: {...} }
      userInfo = data.user;
    } else if (data.username || data.name || data.cid) {
      // กรณีที่ return ข้อมูลตรงๆ (ไม่มี wrapper)
      userInfo = data as UserInfo;
    }

    if (userInfo) {
      // เก็บ user info ใน sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
      }
      return userInfo;
    }

    return null;
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
}

/**
 * Get cached user information
 */
export function getCachedUserInfo(): UserInfo | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = sessionStorage.getItem(USER_INFO_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error('Error getting cached user info:', err);
  }

  return null;
}

/**
 * Clear cached user information
 */
export function clearCachedUserInfo(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(USER_INFO_KEY);
  } catch (err) {
    console.error('Error clearing cached user info:', err);
  }
}

/**
 * Validate current token and update user info
 * Call this when app loads or token changes
 */
export async function validateCurrentToken(forceRefresh: boolean = false): Promise<UserInfo | null> {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  return await validateToken(token, forceRefresh);
}
