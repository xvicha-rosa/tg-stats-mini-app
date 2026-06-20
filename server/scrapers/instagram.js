import axios from 'axios';

const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour

export async function scrapeInstagramProfile(username) {
  try {
    username = username.replace('@', '').trim();

    // Check cache
    const cached = cache.get(`instagram_${username}`);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const url = `https://www.instagram.com/${username}/`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.instagram.com/'
    };

    const response = await axios.get(url, {
      headers,
      timeout: 10000
    });

    const html = response.data;

    // Extract data from Instagram HTML
    // Instagram stores data in window._sharedData or script tags
    const followersMatch = html.match(/"edge_followed_by":\{"count":(\d+)/);
    const followingMatch = html.match(/"edge_follow":\{"count":(\d+)/);
    const postsMatch = html.match(/"edge_owner_to_timeline_media":\{"count":(\d+)/);

    if (!followersMatch) {
      throw new Error('Could not parse Instagram profile');
    }

    const data = {
      platform: 'instagram',
      username,
      followers: parseInt(followersMatch[1]) || 0,
      following: parseInt(followingMatch?.[1]) || 0,
      posts: parseInt(postsMatch?.[1]) || 0,
      url
    };

    // For Instagram, we'll estimate engagement from profile
    // This is approximate - real engagement needs per-post data
    data.estimated_likes = Math.round(data.followers * 0.03); // ~3% likes per post
    data.estimated_comments = Math.round(data.followers * 0.005); // ~0.5% comments

    cache.set(`instagram_${username}`, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    throw new Error(`Instagram scraping failed: ${error.message}`);
  }
}

export function validateInstagramUrl(url) {
  return /instagram\.com\//.test(url);
}

export function extractInstagramUsername(url) {
  const match = url.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
  return match ? match[1] : null;
}
