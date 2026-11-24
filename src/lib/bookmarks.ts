import { getSupabaseBrowserClient } from './supabase/client';

export async function getIsBookmarked(postId: string, userId: string) {
  const { data } = await getSupabaseBrowserClient()
    .from('bookmarks')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function toggleBookmark(
  postId: string,
  userId: string,
  isBookmarked: boolean,
) {
  if (isBookmarked) {
    await getSupabaseBrowserClient()
      .from('bookmarks')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
  } else {
    await getSupabaseBrowserClient()
      .from('bookmarks')
      .insert({ post_id: postId, user_id: userId });
  }
}
