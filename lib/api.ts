import { NewsPost } from '@/types/news';

const API_BASE_URL = 'https://nodeapi.apps.rmutsv.ac.th';

// Do not add Authorization or custom headers to nodeapi requests from the browser.
// They trigger a CORS preflight, and nodeapi answers OPTIONS without
// Access-Control-Allow-Origin, so the browser blocks the request. The API is public
// and needs no token.

// Interface for carousel/featured posts (simpler structure)
export interface FeaturedPost {
  date: string;
  guid: { rendered: string };
  title: string;
  link: string;
  categories: number[];
  slug: string;
  featureImage: string;
}

/**
 * Fetch featured posts for carousel
 *
 * เรียก route handler ของเราเอง ไม่ยิง nodeapi ตรง ๆ เพราะ `/posts/highlights-th`
 * ส่งข่าว 1,174 ชิ้น (~815 KB) มาทั้งก้อนเพื่อใช้แค่ 5 สไลด์
 * ฝั่ง server คัดให้เหลือ 5 ชิ้นแล้ว (~2 KB) และ cache ร่วมกันทุกคน 5 นาที
 */
export async function fetchFeaturedPosts(): Promise<FeaturedPost[]> {
  try {
    const response = await fetch('/api/featured');
    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    return [];
  }
}

/**
 * Fetch all posts from the API
 */
export async function fetchAllPosts(): Promise<NewsPost[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * Fetch posts filtered by faculty slug
 */
export async function fetchPostsByFaculty(slug: string): Promise<NewsPost[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${slug}`, {
      next: { revalidate: 300 },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch posts by faculty');
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    
    // Transform API response to match NewsPost type
    // API returns title as string, but NewsPost expects title.rendered
    return data.map((post: any, index: number) => ({
      id: post.id || index,
      date: post.date,
      date_gmt: post.date_gmt || post.date,
      guid: post.guid,
      modified: post.modified || post.date,
      modified_gmt: post.modified_gmt || post.date,
      slug: post.slug,
      status: post.status || 'publish',
      type: post.type || 'post',
      link: post.link,
      title: typeof post.title === 'string' ? { rendered: post.title } : post.title,
      content: post.content || { rendered: '', protected: false },
      excerpt: post.excerpt || { rendered: '', protected: false },
      author: post.author || 0,
      featured_media: post.featured_media || 0,
      comment_status: post.comment_status || 'closed',
      ping_status: post.ping_status || 'closed',
      sticky: post.sticky || false,
      template: post.template || '',
      format: post.format || 'standard',
      meta: post.meta || {},
      categories: post.categories || [],
      tags: post.tags || [],
      _links: post._links || {},
      _embedded: {
        'wp:featuredmedia': post.featureImage ? [{ 
          id: 0, 
          source_url: post.featureImage,
          media_details: { sizes: {} }
        }] : undefined,
        'wp:term': post._embedded?.['wp:term'],
      },
    }));
  } catch (error) {
    console.error('Error fetching posts by faculty:', error);
    return [];
  }
}

/**
 * Fetch posts filtered by faculty slug with pagination
 *
 * Throws on failure. Callers must be able to tell a failed request from an empty
 * result, otherwise infinite scroll treats one network error as the end of the list.
 */
export async function fetchPostsByFacultyPaginated(
  slug: string,
  perPage: number = 12
): Promise<NewsPost[]> {
  const response = await fetch(`${API_BASE_URL}/posts/${slug}/${perPage}`, {
    next: { revalidate: 300 },
    cache: 'no-store', // For infinite scroll, don't cache
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch posts by faculty');
  }
  
  const data = await response.json();
  if (!Array.isArray(data)) return [];
  
  // Transform API response to match NewsPost type
  return data.map((post: any, index: number) => ({
    id: post.id || index,
    date: post.date,
    date_gmt: post.date_gmt || post.date,
    guid: post.guid,
    modified: post.modified || post.date,
    modified_gmt: post.modified_gmt || post.date,
    slug: post.slug,
    status: post.status || 'publish',
    type: post.type || 'post',
    link: post.link,
    title: typeof post.title === 'string' ? { rendered: post.title } : post.title,
    content: post.content || { rendered: '', protected: false },
    excerpt: post.excerpt || { rendered: '', protected: false },
    author: post.author || 0,
    featured_media: post.featured_media || 0,
    comment_status: post.comment_status || 'closed',
    ping_status: post.ping_status || 'closed',
    sticky: post.sticky || false,
    template: post.template || '',
    format: post.format || 'standard',
    meta: post.meta || {},
    categories: post.categories || [],
    tags: post.tags || [],
    _links: post._links || {},
    _embedded: {
      'wp:featuredmedia': post.featureImage ? [{ 
        id: 0, 
        source_url: post.featureImage,
        media_details: { sizes: {} }
      }] : undefined,
      'wp:term': post._embedded?.['wp:term'],
    },
  }));
}

/**
 * Extract unique faculties from posts
 */
export function extractFaculties(posts: NewsPost[]): string[] {
  const facultySet = new Set<string>();
  
  posts.forEach(post => {
    if (post.slug) {
      const slugs = post.slug.split(',');
      slugs.forEach(slug => {
        try {
          // Decode URL-encoded Thai text
          const decoded = decodeURIComponent(slug.trim());
          facultySet.add(decoded);
        } catch {
          facultySet.add(slug.trim());
        }
      });
    }
  });
  
  return Array.from(facultySet).sort();
}

/**
 * Extract unique categories from posts
 */
export function extractCategories(posts: NewsPost[]): Map<number, string> {
  const categoryMap = new Map<number, string>();
  
  posts.forEach(post => {
    if (post._embedded?.['wp:term']) {
      post._embedded['wp:term'].forEach(terms => {
        terms.forEach(term => {
          if (term.taxonomy === 'category') {
            categoryMap.set(term.id, term.name);
          }
        });
      });
    }
  });
  
  return categoryMap;
}

/**
 * Get featured image URL from post
 */
export function getFeaturedImageUrl(post: NewsPost): string | null {
  if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    const url = post._embedded['wp:featuredmedia'][0].source_url;
    // Return null if URL is empty string
    return url && url.trim() !== '' ? url : null;
  }
  return null;
}

/**
 * Get categories for a post
 */
export function getPostCategories(post: NewsPost): Array<{ id: number; name: string; slug: string }> {
  if (post._embedded?.['wp:term']) {
    const categories: Array<{ id: number; name: string; slug: string }> = [];
    post._embedded['wp:term'].forEach(terms => {
      terms.forEach(term => {
        if (term.taxonomy === 'category') {
          categories.push({
            id: term.id,
            name: term.name,
            slug: term.slug,
          });
        }
      });
    });
    return categories;
  }
  return [];
}

/**
 * Format date to Thai locale
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
