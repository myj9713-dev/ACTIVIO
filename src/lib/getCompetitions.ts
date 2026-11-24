import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Competition } from '@/types/competition';

export async function getCompetitions(page = 0, pageSize = 10) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { error, data } = await getSupabaseBrowserClient()
    .from('competition')
    .select('*')
    .is('deleted_at', null)
    .order('event_data', { ascending: true })
    .range(from, to);

  if (error) throw error;

  return data.map((competition: Competition) => ({
    ...competition,
    comment_count: 0,
  }));
}
