import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// المسارات العامة التي لا تحتاج حماية
const PUBLIC_PATHS = ['/login', '/auth', '/_next', '/favicon.ico', '/api/public'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // تجاهل المسارات العامة والملفات الثابتة
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname.match(/\.(png|jpg|svg|css|js|woff2?)$/)) {
    return NextResponse.next();
  }

  // إنشاء عميل Supabase للتحقق من الجلسة عبر الكوكيز
  let res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          req.cookies.set({ name, value, ...options });
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          req.cookies.set({ name, value: '', ...options });
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 1) غير مسجل → إلى /login
  if (!user || !user.email) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // 2) مسجل لكن بريده ليس في القائمة البيضاء → تسجيل خروج + /login?error=not_allowed
  const { data: allowed } = await supabase
    .from('allowed_users')
    .select('email')
    .eq('email', user.email.toLowerCase())
    .maybeSingle();

  if (!allowed) {
    await supabase.auth.signOut();
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'not_allowed');
    url.searchParams.set('email', user.email);
    return NextResponse.redirect(url);
  }

  // مسموح → متابعة
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
