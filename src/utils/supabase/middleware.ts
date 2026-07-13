import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Lightweight in-memory cache for validated sessions/JWTs to speed up route checks
const tokenCache = new Map<string, { user: any; expiresAt: number }>();

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let user = null;
  const cookieName = 'sb-hireready-auth-token';

  try {
    const authCookie = request.cookies.get(cookieName)?.value;
    if (authCookie) {
      const tokenData = JSON.parse(decodeURIComponent(authCookie));
      const accessToken = Array.isArray(tokenData) ? tokenData[0] : (tokenData.access_token || tokenData);
      if (accessToken) {
        const cached = tokenCache.get(accessToken);
        if (cached && cached.expiresAt > Date.now()) {
          user = cached.user;
        } else {
          const payloadPart = accessToken.split('.')[1];
          if (payloadPart) {
            const payload = JSON.parse(Buffer.from(payloadPart, 'base64').toString('utf-8'));
            const exp = payload.exp ? payload.exp * 1000 : Date.now() + 60 * 60 * 1000;
            if (exp > Date.now()) {
              user = {
                id: payload.sub,
                email: payload.email,
                user_metadata: payload.user_metadata || {},
              };
              // Cache for 5 mins or until token expires
              const cacheDuration = Math.min(5 * 60 * 1000, exp - Date.now());
              tokenCache.set(accessToken, {
                user,
                expiresAt: Date.now() + cacheDuration,
              });
            }
          }
        }
      }
    }
  } catch (cookieErr) {
    console.error("Cookie fallback parsing failed:", cookieErr);
  }

  if (!user) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value,
                ...options,
              });
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              });
              response.cookies.set({
                name,
                value,
                ...options,
              });
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value: '',
                ...options,
              });
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              });
              response.cookies.set({
                name,
                value: '',
                ...options,
              });
            },
          },
        }
      );
      const { data } = await supabase.auth.getUser();
      user = data?.user;
      
      // Cache the newly fetched user if available
      if (user) {
        const authCookie = request.cookies.get(cookieName)?.value;
        if (authCookie) {
          const tokenData = JSON.parse(decodeURIComponent(authCookie));
          const accessToken = Array.isArray(tokenData) ? tokenData[0] : (tokenData.access_token || tokenData);
          if (accessToken) {
            tokenCache.set(accessToken, {
              user,
              expiresAt: Date.now() + 5 * 60 * 1000,
            });
          }
        }
      }
    } catch (err) {
      console.warn("getUser failed (possibly offline):", err);
    }
  }

  // Redirect to login if accessing protected routes without session
  const protectedRoutes = [
    '/dashboard',
    '/analyzer',
    '/builder',
    '/cover-letter',
    '/interview',
    '/job-match',
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
      });
    });
    return redirectResponse;
  }

  // Redirect to dashboard if accessing login/signup with session
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
      });
    });
    return redirectResponse;
  }

  return response;
}
