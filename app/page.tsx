'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { NewsPost } from '@/types/news';
import { fetchPostsByFacultyPaginated, extractFaculties, extractCategories, fetchFeaturedPosts, FeaturedPost } from '@/lib/api';
import NewsGrid from '@/components/NewsGrid';
import FacultyDropdown from '@/components/FacultyDropdown';
import CategoryFilter from '@/components/CategoryFilter';
import SearchBar from '@/components/SearchBar';
import HeroCarousel from '@/components/HeroCarousel';
import { Newspaper, Flame, Loader2, AlertCircle, RefreshCw, X } from 'lucide-react';

const POSTS_PER_PAGE = 12;

export default function Home() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    async function loadData() {
      try {
        setError(null);
        const [featured, appsPosts] = await Promise.all([
          fetchFeaturedPosts(),
          fetchPostsByFacultyPaginated('apps', POSTS_PER_PAGE),
        ]);
        setFeaturedPosts(featured);
        setPosts(appsPosts);
        setHasMore(appsPosts.length >= POSTS_PER_PAGE);
      } catch (error) {
        console.error('Error loading posts:', error);
        setError('ไม่สามารถโหลดข่าวได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Load more posts
  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const newPosts = await fetchPostsByFacultyPaginated('apps', posts.length + POSTS_PER_PAGE);

      if (newPosts.length <= posts.length) {
        setHasMore(false);
      } else {
        setPosts(newPosts);
        setHasMore(newPosts.length >= posts.length + POSTS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, posts.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadingMore, loadMorePosts]);

  const faculties = useMemo(() => extractFaculties(posts), [posts]);
  const categories = useMemo(() => extractCategories(posts), [posts]);

  const filteredPosts = useMemo(() => {
    let filtered = [...posts];

    // Filter by faculty
    if (selectedFaculty) {
      filtered = filtered.filter((post) => {
        const decodedSlugs = post.slug.split(',').map(s => {
          try {
            return decodeURIComponent(s.trim());
          } catch {
            return s.trim();
          }
        });
        return decodedSlugs.includes(selectedFaculty);
      });
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((post) =>
        post.categories.some((catId) => selectedCategories.includes(catId))
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.rendered.toLowerCase().includes(query) ||
          post.excerpt?.rendered.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [posts, selectedFaculty, selectedCategories, searchQuery]);

  const handleToggleCategory = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 dark:from-gray-950 dark:to-slate-900">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-base font-medium text-gray-600 dark:text-gray-400">กำลังโหลดข่าว...</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">โปรดรอสักครู่</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 px-4 dark:from-gray-950 dark:to-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 hover:shadow-xl"
          >
            <RefreshCw className="h-4 w-4" />
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      {/* Sticky Header */}
      <header className="header-blur sticky top-0 z-50 border-b border-gray-200/50 shadow-sm dark:border-gray-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between sm:h-20">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30 sm:h-12 sm:w-12">
                <Newspaper className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 sm:text-lg dark:text-white">
                  ข่าวสาร มทร.ศรีวิชัย
                </h1>
                <p className="hidden text-xs text-gray-500 sm:block dark:text-gray-400">
                  Rajamangala University of Technology Srivijaya
                </p>
              </div>
            </div>

            {/* Right Controls - Hidden for now */}
            {/* <div className="flex items-center gap-3">
              <FacultyDropdown
                faculties={faculties}
                selectedFaculty={selectedFaculty}
                onSelectFaculty={setSelectedFaculty}
              />
            </div> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Hero Carousel */}
        {featuredPosts.length > 0 && (
          <section className="mb-8 sm:mb-12">
            <div className="mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
                ข่าวเด่น / กิจกรรม
              </h2>
            </div>
            <HeroCarousel posts={featuredPosts} />
          </section>
        )}

        {/* Search & Filter Section */}
        <section className="mb-8 rounded-2xl border border-gray-200/50 bg-white/70 p-4 shadow-sm backdrop-blur-sm sm:p-6 dark:border-gray-800/50 dark:bg-gray-900/70">
          <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

          <CategoryFilter
            categories={categories}
            selectedCategories={selectedCategories}
            onToggleCategory={handleToggleCategory}
          />

          {/* Results count */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              พบข่าวทั้งหมด <span className="font-bold text-blue-600 dark:text-blue-400">{filteredPosts.length}</span> ข่าว
            </div>
            {(selectedFaculty || selectedCategories.length > 0 || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedFaculty(null);
                  setSelectedCategories([]);
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                ล้างตัวกรอง
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>

        {/* News Grid Section */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
              ข่าวล่าสุด
            </h2>
          </div>
          <NewsGrid posts={filteredPosts} />

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="mt-8 flex justify-center py-4">
            {loadingMore && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">กำลังโหลดข่าวเพิ่ม...</span>
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <p className="text-sm text-gray-400">แสดงข่าวทั้งหมดแล้ว</p>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-gray-200/50 bg-white/50 py-8 backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <Newspaper className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">RUts News</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2025 มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            ติดตามข่าวสารและประกาศจากทุกคณะ
          </p>
        </div>
      </footer>
    </div>
  );
}
