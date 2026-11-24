import { NextResponse } from 'next/server';
import { getHomePathByRole } from '@/lib/role';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function getSafeRedirectPath(nextParam: string | null): string {
  if (!nextParam || !nextParam.startsWith('/') || nextParam.startsWith('//')) {
    return '/dashboard';
  }
  return nextParam;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedNext = searchParams.get('next');
  const safeNext = getSafeRedirectPath(requestedNext);

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data: sessionData, error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const userId = sessionData.session?.user.id ?? sessionData.user?.id;
      let role: string | null = null;

      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
        role = typeof profile?.role === 'string' ? profile.role : null;
      }

      const roleHome = getHomePathByRole(role);
      const redirectPath =
        !requestedNext || safeNext === '/dashboard' ? roleHome : safeNext;

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed`);
}
