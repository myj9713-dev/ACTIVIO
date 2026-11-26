import { z } from 'zod';

export const SPORTS_NEWS_CATEGORIES = [
  '유도',
  '주짓수',
  '레슬링',
  '복싱',
  '태권도',
  'MMA',
] as const;

export type SportNewsCategory = (typeof SPORTS_NEWS_CATEGORIES)[number];

export const naverNewsItemSchema = z.object({
  title: z.string(),
  originallink: z.string().optional().default(''),
  link: z.string().optional().default(''),
  description: z.string().optional(),
  pubDate: z.string(),
});

export const naverNewsResponseSchema = z.object({
  lastBuildDate: z.string().optional(),
  total: z.number().optional(),
  start: z.number().optional(),
  display: z.number().optional(),
  items: z.array(naverNewsItemSchema),
});

export type NaverNewsItemRaw = z.infer<typeof naverNewsItemSchema>;

export interface NormalizedNewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string; // ISO 8601
  originalUrl: string;
  category?: SportNewsCategory;
}

export interface CategorizedNewsItem extends NormalizedNewsItem {
  category: SportNewsCategory;
}

export interface NewsFetchResult {
  items: NormalizedNewsItem[];
  isError: boolean;
}

export interface SportsNewsFetchResult {
  items: CategorizedNewsItem[];
  isError: boolean;
}
