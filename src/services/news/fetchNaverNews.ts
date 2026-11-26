import { z } from 'zod';
import {
  naverNewsResponseSchema,
  type NaverNewsItemRaw,
  type NewsFetchResult,
  type NormalizedNewsItem,
} from '@/types/news';

const NAVER_NEWS_ENDPOINT =
  'https://naverapihub.apigw.ntruss.com/search/v1/news';
const DEFAULT_TIMEOUT_MS = 5000;

const HTML_ENTITY_MAP: Record<string, string> = {
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&amp;': '&',
};

function decodeHtmlEntities(input: string): string {
  return input.replace(
    /&(?:quot|#39|apos|lt|gt|nbsp|amp);/g,
    (entity) => HTML_ENTITY_MAP[entity] ?? entity,
  );
}

export function sanitizeNewsTitle(rawTitle: string): string {
  const withoutTags = rawTitle.replace(/<\/?b>/gi, '');
  return decodeHtmlEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

function resolveOriginalUrl(item: NaverNewsItemRaw): string | null {
  const candidate = item.originallink.trim() || item.link.trim();
  if (!candidate) return null;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function extractSourceFromUrl(urlString: string): string {
  try {
    const hostname = new URL(urlString).hostname.replace(/^www\./i, '');
    return hostname || '언론사 미상';
  } catch {
    return '언론사 미상';
  }
}

function toIsoDateString(pubDate: string): string | null {
  const timestamp = Date.parse(pubDate);
  if (Number.isNaN(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

function createItemId(
  urlString: string,
  publishedAt: string,
  index: number,
): string {
  return `${publishedAt}_${index}_${encodeURIComponent(urlString).slice(-24)}`;
}

function normalizeNewsItem(
  item: NaverNewsItemRaw,
  index: number,
): NormalizedNewsItem | null {
  const title = sanitizeNewsTitle(item.title);
  const originalUrl = resolveOriginalUrl(item);
  const publishedAt = toIsoDateString(item.pubDate);

  if (!title || !originalUrl || !publishedAt) {
    return null;
  }

  return {
    id: createItemId(originalUrl, publishedAt, index),
    title,
    source: extractSourceFromUrl(originalUrl),
    publishedAt,
    originalUrl,
  };
}

export async function fetchNaverNews(options: {
  query: string;
  display?: number;
  sort?: 'sim' | 'date';
  timeoutMs?: number;
}): Promise<NewsFetchResult> {
  const clientId = process.env.NAVER_NEWS_CLIENT_ID;
  const clientSecret = process.env.NAVER_NEWS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error(
      '[fetchNaverNews] Missing NAVER_NEWS_CLIENT_ID or NAVER_NEWS_CLIENT_SECRET',
    );
    return { items: [], isError: true };
  }

  const trimmedQuery = options.query.trim();
  if (!trimmedQuery) {
    return { items: [], isError: false };
  }

  const display = Math.min(Math.max(options.display ?? 10, 1), 100);
  const sort = options.sort ?? 'date';
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const params = new URLSearchParams({
    query: trimmedQuery,
    display: String(display),
    sort,
  });

  try {
    const response = await fetch(
      `${NAVER_NEWS_ENDPOINT}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'X-NCP-APIGW-API-KEY-ID': clientId,
          'X-NCP-APIGW-API-KEY': clientSecret,
        },
        signal: AbortSignal.timeout(timeoutMs),
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      console.error(`[fetchNaverNews] HTTP error: ${response.status}`);
      return { items: [], isError: true };
    }

    const json: unknown = await response.json();
    const parsed = naverNewsResponseSchema.safeParse(json);

    if (!parsed.success) {
      console.error(
        '[fetchNaverNews] Schema validation failed:',
        z.flattenError(parsed.error),
      );
      return { items: [], isError: true };
    }

    const items = parsed.data.items
      .map((item, idx) => normalizeNewsItem(item, idx))
      .filter((item): item is NormalizedNewsItem => item !== null);

    return { items, isError: false };
  } catch (error) {
    console.error('[fetchNaverNews] Request failed:', error);
    return { items: [], isError: true };
  }
}
