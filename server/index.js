import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { analyzeStats, getFreeAnalysis, getPremiumAnalysis } from './utils/analytics.js';
import { verifyTelegramData } from './utils/telegram.js';
import { scrapeTikTokProfile, extractTikTokUsername, validateTikTokUrl } from './scrapers/tiktok.js';
import { scrapeInstagramProfile, extractInstagramUsername, validateInstagramUrl } from './scrapers/instagram.js';
import { scrapeYouTubeChannel, extractYouTubeChannelId, validateYouTubeUrl } from './scrapers/youtube.js';
import { validatePromoCode, redeemPromoCode, getUserCredits, spendCredit, createPromoCode, getPromoStats } from './utils/promo.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection (нужен только для промокодов; анализ работает без БД)
mongoose.set('bufferCommands', false);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/statsflow';
mongoose.connect(MONGODB_URI).catch(err => console.error('MongoDB connection error:', err.message));

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

    if (!followers || followers === undefined || !platform) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const data = {
      followers,
      likes: likes || 0,
      views: views || 0,
      comments: comments || 0,
      reposts: reposts || 0,
      platform
    };

    const analysis = analyzeStats(data);
    const freeAnalysis = getFreeAnalysis(data);

    res.json({
      success: true,
      analysis,
      free: freeAnalysis
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

    const data = {
      followers,
      likes: likes || 0,
      views: views || 0,
      comments: comments || 0,
      reposts: reposts || 0,
      platform
    };

    const analysis = analyzeStats(data);
    const premium = getPremiumAnalysis(data);

    res.json({
      success: true,
      data: { ...analysis, ...premium },
      user_id: user.id,
      username: user.username
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Баланс кредитов (бесплатных анализов) пользователя
app.post('/api/credits', async (req, res) => {
  try {
    const user = verifyTelegramData(req.body.initData);
    if (!user) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }
    const credits = await getUserCredits(String(user.id));
    res.json({ success: true, credits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Премиум-анализ за 1 кредит (списывает кредит, затем отдаёт анализ)
app.post('/api/premium/use-credit', async (req, res) => {
  try {
    const { initData, followers, likes, views, comments, reposts, platform } = req.body;

    const user = verifyTelegramData(initData);
    if (!user) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    const spent = await spendCredit(String(user.id));
    if (!spent.success) {
      return res.status(402).json({ error: spent.error });
    }

    const data = {
      followers,
      likes: likes || 0,
      views: views || 0,
      comments: comments || 0,
      reposts: reposts || 0,
      platform
    };

    const analysis = analyzeStats(data);
    const premium = getPremiumAnalysis(data);

    res.json({
      success: true,
      data: { ...analysis, ...premium },
      credits_remaining: spent.remaining
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


// Promo code endpoints
app.post('/api/promo/validate', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Промокод не указан' });
    }

    const result = await validatePromoCode(code);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Активация промокода → начисляет бесплатные анализы (кредиты)
app.post('/api/promo/redeem', async (req, res) => {
  try {
    const { initData, code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Промокод не указан' });
    }

    const user = verifyTelegramData(initData);
    if (!user) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    const result = await redeemPromoCode(code, String(user.id));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin endpoint - create promo code
app.post('/api/admin/promo/create', async (req, res) => {
  try {
    const { adminToken, code, discount, discountType, maxUses, expiresAt, description } = req.body;

    // Simple admin token validation
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await createPromoCode({
      code,
      discount,
      discountType,
      maxUses,
      expiresAt,
      description
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin endpoint - get promo stats
app.get('/api/admin/promo/stats/:code', async (req, res) => {
  try {
    const { adminToken } = req.query;

    if (adminToken !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await getPromoStats(req.params.code);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
