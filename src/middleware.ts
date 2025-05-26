
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const MAINTENANCE_PAGE_PATH = '/maintenance';
const ADMIN_SITE_SETTINGS_ID = 'global_settings';

const EXCLUDED_PATHS = [
  '/admin',
  '/api',
  MAINTENANCE_PAGE_PATH,
  '/_next/static',
  '/_next/image',
  '/favicon.ico',
  '/favicon_io', // Exclude the whole favicon folder
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log(`[Middleware] Request for path: ${pathname}`);

  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    console.log(`[Middleware] Path ${pathname} is excluded. Passing through.`);
    return NextResponse.next();
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[Middleware] Supabase URL or Anon Key is not defined. Skipping maintenance check.');
    return NextResponse.next();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });

  try {
    console.log(`[Middleware] Fetching site settings for maintenance mode check.`);
    const { data, error, status } = await supabase
      .from('site_settings')
      .select('is_maintenance_mode_enabled')
      .eq('id', ADMIN_SITE_SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.error(`[Middleware] Error fetching site settings (status: ${status}):`, error.message);
      return NextResponse.next(); // Proceed if settings can't be fetched
    }

    if (data?.is_maintenance_mode_enabled) {
      console.log(`[Middleware] Maintenance mode is ON. Rewriting ${pathname} to ${MAINTENANCE_PAGE_PATH}`);
      const url = request.nextUrl.clone();
      url.pathname = MAINTENANCE_PAGE_PATH;
      return NextResponse.rewrite(url);
    }
    console.log(`[Middleware] Maintenance mode is OFF for ${pathname}. Passing through.`);
  } catch (e: any) {
    console.error('[Middleware] Exception during site settings fetch:', e.message);
    return NextResponse.next(); // Fallback
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|favicon_io|admin|maintenance).*)',
  ],
};
