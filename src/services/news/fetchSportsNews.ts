import { cacheLife, cacheTag } from 'next/cache';
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
  유도: '유도 선수 OR 유도 대회 OR 유도 국가대표 OR 유도 금메달',
  주짓수: '주짓수',
  레슬링: '레슬링',
  복싱: '복싱',
  태권도: '태권도',
  MMA: '종합격투기',
};

// 제목 중복 비교용 정규화 헬퍼 추가
function normalizeTitleKey(title: string): string {
  return title.replace(/[\s[\]()'"“”‘’.,·…!?-]/g, '').toLowerCase();
}

// 제목에 최소 1개 이상 포함되어야 하는 종목별 핵심 키워드
const CATEGORY_TITLE_KEYWORDS: Record<SportNewsCategory, string[]> = {
  유도: ['유도', '대한유도회'],
  주짓수: ['주짓수'],
  레슬링: ['레슬링', '프로레슬링', '프로레슬러'],
  복싱: ['복싱', '복서', '권투', 'wba', 'wbc', 'ibf', 'wbo'],
  태권도: ['태권도', '국기원', '품새', '겨루기'],
  MMA: [
    '종합격투기',
    'mma',
    'ufc',
    '블랙컴뱃',
    '로드fc',
    '원챔피언십',
    '벨라토르',
    'pfl',
    '라이진',
  ],
};

// 비스포츠(부동산·금융·행정·연예/예능) 노이즈 제외 키워드
const EXCLUDED_TITLE_KEYWORDS = [
  '분양',
  '상업시설',
  '아파트',
  '오피스텔',
  '부동산',
  '주식',
  '코인',
  '금융 소식',
  '화재예방',
  '축산방역',
  '물류창고',
  '안전진단',
  '방화구획',
  '라면축제',
  '무쇠소녀단',
  '코믹 액션',
  '주연',
  '시청률',
  '첫방',
  '아빠 품에',
  '자랑한 50억',
];

function isRelevantSportsNews(
  category: SportNewsCategory,
  title: string,
): boolean {
  const normalizedTitle = title.toLowerCase();

  const hasExcludedKeyword = EXCLUDED_TITLE_KEYWORDS.some((keyword) =>
    normalizedTitle.includes(keyword.toLowerCase()),
  );
  if (hasExcludedKeyword) return false;

  const requiredKeywords = CATEGORY_TITLE_KEYWORDS[category];
  return requiredKeywords.some((keyword) =>
    normalizedTitle.includes(keyword.toLowerCase()),
  );
}

async function getCachedSportsNews(
  display: number,
): Promise<SportsNewsFetchResult> {
  'use cache';
  cacheTag('sports-news');
  cacheLife('minutes');

  // 필터링으로 탈락할 항목을 감안해 넉넉히 조회 후 목표 개수(display)만큼 선별
  const fetchDisplay = Math.min(Math.max(display * 4, 20), 100);

  const settled = await Promise.allSettled(
    SPORTS_NEWS_CATEGORIES.map(async (category) => {
      const result: NewsFetchResult = await fetchNaverNews({
        query: CATEGORY_QUERY_MAP[category],
        display: fetchDisplay,
        sort: 'date',
      });
      return { category, result };
    }),
  );

  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
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

    let addedForCategory = 0;
    for (const item of result.items) {
      if (addedForCategory >= display) break;
      if (seenUrls.has(item.originalUrl)) continue;
      if (!isRelevantSportsNews(category, item.title)) continue;

      const titleKey = normalizeTitleKey(item.title);
      if (seenTitles.has(titleKey)) continue;

      seenUrls.add(item.originalUrl);
      seenTitles.add(titleKey);
      merged.push({ ...item, category });
      addedForCategory += 1;
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

export async function fetchAllSportsNews(options?: {
  perCategoryDisplay?: number;
}): Promise<SportsNewsFetchResult> {
  const display = options?.perCategoryDisplay ?? 5;
  return getCachedSportsNews(display);
}
