import { fetchNaverNews } from '@/services/news/fetchNaverNews';
import {
  SPORTS_NEWS_CATEGORIES,
  type CategorizedNewsItem,
  type NewsFetchResult,
  type SportNewsCategory,
  type SportsNewsFetchResult,
} from '@/types/news';

// UI 표시용 카테고리명과 실제 네이버 뉴스 검색 쿼리 분리
const CATEGORY_QUERY_MAP: Record<SportNewsCategory, string> = {
  유도: '유도',
  주짓수: '주짓수',
  레슬링: '레슬링',
  복싱: '복싱',
  태권도: '태권도',
  MMA: '종합격투기',
};

export async function fetchAllSportsNews(options?: {
  perCategoryDisplay?: number;
}): Promise<SportsNewsFetchResult> {
  const display = options?.perCategoryDisplay ?? 5;

  const settled = await Promise.allSettled(
    SPORTS_NEWS_CATEGORIES.map(async (category) => {
      const result: NewsFetchResult = await fetchNaverNews({
        query: CATEGORY_QUERY_MAP[category],
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
