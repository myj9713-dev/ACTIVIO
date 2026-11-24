import { getSupabaseBrowserClient } from './supabase/client';

export async function getLikesCount(postId: string) {
  const { count } = await getSupabaseBrowserClient()
    .from('likes')
    .select('*', { count: 'exact' })
    .eq('post_id', postId);
  return count;
}

export async function getIsLiked(postId: string, userId: string) {
  const { data } = await getSupabaseBrowserClient()
    .from('likes')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId);

  return (data?.length ?? 0) > 0;
}

export async function toggleLike(
  postId: string,
  userId: string,
  isLiked: boolean,
) {
  if (isLiked) {
    await getSupabaseBrowserClient()
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
  } else {
    await getSupabaseBrowserClient()
      .from('likes')
      .insert({ post_id: postId, user_id: userId });
  }
}
