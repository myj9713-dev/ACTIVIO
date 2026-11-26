'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Menu, Search, X } from 'lucide-react';
import PromoAdSidebar from '@/components/community/PromoAdSidebar';
import PromoAdBannerMobile from '@/components/community/PromoAdBannerMobile';
import { SPORTS } from '@/constants/sports';
import {
  SPORTS_NEWS_CATEGORIES,
  type CategorizedNewsItem,
  type SportNewsCategory,
} from '@/types/news';
import { formatDate } from '@/utils/formatDate';

type FilterCategory = '전체' | SportNewsCategory;

const CATEGORY_TO_SPORT_SLUG: Record<SportNewsCategory, string> = {
  유도: 'judo',
  주짓수: 'bjj',
  레슬링: 'wrestling',
  복싱: 'boxing',
  태권도: 'taekwondo',
  MMA: 'mma',
};

interface NewsFeedListProps {
  items: CategorizedNewsItem[];
  isError?: boolean;
}

export function NewsFeedList({ items, isError = false }: NewsFeedListProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCategory, setHoveredCategory] =
    useState<SportNewsCategory | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    triggerRef.current?.focus();
  }, []);

  const handleSelectCategory = useCallback((category: FilterCategory) => {
    setSelectedCategory(category);
    setDrawerOpen(false);
  }, []);

  useEffect(() => {
    if (drawerOpen && drawerRef.current) {
      const first = drawerRef.current.querySelector<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      first?.focus();
    }
  }, [drawerOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!drawerOpen) return;
      if (e.key === 'Escape') {
        closeDrawer();
        return;
      }
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen, closeDrawer]);

  const sportsWithCategory = useMemo(() => {
    return SPORTS_NEWS_CATEGORIES.map((category) => {
      const slug = CATEGORY_TO_SPORT_SLUG[category];
      const sportMeta = SPORTS.find((s) => s.slug === slug);
      return {
        category,
        icon: sportMeta?.icon ?? '🥋',
        iconSize: sportMeta?.iconSize ?? '16px',
        color: sportMeta?.color ?? '#2563eb',
      };
    });
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchCategory =
        selectedCategory === '전체' || item.category === selectedCategory;
      const matchSearch =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.source.toLowerCase().includes(normalizedQuery);
      return matchCategory && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  return (
    <section
      className="w-full min-h-screen"
      style={{ background: 'var(--color-bg-page)' }}
      aria-label="격투 종목 뉴스 목록"
    >
      {/* ── Hero (커뮤니티·대회일정과 동일한 풀 블리드 높이/배경) ── */}
      <div className="relative h-[320px] overflow-hidden flex items-end">
        <Image
          fill
          src="/images/bjj-2.webp"
          alt=""
          aria-hidden="true"
          style={{
            objectFit: 'cover',
            opacity: 0.38,
            filter: 'grayscale(10%)',
          }}
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(var(--color-scrim-rgb),0.96) 0%, rgba(var(--color-scrim-rgb),0.45) 60%, rgba(var(--color-scrim-rgb),0.2) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10px',
            right: '-8px',
            fontSize: '100px',
            fontWeight: 800,
            lineHeight: 1,
            color: 'rgba(255,255,255,0.055)',
            letterSpacing: '-0.03em',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          NEWS
        </div>

        <div className="relative z-10 px-6 pb-6 md:px-12 md:pb-8">
          <p
            style={{
              fontSize: '10.5px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              marginBottom: '10px',
            }}
          >
            NEWS FEED
          </p>
          <h1 className="font-extrabold text-text-primary text-[38px] md:text-[52px] leading-none tracking-[-0.04em]">
            뉴스
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              marginTop: '10px',
            }}
          >
            유도, 주짓수, 레슬링, 복싱, 태권도, MMA 소식을 원문 링크로
            확인하세요.
          </p>
        </div>
      </div>

      {/* ── 3-column layout (좌측 홍보 · 중앙 검색+피드 · 우측 종목 필터) ── */}
      <div className="max-w-[1200px] mx-auto px-4 py-6 flex gap-5 items-start">
        {/* Left sidebar: Promo Ad */}
        <aside
          className="hidden lg:flex flex-col shrink-0"
          style={{
            width: '220px',
            position: 'sticky',
            top: '80px',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-medium)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <PromoAdSidebar />
        </aside>

        {/* Center: Search + News list */}
        <section className="flex-1 min-w-0">
          <div
            className="flex items-center gap-3 mb-4"
            style={{
              position: 'sticky',
              top: '64px',
              zIndex: 10,
              background: 'var(--color-bg-page)',
              padding: '10px 0',
              marginTop: '-10px',
            }}
          >
            {/* Mobile sidebar trigger */}
            <button
              ref={triggerRef}
              type="button"
              className="lg:hidden shrink-0 w-10 h-10 flex items-center justify-center rounded-full cursor-pointer"
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
              aria-label="종목 필터 메뉴 열기"
              style={{
                background: 'var(--color-bg-tint)',
                border: '1px solid var(--color-border-medium)',
                color: 'var(--color-text-primary)',
              }}
            >
              <Menu size={16} aria-hidden="true" />
            </button>

            <div
              className="flex items-center gap-2 flex-1 h-10"
              style={{
                background: 'var(--color-bg-tint)',
                border: '1px solid var(--color-border-medium)',
                borderRadius: '999px',
                padding: '0 16px',
              }}
            >
              <Search
                size={14}
                style={{ opacity: 0.4, flexShrink: 0 }}
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="뉴스 제목 또는 언론사 검색..."
                aria-label="뉴스 제목 또는 언론사 검색"
                className="flex-1 bg-transparent border-none outline-none text-text-primary min-w-0"
                style={{ fontSize: '13.5px' }}
              />
            </div>
          </div>

          <PromoAdBannerMobile />

          {isError ? (
            <div
              className="flex flex-col items-center justify-center py-24 px-4 text-center"
              aria-live="polite"
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-medium)',
                borderRadius: '12px',
                color: 'var(--color-text-secondary)',
                fontSize: '14px',
              }}
            >
              뉴스 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </div>
          ) : filteredItems.length > 0 ? (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block transition-colors"
                    style={{
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border-medium)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        'var(--color-bg-tint)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        'var(--color-bg-surface)';
                    }}
                  >
                    <div
                      className="flex items-center justify-between gap-2 mb-2"
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--color-text-hint)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#60a5fa',
                            background: 'rgba(37,99,235,0.16)',
                            border: '1px solid rgba(37,99,235,0.3)',
                            padding: '2px 8px',
                            borderRadius: '999px',
                          }}
                        >
                          {item.category}
                        </span>
                        <span
                          style={{
                            color: 'var(--color-text-tertiary)',
                            fontWeight: 500,
                          }}
                        >
                          {item.source}
                        </span>
                      </div>
                      <time dateTime={item.publishedAt}>
                        {formatDate(item.publishedAt)}
                      </time>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <h2
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                          lineHeight: 1.45,
                        }}
                      >
                        {item.title}
                      </h2>
                      <span
                        aria-hidden="true"
                        style={{
                          fontSize: '13px',
                          color: 'var(--color-text-disabled)',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        ↗
                      </span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-28"
              aria-live="polite"
              aria-atomic="true"
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-medium)',
                borderRadius: '12px',
                color: 'var(--color-text-secondary)',
                fontSize: '15px',
              }}
            >
              조건에 맞는 뉴스가 없습니다.
            </div>
          )}
        </section>

        {/* Right sidebar: 커뮤니티 우측 필터 스타일 ('공지' -> '전체') */}
        <aside
          className="hidden lg:flex flex-col shrink-0"
          style={{
            width: '260px',
            position: 'sticky',
            top: '80px',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-medium)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--color-border)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
            }}
          >
            종목 필터
          </div>

          <div style={{ padding: '6px 0' }}>
            <button
              type="button"
              onClick={() => handleSelectCategory('전체')}
              className="w-full flex items-center gap-3 cursor-pointer text-left"
              style={{
                padding: '10px 16px',
                background:
                  selectedCategory === '전체'
                    ? 'var(--color-btn-basic)'
                    : 'transparent',
                border: 'none',
                borderLeft:
                  selectedCategory === '전체'
                    ? '3px solid #2563eb'
                    : '3px solid transparent',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(37,99,235,0.15)',
                  border: '1.5px solid rgba(37,99,235,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0,
                }}
              >
                📰
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                }}
              >
                전체
              </span>
              {selectedCategory === '전체' && (
                <div
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#2563eb',
                    marginLeft: 'auto',
                    flexShrink: 0,
                  }}
                />
              )}
            </button>

            {sportsWithCategory.map(({ category, icon, iconSize, color }) => {
              const isSelected = selectedCategory === category;
              const isHovered = hoveredCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    handleSelectCategory(isSelected ? '전체' : category)
                  }
                  onMouseEnter={() => setHoveredCategory(category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className="w-full flex items-center gap-3 cursor-pointer text-left"
                  style={{
                    padding: '10px 16px',
                    background: isSelected
                      ? 'var(--color-btn-basic)'
                      : isHovered
                        ? 'var(--color-bg-tint)'
                        : 'transparent',
                    border: 'none',
                    borderLeft: isSelected
                      ? '3px solid #2563eb'
                      : `3px solid ${isHovered ? color : 'transparent'}`,
                    fontFamily: 'inherit',
                    transition: 'background 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: color + '33',
                      border: `1.5px solid ${color}66`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: iconSize,
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: isSelected ? 700 : 600,
                      color: 'var(--color-text-high)',
                    }}
                  >
                    {category}
                  </span>
                  {isSelected && (
                    <div
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#2563eb',
                        marginLeft: 'auto',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      <div style={{ paddingBottom: '64px' }} />

      {/* ── Mobile drawer (lg 미만에서만 렌더) ── */}
      {drawerOpen && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="종목 필터 메뉴"
          className="lg:hidden fixed inset-0 z-50 flex"
        >
          <div
            style={{
              width: '300px',
              height: '100%',
              overflowY: 'auto',
              background: 'var(--color-bg-surface)',
              borderRight: '1px solid var(--color-border-medium)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--color-border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 1,
                background: 'var(--color-bg-surface)',
              }}
            >
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                }}
              >
                뉴스 메뉴
              </span>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="메뉴 닫기"
                style={{
                  padding: '6px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div>
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                }}
              >
                종목 필터
              </div>

              <div style={{ padding: '6px 0' }}>
                <button
                  type="button"
                  onClick={() => handleSelectCategory('전체')}
                  className="w-full flex items-center gap-3 cursor-pointer text-left"
                  style={{
                    padding: '10px 16px',
                    background:
                      selectedCategory === '전체'
                        ? 'var(--color-btn-basic)'
                        : 'transparent',
                    border: 'none',
                    borderLeft:
                      selectedCategory === '전체'
                        ? '3px solid #2563eb'
                        : '3px solid transparent',
                    fontFamily: 'inherit',
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'rgba(37,99,235,0.15)',
                      border: '1.5px solid rgba(37,99,235,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      flexShrink: 0,
                    }}
                  >
                    📰
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    전체
                  </span>
                  {selectedCategory === '전체' && (
                    <div
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#2563eb',
                        marginLeft: 'auto',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>

                {sportsWithCategory.map(
                  ({ category, icon, iconSize, color }) => {
                    const isSelected = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() =>
                          handleSelectCategory(isSelected ? '전체' : category)
                        }
                        className="w-full flex items-center gap-3 cursor-pointer text-left"
                        style={{
                          padding: '10px 16px',
                          background: isSelected
                            ? 'var(--color-btn-basic)'
                            : 'transparent',
                          border: 'none',
                          borderLeft: isSelected
                            ? '3px solid #2563eb'
                            : '3px solid transparent',
                          fontFamily: 'inherit',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            const el = e.currentTarget as HTMLElement;
                            el.style.background = 'var(--color-bg-tint)';
                            el.style.borderLeftColor = color;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            const el = e.currentTarget as HTMLElement;
                            el.style.background = 'transparent';
                            el.style.borderLeftColor = 'transparent';
                          }
                        }}
                      >
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: color + '33',
                            border: `1.5px solid ${color}66`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: iconSize,
                            flexShrink: 0,
                          }}
                        >
                          {icon}
                        </div>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: isSelected ? 700 : 600,
                            color: 'var(--color-text-high)',
                          }}
                        >
                          {category}
                        </span>
                        {isSelected && (
                          <div
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: '#2563eb',
                              marginLeft: 'auto',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          </div>

          <div
            style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }}
            onClick={closeDrawer}
            aria-hidden="true"
          />
        </div>
      )}
    </section>
  );
}
