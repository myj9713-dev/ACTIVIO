import { Suspense } from 'react';
import type { Metadata } from 'next';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { NewsFeedList } from '@/components/news/NewsFeedList';
import { fetchAllSportsNews } from '@/services/news/fetchSportsNews';

export const metadata: Metadata = {
  title: '뉴스 | Activio',
  description:
    '유도, 주짓수, 레슬링, 복싱, 태권도, MMA 최신 소식을 원문 링크로 확인하세요',
  openGraph: {
    title: '뉴스 | Activio',
    description:
      '유도, 주짓수, 레슬링, 복싱, 태권도, MMA 최신 소식을 원문 링크로 확인하세요',
  },
};

async function NewsContent() {
  const { items, isError } = await fetchAllSportsNews({
    perCategoryDisplay: 5,
  });
  return <NewsFeedList items={items} isError={isError} />;
}

export default function NewsPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="뉴스 불러오는 중" />}>
      <NewsContent />
    </Suspense>
  );
}
