import { fetchNaverNews } from '@/services/news/fetchNaverNews';
import {
  SPORTS_NEWS_CATEGORIES,
  type CategorizedNewsItem,
  type NewsFetchResult,
  type SportsNewsFetchResult,
} from '@/types/news';

export async function fetchAllSportsNews(options?: {
  perCategoryDisplay?: number;
}): Promise<SportsNewsFetchResult> {
  const display = options?.perCategoryDisplay ?? 5;

  const settled = await Promise.allSettled(
    SPORTS_NEWS_CATEGORIES.map(async (category) => {
      const result: NewsFetchResult = await fetchNaverNews({
        query: category,
        display,
        sort: 'date',
      });
      return { category, result };
    }),
  );

  const seenUrls = new Set<string>();
  const merged: CategorizedNewsItem[] = [];
  let failedCount = 0;

  for (const entry of settled) {
    if (entry.status === 'rejected') {
      failedCount += 1;
      continue;
    }

    const { category, result } = entry.value;
    if (result.isError) {
      failedCount += 1;
      continue;
    }

    for (const item of result.items) {
      if (seenUrls.has(item.originalUrl)) continue;
      seenUrls.add(item.originalUrl);
      merged.push({ ...item, category });
    }
  }

  merged.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const isAllFailed = failedCount === SPORTS_NEWS_CATEGORIES.length;
  return {
    items: merged,
    isError: isAllFailed && merged.length === 0,
  };
}
