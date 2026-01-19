'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NewsPost } from '@/types/news';
import { getFeaturedImageUrl, formatDate, getPostCategories } from '@/lib/api';
import { ArrowRight, Facebook } from 'lucide-react';

interface NewsCardProps {
  post: NewsPost;
}

export default function NewsCard({ post }: NewsCardProps) {
  const featuredImage = getFeaturedImageUrl(post);
  const categories = getPostCategories(post);
  const [imageError, setImageError] = useState(false);

  const hasImage = featuredImage && !imageError;

  const handleShareFacebook = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(post.link)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  // Text-only card (no image)
  if (!hasImage) {
    return (
      <Link
        href={post.link}
        target="_blank"
        rel="noopener noreferrer"
        className="news-card group flex flex-col rounded-xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-gray-800/50 dark:from-gray-900 dark:to-gray-800 dark:hover:border-blue-800"
      >
        {/* Category Badge */}
        {categories.length > 0 && (
          <div className="mb-3">
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 sm:text-xs">
              {categories[0].name}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="mb-3 text-base font-bold text-gray-900 line-clamp-3 transition-colors group-hover:text-blue-600 sm:text-lg dark:text-gray-100 dark:group-hover:text-blue-400">
          {post.title.rendered}
        </h3>

        {/* Date & Actions */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-[11px] text-gray-500 sm:text-xs dark:text-gray-400">
            {formatDate(post.date)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareFacebook}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white transition-all hover:bg-blue-700 hover:scale-110"
              title="แชร์ไปยัง Facebook"
            >
              <Facebook className="h-3.5 w-3.5" />
            </button>
            <span className="flex items-center gap-1 text-xs font-medium text-blue-600 transition-all group-hover:translate-x-0.5 dark:text-blue-400">
              อ่านต่อ
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Card with image
  return (
    <Link
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className="news-card group flex flex-col overflow-hidden rounded-xl border border-gray-200/50 bg-white shadow-sm dark:border-gray-800/50 dark:bg-gray-900"
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={featuredImage}
          alt={post.title.rendered}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={() => setImageError(true)}
        />

        {/* Category Badge */}
        {categories.length > 0 && (
          <div className="absolute left-3 top-3 z-10">
            <span className="rounded-full bg-blue-600/90 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm sm:px-3 sm:text-xs">
              {categories[0].name}
            </span>
          </div>
        )}

        {/* Facebook Share Button */}
        <button
          onClick={handleShareFacebook}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white opacity-0 transition-all hover:bg-blue-700 hover:scale-110 group-hover:opacity-100"
          title="แชร์ไปยัง Facebook"
        >
          <Facebook className="h-4 w-4" />
        </button>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Title */}
        <h3 className="mb-2 text-sm font-bold text-gray-900 line-clamp-2 transition-colors group-hover:text-blue-600 sm:text-base dark:text-gray-100 dark:group-hover:text-blue-400">
          {post.title.rendered}
        </h3>

        {/* Date & Read More */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-[11px] text-gray-500 sm:text-xs dark:text-gray-400">
            {formatDate(post.date)}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-blue-600 opacity-0 transition-all group-hover:opacity-100 dark:text-blue-400">
            อ่านต่อ
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
