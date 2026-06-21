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

    const views = parseInt(viewMatch?.[1]) || parseInt(totalViewMatch?.[1]) || 0;
    const comments = parseInt(commentMatch?.[1]) || parseInt(totalCommentMatch?.[1]) || 0;

    // Estimate if not found: average ~10% views per video, ~2% comments per video
    const videoCount = parseInt(videoMatch?.[1]) || 1;
    const estimatedViews = views || (parseInt(heartMatch?.[1]) || 0) / 0.02 / videoCount;
    const estimatedComments = comments || (parseInt(heartMatch?.[1]) || 0) * 0.02 / videoCount;

    const data = {
      platform: 'tiktok',
      username,
      followers: parseInt(dataMatch[1]) || 0,
      following: parseInt(followingMatch?.[1]) || 0,
      likes: parseInt(heartMatch?.[1]) || 0,
      videos: videoCount,
      total_views: Math.round(views) || Math.round(estimatedViews),
      estimated_comments: Math.round(comments) || Math.round(estimatedComments),
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
