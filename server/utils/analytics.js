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
  const { followers, likes, views, comments, reposts, platform } = data;
  const metrics = calculateMetrics(followers, likes, views, comments, reposts);

  const banals = generateBanalAdvice(metrics, platform);
  const semi = generateSemiInsight(metrics, platform);

  return {
    facts: {
      avg_views_per_post: Math.round(views / Math.max(metrics.videoCount || 1, 1)),
      subscriber_growth: 'данные не доступны',
      engagement_rate: Math.round(metrics.engagement_rate * 100) / 100
    },
    advice: [banals[0], banals[1], semi]
  };
}

export function getPremiumAnalysis(data) {
  const { followers, likes, views, comments, reposts, platform } = data;
  const metrics = calculateMetrics(followers, likes, views, comments, reposts);

  const conclusion = generateConclusion(metrics, platform);

  return {
    root_cause: identifyRootCause(metrics),
    insights: {
      retention: analyzeRetention(metrics),
      algorithm_signals: analyzeAlgorithmSignals(metrics),
      positioning: analyzePositioning(metrics),
      scaling: analyzeScaling(metrics)
    },
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

function generateBanalAdvice(metrics, platform) {
  const advice = [];

  if (metrics.engagement_rate < 0.01) {
    advice.push('Увеличивай частоту публикаций — сейчас контент выходит редко, алгоритм теряет интерес');
  }

  if (metrics.like_to_view_ratio < 0.01) {
    advice.push('Вовлекай аудиторию прямо в ролике — добавь призывы действия или вопросы в конце видео');
  }

  if (advice.length < 2) {
    advice.push('Тестируй разные форматы контента — один стиль часто быстро насыщает аудиторию');
  }

  return advice.slice(0, 2);
}

function generateSemiInsight(metrics, platform) {
  const views = metrics.views || 1;
  const likes = metrics.likes || 0;
  const likeRatio = likes / views;

  if (likeRatio < 0.005) {
    return `Похоже, значительная часть зрителей покидает ролики в первые секунды — это один из главных факторов слабого роста`;
  }

  if (metrics.repost_rate < 0.005 && metrics.comment_rate < 0.01) {
    return `Аудитория смотрит, но почти не репостит и не комментирует — контент не задевает эмоционально`;
  }

  return `Темп роста замедляется — алгоритм считает контент менее интересным для ширины`;
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

function analyzeRetention(metrics) {
  return {
    indicator: 'Исход на первых секундах',
    analysis: metrics.like_to_view_ratio < 0.01 ? 'Вероятно теряешь 40-60% зрителей до конца ролика' : 'Удержание в норме',
    based_on: `Соотношение лайков к просмотрам: ${(metrics.like_to_view_ratio * 100).toFixed(2)}%`
  };
}

function analyzeAlgorithmSignals(metrics) {
  const signals = [];

  if (metrics.repost_rate > 0.02) {
    signals.push({ signal: 'Репосты высокие', status: '✅' });
  } else {
    signals.push({ signal: 'Репосты низкие', status: '⚠️' });
  }

  if (metrics.comment_rate > 0.02) {
    signals.push({ signal: 'Комментарии активны', status: '✅' });
  } else {
    signals.push({ signal: 'Комментарии редки', status: '⚠️' });
  }

  return { signals, analysis: 'Платформа не раздает ролик дальше' };
}

function analyzePositioning(metrics) {
  return {
    analysis: 'Не хватает контентного ядра — зрители не знают, чего от тебя ожидать',
    recommendation: 'Определи 1 основную тему и придерживайся её'
  };
}

function analyzeScaling(metrics) {
  if (metrics.views > 10000) {
    return { stage: 'На хорошем уровне просмотров', issue: 'Алгоритм перестает раздавать дальше на миллионы' };
  }
  return { stage: 'Низкий уровень просмотров', issue: 'Контент не проходит фильтр алгоритма на начальных стадиях' };
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
