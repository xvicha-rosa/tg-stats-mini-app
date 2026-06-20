import axios from 'axios';

const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour

export async function scrapeYouTubeChannel(channelUrlOrId) {
  try {
    // Normalize channel identifier
    let channelUrl = channelUrlOrId;
    if (!channelUrlOrId.startsWith('http')) {
      channelUrl = `https://www.youtube.com/${channelUrlOrId}`;
    }

    // Check cache
    const cacheKey = `youtube_${channelUrl}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9'
    };

    const response = await axios.get(channelUrl, {
      headers,
      timeout: 10000
    });

    const html = response.data;

    // Extract subscriber count
    const subMatch = html.match(/"subscriberCountText":\{"simpleText":"([\d.KMB]+)/);
    const viewMatch = html.match(/"viewCountText":\{"simpleText":"([\d.KMB]+)/);
    const videoMatch = html.match(/"videoCountText":\{"simpleText":"([\d.KMB]+)/);

    if (!subMatch) {
      throw new Error('Could not parse YouTube channel');
    }

    const data = {
      platform: 'youtube',
      url: channelUrl,
      subscribers: parseYouTubeCount(subMatch[1]) || 0,
      total_views: parseYouTubeCount(viewMatch?.[1]) || 0,
      video_count: parseYouTubeCount(videoMatch?.[1]) || 0,
      // Estimate engagement (YouTube doesn't show exact per-channel numbers)
      estimated_avg_likes: Math.round(parseYouTubeCount(viewMatch?.[1]) * 0.02 / Math.max(parseYouTubeCount(videoMatch?.[1]), 1)),
      estimated_avg_comments: Math.round(parseYouTubeCount(viewMatch?.[1]) * 0.005 / Math.max(parseYouTubeCount(videoMatch?.[1]), 1))
    };

    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    throw new Error(`YouTube scraping failed: ${error.message}`);
  }
}

function parseYouTubeCount(countStr) {
  if (!countStr) return 0;

  const multipliers = {
    K: 1000,
    M: 1000000,
    B: 1000000000
  };

  const match = countStr.match(/([\d.]+)([KMB]?)/);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  const suffix = match[2];

  return Math.floor(num * (multipliers[suffix] || 1));
}

export function validateYouTubeUrl(url) {
  return /youtube\.com\/(c\/|channel\/|@|user\/)/.test(url) || /youtu\.be/.test(url);
}

export function extractYouTubeChannelId(url) {
  // Extract channel ID or handle
  const match = url.match(/(?:youtube\.com\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
