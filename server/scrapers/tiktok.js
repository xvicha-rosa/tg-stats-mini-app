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

    if (!dataMatch) {
      throw new Error('Could not parse TikTok profile');
    }

    const data = {
      platform: 'tiktok',
      username,
      followers: parseInt(dataMatch[1]) || 0,
      following: parseInt(followingMatch?.[1]) || 0,
      likes: parseInt(heartMatch?.[1]) || 0,
      videos: parseInt(videoMatch?.[1]) || 0,
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
