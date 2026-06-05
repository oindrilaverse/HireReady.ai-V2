import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let user = null;
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/(.*?)\.supabase/)?.[1] || 'gegorjsojhnneercfbpi';
  const cookieName = `sb-${projectRef}-auth-token`;

  try {
    const authCookie = request.cookies.get(cookieName)?.value;
    if (authCookie) {
      const tokenData = JSON.parse(decodeURIComponent(authCookie));
      const accessToken = Array.isArray(tokenData) ? tokenData[0] : (tokenData.access_token || tokenData);
      if (accessToken) {
        const payloadPart = accessToken.split('.')[1];
        if (payloadPart) {
          const payload = JSON.parse(Buffer.from(payloadPart, 'base64').toString('utf-8'));
          user = {
            id: payload.sub,
            email: payload.email,
            user_metadata: payload.user_metadata || {},
          };
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
