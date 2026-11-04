import { NextResponse } from 'next/server';
import type { FeaturedPost } from '@/lib/api';

const API_BASE_URL = 'https://nodeapi.apps.rmutsv.ac.th';
const MAX_SLIDES = 5;

/**
 * ดึงข่าวเด่นสำหรับ carousel
 *
 * เหตุผลที่ต้องมี route นี้: upstream `/posts/highlights-th` ส่งข่าว 1,174 ชิ้น (~815 KB)
 * มาทั้งก้อน แต่ carousel ใช้จริงแค่ 5 สไลด์ เดิม browser เป็นคนโหลดทั้ง 815 KB นั้นเอง
 * ย้ายมาคัดบน server แล้วส่งกลับแค่ 5 ชิ้น (~2 KB) และ `next.revalidate` ทำให้ยิง upstream
 * ครั้งเดียวต่อ 5 นาที แชร์ผลลัพธ์กับผู้ใช้ทุกคน แทนที่จะยิงใหม่ทุกคนทุกครั้ง
 */
// Next ต้องอ่านค่านี้ตอน build จึงต้องเป็นตัวเลขตรง ๆ ใส่ตัวแปรไม่ได้
export const revalidate = 300;

async function fetchFeed(slug: string): Promise<unknown[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/posts/${slug}`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching feed ${slug}:`, error);
    return [];
  }
}

export async function GET() {
  const [events, highlights] = await Promise.all([
    fetchFeed('upcoming-events-th'),
    fetchFeed('highlights-th'),
  ]);

  const seen = new Set<string>();
  const posts: FeaturedPost[] = [];

  for (const raw of [...events, ...highlights]) {
    const post = raw as Partial<FeaturedPost>;
    const guid = post.guid?.rendered;
    const image = post.featureImage?.trim();

    // ข้ามข่าวที่ไม่มีรูป เพราะ carousel เป็น layout ที่ต้องมีภาพพื้นหลัง
    if (!guid || !image || seen.has(guid)) continue;

    seen.add(guid);
    posts.push({
      date: post.date ?? '',
      guid: { rendered: guid },
      title: typeof post.title === 'string' ? post.title : '',
      link: post.link ?? '',
      categories: post.categories ?? [],
      slug: post.slug ?? '',
      featureImage: image,
    });
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json(posts.slice(0, MAX_SLIDES), {
    headers: {
      'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate=60`,
    },
  });
}
