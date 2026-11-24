import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface BookmarkedPost {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  comment_count: number;
  bookmarked_at: string;
}

interface BookmarkPostRow {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  active_comment_counts: { count: number }[];
}

interface BookmarkRow {
  created_at: string;
  posts: BookmarkPostRow | null;
}

export async function fetchMyBookmarks(page = 0): Promise<BookmarkedPost[]> {
  const PAGE_SIZE = 10;
  const {
    data: { user },
  } = await getSupabaseBrowserClient().auth.getUser();
  if (!user) return [];

  const { data, error } = await getSupabaseBrowserClient()
    .from('bookmarks')
    .select(
      'created_at, posts(id, title, content, category, created_at, active_comment_counts(count))',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  if (error || !data) return [];

  const rows = data as unknown as BookmarkRow[];

  return rows
    .filter(
      (b): b is BookmarkRow & { posts: BookmarkPostRow } => b.posts !== null,
    )
    .map((b) => ({
      id: b.posts.id,
      title: b.posts.title,
      content: b.posts.content,
      category: b.posts.category,
      created_at: b.posts.created_at,
      comment_count: b.posts.active_comment_counts?.[0]?.count ?? 0,
      bookmarked_at: b.created_at,
    }));
}

export async function fetchMyBookmarkCount(): Promise<number> {
  const {
    data: { user },
  } = await getSupabaseBrowserClient().auth.getUser();
  if (!user) return 0;
  const { count } = await getSupabaseBrowserClient()
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);
  return count ?? 0;
}
