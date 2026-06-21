import { selectSemiInsight, selectInsights } from './insights.js';

export function analyzeStats(data) {
  const { followers, likes, views, comments, reposts, platform } = data;

  const metrics = calculateMetrics(followers, likes, views, comments, reposts);
  const quality_score = calculateQualityScore(metrics);

  return {
    followers,
    likes,
    views,
    comments,
    reposts,
    engagement_rate: Math.round(metrics.engagement_rate * 100) / 100,
    like_to_view_ratio: Math.round(metrics.like_to_view_ratio * 10000) / 10000,
    comment_rate: Math.round(metrics.comment_rate * 100) / 100,
    repost_rate: Math.round(metrics.repost_rate * 100) / 100,
    quality_score: Math.round(quality_score),
    platform
  };
}

export function getFreeAnalysis(data) {
  const { views } = data;
  const stats = analyzeStats(data);

  // 2 релевантных инсайта из разных категорий + 1 полу-инсайт для завлечения
  const insights = selectInsights(stats);
  const titles = Object.values(insights).map(i => i.title);
  const semi = selectSemiInsight(stats);

  return {
    facts: {
      avg_views_per_post: Math.round((views || 0) / 1),
      subscriber_growth: 'данные не доступны',
      engagement_rate: stats.engagement_rate
    },
    advice: [titles[0], titles[1], semi.title]
  };
}

export function getPremiumAnalysis(data) {
  const { followers, likes, views, comments, reposts, platform } = data;
  const metrics = calculateMetrics(followers, likes, views, comments, reposts);
  const stats = analyzeStats(data);

  const conclusion = generateConclusion(metrics, platform);

  // Релевантные инсайты по всем категориям (8 категорий, 150+ вариантов)
  const selected = selectInsights(stats);
  const premium_insights = {};
  for (const [category, insight] of Object.entries(selected)) {
    premium_insights[category] = insight.title;
  }

  return {
    root_cause: identifyRootCause(metrics),
    premium_insights,
    recommendations: generateRecommendations(metrics, platform),
    conclusion: conclusion
  };
}

function calculateMetrics(followers, likes, views, comments, reposts) {
  return {
    followers: followers || 0,
    likes: likes || 0,
    views: views || 0,
    comments: comments || 0,
    reposts: reposts || 0,
    engagement_rate: followers > 0 ? ((likes + comments + reposts) / followers) : 0,
    like_to_view_ratio: views > 0 ? likes / views : 0,
    comment_rate: likes > 0 ? comments / likes : 0,
    repost_rate: likes > 0 ? reposts / likes : 0,
    videoCount: 1
  };
}

function calculateQualityScore(metrics) {
  let score = 50;

  if (metrics.engagement_rate > 0.05) score += 20;
  else if (metrics.engagement_rate > 0.02) score += 10;

  if (metrics.like_to_view_ratio > 0.05) score += 15;
  else if (metrics.like_to_view_ratio > 0.02) score += 8;

  if (metrics.comment_rate > 0.05) score += 10;
  if (metrics.repost_rate > 0.02) score += 10;

  return Math.min(100, Math.max(0, score));
}

function identifyRootCause(metrics) {
  if (metrics.engagement_rate < 0.01) {
    return 'Основная проблема: минимальная активность аудитории. Либо контент не цепляет, либо его никто не видит';
  }
  if (metrics.like_to_view_ratio < 0.01) {
    return 'Зрители остаются, но не взаимодействуют — не хватает хука в начале ролика';
  }
  return 'Средняя активность, но роста нет — возможно, недостаточно контента или слабая позиция на полке платформы';
}

function generateConclusion(metrics, platform) {
  let text = [];

  if (metrics.followers < 100) {
    text.push('Новый аккаунт. Приоритет: алгоритм должен распознать тематику и начать расширять охват.');
    text.push('Шаг 1: Убедись, что хук работает (первые 0.5с удерживают 80%+ аудитории).');
    text.push('Шаг 2: Выбери 1 нишу и придерживайся её (алгоритму нужна консистентность).');
    text.push('Шаг 3: Постой каждый день или через день 7-10 дней и смотри метрики.');
  } else if (metrics.like_to_view_ratio < 0.01) {
    text.push('Основная проблема: контент не цепляет на начальном этапе (люди свайпают в первые секунды).');
    text.push('Немедленно переделай первый кадр и крючок — это критично.');
    text.push('Тестируй разные варианты крючков на 3-5 видео и смотри, какой работает.');
    text.push('После улучшения крючка повтори анализ через неделю.');
  } else if (metrics.engagement_rate > 0.05 && metrics.followers < 1000) {
    text.push('Хорошие метрики, но аккаунт маленький. Алгоритм готов расширять.');
    text.push('Увеличь частоту постов (минимум 1 в день) чтобы алгоритм видел активность.');
    text.push('Добавь CTA в конце каждого видео: "Подпишись", "Коммент", "Сохрани".');
    text.push('Повтори анализ через 2 недели — должен быть заметный рост.');
  } else {
    text.push('Аккаунт на плато. Алгоритм показывает видео, но не расширяет охват.');
    text.push('Возможные причины: смешение тематик, ошибка в позиционировании или слабая аудитория.');
    text.push('Пересмотри последние 5 видео с лучшей вовлеченностью — найди общий паттерн.');
    text.push('Сделай серию из 5-7 видео только по паттерну лучших роликов.');
  }

  return text.join('\n');
}

function generateRecommendations(metrics, platform) {
  return [
    'Протестируй другой формат крючка в первые 0.5 секунды',
    'Добавь подписку в конце каждого ролика',
    'Публикуй минимум 3-5 раз в неделю для консистентности'
  ];
}
