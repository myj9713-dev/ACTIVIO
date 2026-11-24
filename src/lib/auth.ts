import { getSupabaseBrowserClient } from './supabase/client';
import type { AppRole } from '@/types/role';

export type { AppRole };

export type AuthUser = {
  id: string;
  name: string;
  role: AppRole;
  belt?: string;
  image?: string;
} | null;

export async function getCurrentUser(): Promise<AuthUser> {
  const {
    data: { user },
  } = await getSupabaseBrowserClient().auth.getUser();
  if (!user) return null;

  const { data: profile } = await getSupabaseBrowserClient()
    .from('profiles')
    .select('name, role, belt_level, avatar_url, nickname')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    name: profile.nickname ?? profile.name,
    role: profile.role,
    belt: profile.belt_level,
    image: profile.avatar_url,
  };
}
