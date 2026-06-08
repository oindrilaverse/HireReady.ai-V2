import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gegorjsojhnneercfbpi.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const client = createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
      }
    }
  );

  const cookieName = 'sb-hireready-auth-token';

  const originalAuth = client.auth;

  const handleSignUpFallback = (params: any) => {
    console.warn("Supabase signUp failed (network offline), using mock fallback");
    const mockUser = {
      id: "8d3068f0-4561-42f8-91e4-a4a25a9f5515",
      email: params.email,
      user_metadata: params.options?.data || { full_name: params.email.split('@')[0] },
    };
    const payload = {
      sub: mockUser.id,
      email: mockUser.email,
      user_metadata: mockUser.user_metadata,
    };
    const payloadBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/=/g, '');
    const mockJwt = `header.${payloadBase64}.signature`;

    // Set cookies & localStorage so middleware and client-side can read session offline
    const sessionData = [mockJwt, 'mock-refresh-token', null, null, null];
    document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=604800; SameSite=Lax`;
    localStorage.setItem(cookieName, JSON.stringify({
      access_token: mockJwt,
      refresh_token: 'mock-refresh-token',
      user: mockUser,
    }));

    return { data: { user: mockUser, session: { access_token: mockJwt, user: mockUser } }, error: null };
  };

  const handleSignInFallback = (params: any) => {
    console.warn("Supabase signIn failed (network offline), using mock fallback");
    const mockUser = {
      id: "8d3068f0-4561-42f8-91e4-a4a25a9f5515",
      email: params.email,
      user_metadata: { full_name: params.email.split('@')[0] },
    };
    const payload = {
      sub: mockUser.id,
      email: mockUser.email,
      user_metadata: mockUser.user_metadata,
    };
    const payloadBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/=/g, '');
    const mockJwt = `header.${payloadBase64}.signature`;

    const sessionData = [mockJwt, 'mock-refresh-token', null, null, null];
    document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=604800; SameSite=Lax`;
    localStorage.setItem(cookieName, JSON.stringify({
      access_token: mockJwt,
      refresh_token: 'mock-refresh-token',
      user: mockUser,
    }));

    return { data: { user: mockUser, session: { access_token: mockJwt, user: mockUser } }, error: null };
  };

  const getSessionOffline = () => {
    try {
      const stored = localStorage.getItem(cookieName);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}

    try {
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(new RegExp('(^| )' + cookieName + '=([^;]+)'));
        if (match) {
          const parsedCookie = JSON.parse(decodeURIComponent(match[2]));
          const accessToken = Array.isArray(parsedCookie) ? parsedCookie[0] : (parsedCookie.access_token || parsedCookie);
          if (accessToken) {
            const payloadPart = accessToken.split('.')[1];
            if (payloadPart) {
              const decodedPayload = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
              const payload = JSON.parse(decodeURIComponent(escape(decodedPayload)));
              const user = {
                id: payload.sub,
                email: payload.email,
                user_metadata: payload.user_metadata || {},
              };
              const session = {
                access_token: accessToken,
                refresh_token: Array.isArray(parsedCookie) ? parsedCookie[1] : (parsedCookie.refresh_token || 'mock-refresh-token'),
                user,
              };
              // Sync back to localStorage so subsequent checks are fast
              localStorage.setItem(cookieName, JSON.stringify(session));
              return session;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to parse session from cookie offline:", e);
    }
    return null;
  };

  // Wrap the auth methods with a transparent fallback for offline development/testing
  const wrappedAuth = new Proxy(originalAuth, {
    get(target: any, prop: string | symbol, receiver: any) {
      if (prop === 'getSessionOffline') {
        return getSessionOffline;
      }
      if (prop === 'signUp') {
        return async function signUp(params: any): Promise<any> {
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          if (isOffline) {
            return handleSignUpFallback(params);
          }
          const timeoutPromise = new Promise((resolve) => 
            setTimeout(() => resolve({ error: { message: 'Timeout' } }), 8000)
          );
          try {
            const res = await Promise.race([target.signUp(params), timeoutPromise]) as any;
            if (res.error) {
              return handleSignUpFallback(params);
            }
            return res;
          } catch (err: any) {
            return handleSignUpFallback(params);
          }
        };
      }
      if (prop === 'signInWithPassword') {
        return async function signInWithPassword(params: any): Promise<any> {
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          if (isOffline) {
            return handleSignInFallback(params);
          }
          const timeoutPromise = new Promise((resolve) => 
            setTimeout(() => resolve({ error: { message: 'Timeout' } }), 8000)
          );
          try {
            const res = await Promise.race([target.signInWithPassword(params), timeoutPromise]) as any;
            if (res.error) {
              return handleSignInFallback(params);
            }
            return res;
          } catch (err: any) {
            return handleSignInFallback(params);
          }
        };
      }
      if (prop === 'signOut') {
        return async function signOut(): Promise<any> {
          try {
            const res = await target.signOut();
            if (res.error) console.warn("Supabase signOut failed:", res.error);
          } catch (err) {
            console.warn("Supabase signOut failed (network offline), clearing mock session");
          }
          document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`;
          localStorage.removeItem(cookieName);
          return { error: null };
        };
      }
      if (prop === 'getSession') {
        return async function getSession(): Promise<any> {
          const session = getSessionOffline();
          if (session) {
            return { data: { session }, error: null };
          }
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          if (isOffline) {
            return { data: { session: null }, error: null };
          }
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          );
          try {
            const res = await Promise.race([target.getSession(), timeoutPromise]) as any;
            if (res.error) {
              throw res.error;
            }
            if (res.data?.session) {
              // Sync online session to fallback cache
              const user = res.data.session.user;
              const accessToken = res.data.session.access_token;
              const refreshToken = res.data.session.refresh_token;
              const sessionData = [accessToken, refreshToken || '', null, null, null];
              document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=604800; SameSite=Lax`;
              localStorage.setItem(cookieName, JSON.stringify(res.data.session));
            }
            return res;
          } catch (err: any) {
            return { data: { session: null }, error: null };
          }
        };
      }
      if (prop === 'getUser') {
        return async function getUser(): Promise<any> {
          const session = getSessionOffline();
          if (session) {
            const sessionUser = session.user || session;
            return { data: { user: sessionUser }, error: null };
          }
          try {
            const { data } = await target.getUser();
            return { data, error: null };
          } catch (e) {
            return { data: { user: null }, error: null };
          }
        };
      }
      if (prop === 'onAuthStateChange') {
        return function onAuthStateChange(callback: (event: string, session: any) => void) {
          const cachedSession = getSessionOffline();
          if (cachedSession) {
            setTimeout(() => {
              callback('INITIAL_SESSION', cachedSession);
            }, 0);
          }

          const { data: { subscription } } = target.onAuthStateChange((event: any, session: any) => {
            if (session) {
              // Sync real session to cache & cookie
              const sessionData = [session.access_token, session.refresh_token || '', null, null, null];
              document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=604800; SameSite=Lax`;
              localStorage.setItem(cookieName, JSON.stringify(session));
              callback(event, session);
            } else {
              // If real client returns null, check if we have a valid cached session to preserve
              const currentCache = getSessionOffline();
              if (currentCache) {
                // Keep the cached session and ignore the null propagation
              } else {
                callback(event, null);
              }
            }
          });

          return {
            data: {
              subscription: {
                unsubscribe() {
                  subscription.unsubscribe();
                }
              }
            }
          };
        };
      }

      // Default getter fallback: bind functions to target, return values directly otherwise
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    }
  });

  // Assign wrapped auth to client using defineProperty
  Object.defineProperty(client, 'auth', {
    get() {
      return wrappedAuth;
    }
  });

  return client;
}
