export function analyzeStats(data) {
  const { followers, likes, views, comments, reposts, platform } = data;

  const engagement_rate = followers > 0 ? ((likes + comments + reposts) / followers) * 100 : 0;
  const like_to_view_ratio = views > 0 ? likes / views : 0;
  const comment_rate = likes > 0 ? comments / likes : 0;
  const repost_rate = likes > 0 ? reposts / likes : 0;

  const quality_score = calculateQualityScore({
    engagement_rate,
    like_to_view_ratio,
    comment_rate,
    repost_rate
  });

  return {
    followers,
    likes,
    views,
    comments,
    reposts,
    engagement_rate: Math.round(engagement_rate * 100) / 100,
    like_to_view_ratio: Math.round(like_to_view_ratio * 10000) / 10000,
    comment_rate: Math.round(comment_rate * 100) / 100,
    repost_rate: Math.round(repost_rate * 100) / 100,
    quality_score: Math.round(quality_score),
    platform
  };
}

export function calculateGrowth(followers, likes, views) {
  // Simple growth formula based on engagement
  const base_growth_rate = 0.15; // 15% per week base
  const engagement_multiplier = (likes / followers) || 0;
  const adjusted_growth = base_growth_rate * (1 + engagement_multiplier);

  const next_week_followers = Math.round(followers * (1 + adjusted_growth));
  const growth_count = next_week_followers - followers;
  const growth_percentage = Math.round((adjusted_growth * 100) * 10) / 10;

  return {
    current_followers: followers,
    next_week_followers,
    growth_count,
    growth_percentage,
    recommendation: getGrowthRecommendation(engagement_multiplier, growth_percentage)
  };
}

function calculateQualityScore(metrics) {
  let score = 50; // Base score

  if (metrics.engagement_rate > 5) score += 20;
  else if (metrics.engagement_rate > 2) score += 10;

  if (metrics.like_to_view_ratio > 0.05) score += 15;
  else if (metrics.like_to_view_ratio > 0.02) score += 8;

  if (metrics.comment_rate > 0.05) score += 10;
  if (metrics.repost_rate > 0.02) score += 10;

  return Math.min(100, Math.max(0, score));
}

function getGrowthRecommendation(engagement, growth_pct) {
  if (growth_pct > 25) {
    return '✨ Отличный тренд! Продолжай в том же стиле';
  } else if (growth_pct > 15) {
    return '📈 Хороший рост, есть куда расти';
  } else if (growth_pct > 5) {
    return '⚠️ Рост есть, но нужны улучшения';
  } else {
    return '❌ Низкий рост. Нужны серьёзные изменения в контенте';
  }
}
