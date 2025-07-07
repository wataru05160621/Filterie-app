import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 認証が必要なパス
const protectedPaths = [
  '/dashboard',
  '/articles',
  '/bookmarks',
  '/settings',
  '/sources',
];

// 認証済みユーザーがアクセスできないパス
const authPaths = ['/login', '/register'];

export function middleware(request: NextRequest) {
  // クライアントサイドでlocalStorageのトークンを使用するため、
  // ここではトークンチェックをスキップ
  const { pathname } = request.nextUrl;
  
  // 一時的に認証チェックをスキップ
  return NextResponse.next();

  // 認証が必要なパスへのアクセス
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  // 認証済みユーザーの認証ページへのアクセス
  if (authPaths.some(path => pathname.startsWith(path))) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};