import axios from 'axios';

const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour

export async function scrapeTikTokProfile(username) {
  try {
    // Remove @ if present
    username = username.replace('@', '').trim();

    // Check cache
    const cached = cache.get(`tiktok_${username}`);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const url = `https://www.tiktok.com/@${username}`;

    // Headers to avoid blocking
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.tiktok.com/'
    };

    const response = await axios.get(url, {
      headers,
      timeout: 10000
    });

    // Extract data from response
    const html = response.data;

    // TikTok stores data in window.__UNIVERSAL_DATA_FOR_REHYDRATION__
    const dataMatch = html.match(/"followerCount":(\d+)/);
    const followingMatch = html.match(/"followingCount":(\d+)/);
    const heartMatch = html.match(/"heart":(\d+)/);
    const videoMatch = html.match(/"videoCount":(\d+)/);
    const viewMatch = html.match(/"viewCount":(\d+)/);
    const commentMatch = html.match(/"commentCount":(\d+)/);

    // Alternative patterns if primary doesn't work
    const totalViewMatch = html.match(/"totalViews":"?(\d+)"?/);
    const totalCommentMatch = html.match(/"totalComments":"?(\d+)"?/);

    if (!dataMatch) {
      throw new Error('Could not parse TikTok profile');
    }

    const videoCount = Math.max(parseInt(videoMatch?.[1]) || 1, 1);
    const totalHearts = parseInt(heartMatch?.[1]) || 0; // лайки за всё время аккаунта

    // Приводим всё к СРЕДНЕМУ НА ОДИН РОЛИК (иначе lifetime-лайки ломают метрики)
    const avgLikes = Math.round(totalHearts / videoCount);

    // viewCount в профиле часто относится к одному ролику. Если он меньше средних
    // лайков — это мусор, оцениваем просмотры из лайков (типичный like-rate ~6%)
    const parsedViews = parseInt(viewMatch?.[1]) || parseInt(totalViewMatch?.[1]) || 0;
    const avgViews = parsedViews > avgLikes ? parsedViews : Math.round(avgLikes / 0.06);

    const parsedComments = parseInt(commentMatch?.[1]) || parseInt(totalCommentMatch?.[1]) || 0;
    const avgComments = parsedComments > 0 ? parsedComments : Math.round(avgLikes * 0.02);

    const data = {
      platform: 'tiktok',
      username,
      followers: parseInt(dataMatch[1]) || 0,
      following: parseInt(followingMatch?.[1]) || 0,
      videos: videoCount,
      total_hearts: totalHearts,
      estimated_likes: avgLikes,
      total_views: avgViews,
      estimated_comments: avgComments,
      url
    };

    // Cache result
    cache.set(`tiktok_${username}`, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    throw new Error(`TikTok scraping failed: ${error.message}`);
  }
}

export function validateTikTokUrl(url) {
  return /tiktok\.com\/@/.test(url) || /tiktok\.com\/.*user\//.test(url);
}

export function extractTikTokUsername(url) {
  const match = url.match(/@([a-zA-Z0-9._]+)/);
  return match ? match[1] : null;
}
