import { NewsPost } from '@/types/news';
import { getAuthToken } from './token';

const API_BASE_URL = 'https://nodeapi.apps.rmutsv.ac.th';

/**
 * Create fetch options with auth token if available
 * Note: Only works on client-side (browser) where sessionStorage is available
 */
function getFetchOptions(options: RequestInit = {}): RequestInit {
  // Only add token on client-side
  if (typeof window === 'undefined') {
    return options;
  }
  
  const token = getAuthToken();
  const existingHeaders = options.headers || {};
  
  // Convert headers to plain object if needed
  const headers: Record<string, string> = {};
  if (existingHeaders instanceof Headers) {
    existingHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (Array.isArray(existingHeaders)) {
    existingHeaders.forEach(([key, value]) => {
      headers[key] = value;
    });
  } else if (existingHeaders) {
    Object.assign(headers, existingHeaders);
  }
  
  // Add token to headers if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    // หรือใช้ header อื่นตามที่ API ต้องการ เช่น:
    // headers['X-Auth-Token'] = token;
  }
  
  return {
    ...options,
    headers,
  };
}

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
 * Fetch featured posts for carousel (upcoming events + highlights)
 */
export async function fetchFeaturedPosts(): Promise<FeaturedPost[]> {
  try {
    // Fetch from both slugs in parallel
    const fetchOptions = getFetchOptions({ next: { revalidate: 300 } });
    const [eventsResponse, highlightsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/posts/upcoming-events-th`, fetchOptions),
      fetch(`${API_BASE_URL}/posts/highlights-th`, fetchOptions),
    ]);
    
    const eventsData = eventsResponse.ok ? await eventsResponse.json() : [];
    const highlightsData = highlightsResponse.ok ? await highlightsResponse.json() : [];
    
    // Combine and deduplicate by guid
    const allPosts = [...(Array.isArray(eventsData) ? eventsData : []), ...(Array.isArray(highlightsData) ? highlightsData : [])];
    const uniquePosts = allPosts.filter((post, index, self) => 
      index === self.findIndex((p) => p.guid?.rendered === post.guid?.rendered)
    );
    
    // Filter out posts without valid featureImage and ensure featureImage is not empty
    const postsWithImages = uniquePosts.filter((post: any) => 
      post.featureImage && post.featureImage.trim() !== ''
    );
    
    // Sort by date (newest first) and limit to 5
    return postsWithImages
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
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
    const response = await fetch(`${API_BASE_URL}/posts`, getFetchOptions({
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    }));
    
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
    const response = await fetch(`${API_BASE_URL}/posts/${slug}`, getFetchOptions({
      next: { revalidate: 300 },
    }));
    
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
 */
export async function fetchPostsByFacultyPaginated(
  slug: string,
  perPage: number = 12
): Promise<NewsPost[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${slug}/${perPage}`, getFetchOptions({
      next: { revalidate: 300 },
      cache: 'no-store', // For infinite scroll, don't cache
    }));
    
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
  } catch (error) {
    console.error('Error fetching posts by faculty:', error);
    return [];
  }
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
