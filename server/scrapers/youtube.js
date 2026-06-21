import axios from 'axios';

const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export async function scrapeYouTubeChannel(channelUrlOrId) {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY not configured');
    }

    const cacheKey = `youtube_${channelUrlOrId}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    let channelId = channelUrlOrId;
    if (channelUrlOrId.includes('youtube.com') || channelUrlOrId.includes('youtu.be')) {
      channelId = await getChannelIdFromUrl(channelUrlOrId);
    }

    const stats = await getChannelStats(channelId);

    const videoCount = Math.max(stats.videoCount || 1, 1);
    // Приводим к СРЕДНЕМУ НА ОДНО ВИДЕО (viewCount у API — суммарно за всё время)
    const avgViews = Math.round((stats.viewCount || 0) / videoCount);
    const avgLikes = Math.round(avgViews * 0.02);   // ~2% лайков от просмотров
    const avgComments = Math.round(avgViews * 0.005); // ~0.5% комментариев

    const data = {
      platform: 'youtube',
      url: `https://www.youtube.com/channel/${channelId}`,
      subscribers: stats.subscriberCount || 0,
      lifetime_views: stats.viewCount || 0,
      video_count: videoCount,
      total_views: avgViews,
      estimated_likes: avgLikes,
      estimated_comments: avgComments
    };

    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    throw new Error(`YouTube API failed: ${error.message}`);
  }
}

async function getChannelIdFromUrl(url) {
  try {
    const clean = url.split('?')[0].split('#')[0].replace(/\/$/, '');

    // 1) Прямой ID: /channel/UCxxxx
    const channelMatch = clean.match(/\/channel\/(UC[\w-]+)/);
    if (channelMatch) {
      return channelMatch[1];
    }

    // 2) Хэндл: /@username → channels?forHandle
    const handleMatch = clean.match(/\/@([\w.\-]+)/);
    if (handleMatch) {
      const byHandle = await axios.get(YOUTUBE_API_BASE + '/channels', {
        params: { part: 'id', forHandle: '@' + handleMatch[1], key: YOUTUBE_API_KEY }
      });
      if (byHandle.data.items?.length) {
        return byHandle.data.items[0].id;
      }
    }

    // 3) Старый username: /user/name → channels?forUsername
    const userMatch = clean.match(/\/user\/([\w.\-]+)/);
    if (userMatch) {
      const byUser = await axios.get(YOUTUBE_API_BASE + '/channels', {
        params: { part: 'id', forUsername: userMatch[1], key: YOUTUBE_API_KEY }
      });
      if (byUser.data.items?.length) {
        return byUser.data.items[0].id;
      }
    }

    // 4) Фолбэк: поиск по последнему сегменту URL (custom /c/name и пр.)
    const query = handleMatch?.[1] || clean.split('/').filter(Boolean).pop();
    const search = await axios.get(YOUTUBE_API_BASE + '/search', {
      params: { part: 'snippet', type: 'channel', q: query, key: YOUTUBE_API_KEY, maxResults: 1 }
    });
    if (search.data.items?.length) {
      return search.data.items[0].snippet.channelId;
    }

    throw new Error('Channel not found');
  } catch (error) {
    const detail = error.response?.data?.error?.message || error.message;
    throw new Error(`Failed to resolve channel: ${detail}`);
  }
}

async function getChannelStats(channelId) {
  try {
    const response = await axios.get(YOUTUBE_API_BASE + '/channels', {
      params: {
        part: 'statistics,snippet',
        id: channelId,
        key: YOUTUBE_API_KEY
      }
    });

    if (!response.data.items?.length) {
      throw new Error('Channel not found');
    }

    const channel = response.data.items[0];
    return {
      subscriberCount: parseInt(channel.statistics?.subscriberCount || 0),
      viewCount: parseInt(channel.statistics?.viewCount || 0),
      videoCount: parseInt(channel.statistics?.videoCount || 0)
    };
  } catch (error) {
    throw new Error(`Failed to fetch channel stats: ${error.message}`);
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
