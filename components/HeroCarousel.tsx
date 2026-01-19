'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselPost {
    date: string;
    guid: { rendered: string };
    title: string;
    link: string;
    categories: number[];
    slug: string;
    featureImage: string;
}

interface HeroCarouselProps {
    posts: CarouselPost[];
}

export default function HeroCarousel({ posts }: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, [posts.length]);

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false);
        // Resume auto-play after 5 seconds
        setTimeout(() => setIsAutoPlaying(true), 5000);
    };

    // Auto-play
    useEffect(() => {
        if (!isAutoPlaying || posts.length <= 1) return;

        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, posts.length, nextSlide]);

    if (posts.length === 0) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-gray-900 shadow-2xl sm:rounded-3xl">
            {/* Main Carousel Container */}
            <div className="relative aspect-[16/9] sm:aspect-[21/9]">
                {/* Slides */}
                {posts.map((post, index) => (
                    <Link
                        key={post.guid.rendered}
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === currentIndex
                                ? 'opacity-100 scale-100'
                                : 'opacity-0 scale-105 pointer-events-none'
                            }`}
                    >
                        {/* Image */}
                        <Image
                            src={post.featureImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                            priority={index === 0}
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 1280px"
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-12">
                            <div className="max-w-3xl">
                                {/* Badge */}
                                <div className="mb-2 sm:mb-3">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm sm:px-4 sm:text-sm">
                                        <Flame className="h-3 w-3 sm:h-4 sm:w-4" />
                                        ข่าวเด่น
                                    </span>
                                </div>

                                {/* Title */}
                                <h2 className="mb-2 text-lg font-bold text-white line-clamp-2 sm:mb-3 sm:text-xl md:text-2xl lg:text-3xl">
                                    {post.title}
                                </h2>

                                {/* Date */}
                                <p className="text-xs text-gray-300 sm:text-sm">
                                    {formatDate(post.date)}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}

                {/* Navigation Arrows */}
                {posts.length > 1 && (
                    <>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                prevSlide();
                                setIsAutoPlaying(false);
                            }}
                            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/50 sm:left-4 sm:p-3"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                nextSlide();
                                setIsAutoPlaying(false);
                            }}
                            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/50 sm:right-4 sm:p-3"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    </>
                )}
            </div>

            {/* Dots Indicator */}
            {posts.length > 1 && (
                <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:bottom-4 sm:gap-2">
                    {posts.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-1.5 rounded-full transition-all sm:h-2 ${index === currentIndex
                                    ? 'w-6 bg-white sm:w-8'
                                    : 'w-1.5 bg-white/50 hover:bg-white/70 sm:w-2'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Progress Bar */}
            {posts.length > 1 && isAutoPlaying && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
                    <div
                        className="h-full bg-blue-500 transition-all duration-100"
                        style={{
                            width: `${((currentIndex + 1) / posts.length) * 100}%`,
                        }}
                    />
                </div>
            )}
        </div>
    );
}
