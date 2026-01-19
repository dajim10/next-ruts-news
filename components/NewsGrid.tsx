import { NewsPost } from '@/types/news';
import NewsCard from './NewsCard';
import { Inbox } from 'lucide-react';

interface NewsGridProps {
  posts: NewsPost[];
  featuredPost?: NewsPost;
}

export default function NewsGrid({ posts }: NewsGridProps) {
  if (posts.length === 0) {
    return (
      <div className="py-12 text-center sm:py-16">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
          <Inbox className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-base font-medium text-gray-500 sm:text-lg dark:text-gray-400">
          ไม่พบข่าวที่ต้องการ
        </p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          ลองเปลี่ยนตัวกรองหรือคำค้นหาดูนะครับ
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
      {posts.map((post, index) => (
        <div key={`${post.id}-${index}`}>
          <NewsCard post={post} />
        </div>
      ))}
    </div>
  );
}
