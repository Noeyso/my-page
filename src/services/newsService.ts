const RSS_FEEDS: Record<string, string[]> = {
  뉴스: [
    'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
    'https://news.google.com/rss/search?q=한국+속보&hl=ko&gl=KR&ceid=KR:ko',
  ],
  스포츠: [
    'https://news.google.com/rss/search?q=스포츠&hl=ko&gl=KR&ceid=KR:ko',
  ],
  연예: [
    'https://news.google.com/rss/search?q=연예&hl=ko&gl=KR&ceid=KR:ko',
  ],
  경제: [
    'https://news.google.com/rss/search?q=경제&hl=ko&gl=KR&ceid=KR:ko',
  ],
  테크: [
    'https://news.google.com/rss/search?q=IT+기술&hl=ko&gl=KR&ceid=KR:ko',
  ],
  생활: [
    'https://news.google.com/rss/search?q=생활+문화&hl=ko&gl=KR&ceid=KR:ko',
  ],
};

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export const NEWS_CATEGORIES = Object.keys(RSS_FEEDS);

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

const cache = new Map<string, { items: NewsItem[]; time: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export async function fetchNews(category: string): Promise<NewsItem[]> {
  const cached = cache.get(category);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.items;
  }

  const feedUrls = RSS_FEEDS[category];
  if (!feedUrls) return [];

  for (const feedUrl of feedUrls) {
    for (const makeProxy of CORS_PROXIES) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(makeProxy(feedUrl), { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) continue;
        const text = await res.text();
        const items = parseRSS(text);
        if (items.length > 0) {
          cache.set(category, { items, time: Date.now() });
          return items;
        }
      } catch {
        // try next proxy/feed
      }
    }
  }

  return [];
}

function parseRSS(xml: string): NewsItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = doc.querySelectorAll('item');
  const results: NewsItem[] = [];

  items.forEach((item, i) => {
    if (i >= 15) return;
    const title = item.querySelector('title')?.textContent ?? '';
    const link = item.querySelector('link')?.textContent ?? '#';
    const pubDate = item.querySelector('pubDate')?.textContent ?? '';
    const source = item.querySelector('source')?.textContent ?? '';
    if (title) {
      results.push({ title: cleanTitle(title), link, pubDate, source });
    }
  });

  return results;
}

function cleanTitle(title: string): string {
  return title.replace(/ - [^-]+$/, '').trim();
}
