import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let publicClient: SupabaseClient | undefined;

export function getSupabasePublicClient() {
  if (!publicClient) {
    publicClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }

  return publicClient;
}
