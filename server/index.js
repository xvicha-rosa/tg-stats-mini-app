import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeStats, calculateGrowth } from './utils/analytics.js';
import { verifyTelegramData } from './utils/telegram.js';
import { scrapeTikTokProfile, extractTikTokUsername, validateTikTokUrl } from './scrapers/tiktok.js';
import { scrapeInstagramProfile, extractInstagramUsername, validateInstagramUrl } from './scrapers/instagram.js';
import { scrapeYouTubeChannel, extractYouTubeChannelId, validateYouTubeUrl } from './scrapers/youtube.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const PORT = process.env.PORT || 3000;

// Scrape profile endpoint
app.post('/api/scrape', async (req, res) => {
  try {
    const { profile_url } = req.body;

    if (!profile_url) {
      return res.status(400).json({ error: 'profile_url required' });
    }

    let scrapedData;

    if (validateTikTokUrl(profile_url)) {
      const username = extractTikTokUsername(profile_url);
      if (!username) {
        return res.status(400).json({ error: 'Invalid TikTok URL' });
      }
      scrapedData = await scrapeTikTokProfile(username);
    } else if (validateInstagramUrl(profile_url)) {
      const username = extractInstagramUsername(profile_url);
      if (!username) {
        return res.status(400).json({ error: 'Invalid Instagram URL' });
      }
      scrapedData = await scrapeInstagramProfile(username);
    } else if (validateYouTubeUrl(profile_url)) {
      scrapedData = await scrapeYouTubeChannel(profile_url);
    } else {
      return res.status(400).json({ error: 'Unsupported platform or invalid URL' });
    }

    res.json({
      success: true,
      data: scrapedData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Free analysis endpoint
app.post('/api/analyze', (req, res) => {
  try {
    const { followers, likes, views, comments, reposts, platform } = req.body;

    if (!followers || !likes || !platform) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const analysis = analyzeStats({
      followers,
      likes,
      views: views || 0,
      comments: comments || 0,
      reposts: reposts || 0,
      platform
    });

    const growth = calculateGrowth(followers, likes, views);

    res.json({
      success: true,
      analysis,
      preview: {
        engagement_rate: analysis.engagement_rate,
        potential_growth: growth.next_week_followers,
        recommendation: growth.recommendation
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Premium analysis endpoint (protected with Telegram data)
app.post('/api/premium-analyze', (req, res) => {
  try {
    const { initData, followers, likes, views, comments, reposts, platform } = req.body;

    // Verify Telegram data
    const user = verifyTelegramData(initData);
    if (!user) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    const analysis = analyzeStats({
      followers,
      likes,
      views: views || 0,
      comments: comments || 0,
      reposts: reposts || 0,
      platform
    });

    const detailed = {
      ...analysis,
      detailed_recommendations: getDetailedRecommendations(analysis, platform),
      competitor_analysis: getCompetitorAnalysis(followers, likes, views),
      content_strategy: getContentStrategy(platform, analysis)
    };

    res.json({
      success: true,
      data: detailed,
      user_id: user.id,
      username: user.username
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payment webhook for Telegram Stars
app.post('/api/payment-webhook', (req, res) => {
  try {
    const { telegram_payment_charge_id, user_id } = req.body;

    // Handle payment confirmation
    console.log(`Payment confirmed for user ${user_id}`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getDetailedRecommendations(analysis, platform) {
  const recs = [];

  if (analysis.engagement_rate < 3) {
    recs.push('Увеличь частоту постов или улучши качество контента');
  }
  if (analysis.like_to_view_ratio < 0.02) {
    recs.push('Лайки низкие относительно просмотров. Делай более интересный контент в начале');
  }
  if (analysis.comment_rate < 0.01) {
    recs.push('Добавь вопросы в описание, вовлекай аудиторию в комментарии');
  }

  return recs;
}

function getCompetitorAnalysis(followers, likes, views) {
  return {
    your_avg_engagement: Math.round((likes / followers) * 100 * 100) / 100,
    market_avg_engagement: 2.5,
    position: Math.round((likes / followers) * 100) > 2.5 ? 'выше среднего' : 'ниже среднего'
  };
}

function getContentStrategy(platform, analysis) {
  const strategies = {
    tiktok: 'Фокусируйся на трендах, используй актуальную музыку, постай регулярно',
    instagram: 'Баланс между Reels и Posts. Используй Hashtags стратегически',
    youtube: 'Консистентность - ключ. 1-2 видео в неделю, 8+ минут для монетизации'
  };

  return strategies[platform] || 'Постай регулярно и взаимодействуй с аудиторией';
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
