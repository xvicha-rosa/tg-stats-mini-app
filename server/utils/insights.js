// Semi-insights (выбирается 1 самый релевантный для бесплатного анализа)
const semiInsights = [
  {
    id: 'low_retention_start',
    title: 'Слабое удержание аудитории в первые секунды',
    trigger: (metrics) => metrics.engagement_rate < 1.5 && metrics.like_to_view_ratio < 0.01,
    relevance: 0
  },
  {
    id: 'high_swipe_rate',
    title: 'Высокий процент свайпов в первые 2 секунды',
    trigger: (metrics) => metrics.like_to_view_ratio < 0.005 && metrics.views > 1000,
    relevance: 0
  },
  {
    id: 'algo_test_fail',
    title: 'Видео не проходит первичное тестирование алгоритма',
    trigger: (metrics) => metrics.engagement_rate < 2 && metrics.comment_rate < 0.005,
    relevance: 0
  },
  {
    id: 'algo_no_audience',
    title: 'Алгоритм не может определить целевую аудиторию аккаунта',
    trigger: (metrics) => metrics.repost_rate < 0.01 && metrics.comment_rate < 0.01,
    relevance: 0
  },
  {
    id: 'no_scale_signals',
    title: 'Контент получает просмотры, но не получает сигналов для масштабирования',
    trigger: (metrics) => metrics.views > 1000 && metrics.reposts < 10 && metrics.engagement_rate < 2,
    relevance: 0
  }
];

// Insights по категориям
const insightsByCategory = {
  retention: [
    {
      id: 'algo_misclass',
      title: 'Алгоритм ошибочно классифицирует аудиторию аккаунта',
      trigger: (metrics) => metrics.repost_rate < 0.01 && metrics.comment_rate > 0.05,
      relevance: 0
    },
    {
      id: 'hidden_pattern',
      title: 'Лучшие ролики аккаунта имеют скрытый общий паттерн удержания',
      trigger: (metrics) => metrics.engagement_rate > 3 && metrics.like_to_view_ratio > 0.05,
      relevance: 0
    },
    {
      id: 'viral_structure',
      title: 'Вирусные ролики аккаунта отличаются от обычных по структуре первых секунд',
      trigger: (metrics) => metrics.engagement_rate > 5,
      relevance: 0
    },
    {
      id: 'audience_mismatch',
      title: 'Аккаунт теряет охват из-за несоответствия между аудиторией и контентом',
      trigger: (metrics) => metrics.like_to_view_ratio > 0.05 && metrics.comment_rate < 0.02,
      relevance: 0
    },
    {
      id: 'likes_no_signals',
      title: 'Видео получают лайки, но не получают сигналы распространения',
      trigger: (metrics) => metrics.like_to_view_ratio > 0.03 && metrics.repost_rate < 0.005,
      relevance: 0
    },
    {
      id: 'subscribers_slow',
      title: 'Подписчики снижают эффективность новых публикаций',
      trigger: (metrics) => metrics.followers > 100000 && metrics.engagement_rate < 1.5,
      relevance: 0
    },
    {
      id: 'conflicting_signals',
      title: 'Алгоритм получает конфликтующие сигналы о тематике аккаунта',
      trigger: (metrics) => Math.abs(metrics.comment_rate - metrics.repost_rate) > 0.1,
      relevance: 0
    },
    {
      id: 'content_algo_mismatch',
      title: 'Контент соответствует интересам зрителей, но не соответствует требованиям алгоритма масштабирования',
      trigger: (metrics) => metrics.like_to_view_ratio > 0.05 && metrics.engagement_rate < 2,
      relevance: 0
    },
    {
      id: 'structure_issue',
      title: 'Основная причина отсутствия роста находится не в контенте, а в структуре аудитории аккаунта',
      trigger: (metrics) => metrics.followers > 50000 && metrics.engagement_rate < 1,
      relevance: 0
    },
    {
      id: 'stuck_pool',
      title: 'Аккаунт застрял в ограниченном пуле рекомендаций и не выходит на новые сегменты аудитории',
      trigger: (metrics) => metrics.views < 1000 && metrics.followers > 10000,
      relevance: 0
    },
    {
      id: 'drop_1sec',
      title: 'Высокий отток зрителей на 1 секунде',
      trigger: (metrics) => metrics.like_to_view_ratio < 0.005,
      relevance: 0
    },
    {
      id: 'drop_2sec',
      title: 'Высокий отток зрителей на 2 секунде',
      trigger: (metrics) => metrics.like_to_view_ratio < 0.01 && metrics.comment_rate < 0.01,
      relevance: 0
    },
    {
      id: 'retention_cliff',
      title: 'Резкий провал удержания на конкретном моменте ролика',
      trigger: (metrics) => metrics.like_to_view_ratio > 0.02 && metrics.comment_rate < 0.01,
      relevance: 0
    },
    {
      id: 'low_completion',
      title: 'Низкий процент досмотров до конца',
      trigger: (metrics) => metrics.like_to_view_ratio < 0.02,
      relevance: 0
    },
    {
      id: 'low_avg_watch',
      title: 'Низкое среднее время просмотра',
      trigger: (metrics) => metrics.comment_rate < 0.01 && metrics.repost_rate < 0.01,
      relevance: 0
    },
    {
      id: 'low_rewatch',
      title: 'Низкий процент повторных просмотров',
      trigger: (metrics) => metrics.comment_rate < 0.02,
      relevance: 0
    },
    {
      id: 'watch_not_rewatch',
      title: 'Зрители досматривают ролик, но не пересматривают его',
      trigger: (metrics) => metrics.like_to_view_ratio > 0.02 && metrics.comment_rate < 0.01,
      relevance: 0
    },
    {
      id: 'weak_first_sec',
      title: 'Первые секунды не удерживают новую аудиторию',
      trigger: (metrics) => metrics.like_to_view_ratio < 0.01,
      relevance: 0
    },
    {
      id: 'subscriber_better',
      title: 'Удержание подписчиков выше удержания новой аудитории',
      trigger: (metrics) => metrics.followers > 1000 && metrics.engagement_rate > 2,
      relevance: 0
    },
    {
      id: 'new_audience_weak',
      title: 'Удержание новой аудитории ниже среднего по аккаунту',
      trigger: (metrics) => metrics.engagement_rate < 2,
      relevance: 0
    }
  ],

  algorithmicSignals: [
    {
      id: 'low_saves',
      title: 'Недостаточный уровень сохранений для масштабирования ролика',
      trigger: (metrics) => metrics.like_to_view_ratio < 0.02 && metrics.engagement_rate < 2,
      relevance: 0
    },
    {
      id: 'low_reposts',
      title: 'Недостаточный уровень репостов для масштабирования ролика',
      trigger: (metrics) => metrics.repost_rate < 0.01,
      relevance: 0
    },
    {
      id: 'low_sub_conversion',
      title: 'Низкая конверсия просмотра в подписку',
      trigger: (metrics) => metrics.followers < 1000 && metrics.views > 500,
      relevance: 0
    },
    {
      id: 'low_profile_conversion',
      title: 'Низкая конверсия просмотра в переход в профиль',
      trigger: (metrics) => metrics.views > 1000 && metrics.engagement_rate < 1,
      relevance: 0
    },
    {
      id: 'low_profile_depth',
      title: 'Низкая глубина просмотра профиля',
      trigger: (metrics) => metrics.followers < 10000 && metrics.views > 1000,
      relevance: 0
    },
    {
      id: 'no_next_video',
      title: 'Пользователи не переходят к следующим роликам аккаунта',
      trigger: (metrics) => metrics.comment_rate < 0.01 && metrics.repost_rate < 0.01,
      relevance: 0
    },
    {
      id: 'conflicting_engagement',
      title: 'Алгоритм получает противоречивые сигналы вовлеченности',
      trigger: (metrics) => Math.abs(metrics.like_to_view_ratio - metrics.comment_rate) > 0.04,
      relevance: 0
    }
  ],

  positioning: [
    {
      id: 'mixed_topics',
      title: 'Смешение нескольких тематик на одном аккаунте',
      trigger: (metrics) => metrics.engagement_rate < 2 && metrics.followers > 10000,
      relevance: 0
    },
    {
      id: 'niche_switch',
      title: 'Частая смена контентных ниш',
      trigger: (metrics) => metrics.like_to_view_ratio < 0.01 && metrics.followers > 5000,
      relevance: 0
    },
    {
      id: 'no_main_topic',
      title: 'Отсутствие доминирующей тематики',
      trigger: (metrics) => metrics.engagement_rate < 1.5,
      relevance: 0
    },
    {
      id: 'different_audiences',
      title: 'Разные ролики привлекают разные аудитории',
      trigger: (metrics) => Math.abs(metrics.like_to_view_ratio - metrics.comment_rate) > 0.05,
      relevance: 0
    },
    {
      id: 'multiple_audience_target',
      title: 'Контент рассчитан одновременно на несколько аудиторий',
      trigger: (metrics) => metrics.comment_rate > 0.05 && metrics.repost_rate < 0.01,
      relevance: 0
    },
    {
      id: 'no_content_core',
      title: 'Отсутствует контентное ядро аккаунта',
      trigger: (metrics) => metrics.engagement_rate < 1 && metrics.followers > 1000,
      relevance: 0
    },
    {
      id: 'unclear_audience',
      title: 'Алгоритм не может сформировать устойчивый портрет зрителя',
      trigger: (metrics) => metrics.repost_rate < 0.005 && metrics.comment_rate > 0.03,
      relevance: 0
    }
  ],

  content: [
    {
      id: 'weak_first_frame',
      title: 'Слабый первый кадр',
      trigger: (metrics) => metrics.like_to_view_ratio < 0.005,
      relevance: 0
    },
    {
      id: 'slow_start',
      title: 'Медленный старт ролика',
      trigger: (metrics) => metrics.like_to_view_ratio < 0.01,
      relevance: 0
    },
    {
      id: 'no_visual_hook',
      title: 'Отсутствие визуального хука',
      trigger: (metrics) => metrics.views > 500 && metrics.like_to_view_ratio < 0.005,
      relevance: 0
    },
    {
      id: 'no_intrigue',
      title: 'Отсутствие интриги',
      trigger: (metrics) => metrics.comment_rate < 0.01,
      relevance: 0
    },
    {
      id: 'no_loop',
      title: 'Отсутствие открытой сюжетной петли',
      trigger: (metrics) => metrics.repost_rate < 0.01,
      relevance: 0
    },
    {
      id: 'early_reveal',
      title: 'Раннее раскрытие основной идеи',
      trigger: (metrics) => metrics.like_to_view_ratio > 0.02 && metrics.comment_rate < 0.02,
      relevance: 0
    },
    {
      id: 'predictable_end',
      title: 'Предсказуемая концовка',
      trigger: (metrics) => metrics.like_to_view_ratio < 0.02 && metrics.comment_rate < 0.01,
      relevance: 0
    },
    {
      id: 'low_event_density',
      title: 'Слишком низкая плотность событий',
      trigger: (metrics) => metrics.comment_rate < 0.01,
      relevance: 0
    },
    {
      id: 'few_visual_changes',
      title: 'Недостаточное количество визуальных изменений',
      trigger: (metrics) => metrics.like_to_view_ratio < 0.02,
      relevance: 0
    },
    {
      id: 'no_emotion',
      title: 'Отсутствие эмоционального триггера',
      trigger: (metrics) => metrics.engagement_rate < 2,
      relevance: 0
    },
    {
      id: 'weak_conflict',
      title: 'Слабый конфликт внутри сюжета',
      trigger: (metrics) => metrics.comment_rate < 0.02,
      relevance: 0
    },
    {
      id: 'no_surprise',
      title: 'Слабый эффект неожиданности',
      trigger: (metrics) => metrics.repost_rate < 0.02,
      relevance: 0
    }
  ],

  audience: [
    {
      id: 'subs_not_interested',
      title: 'Подписчики аккаунта не заинтересованы в текущем контенте',
      trigger: (metrics) => metrics.followers > 1000 && metrics.engagement_rate < 1,
      relevance: 0
    },
    {
      id: 'old_niche_audience',
      title: 'Аккаунт собрал аудиторию из предыдущей ниши',
      trigger: (metrics) => metrics.followers > 5000 && metrics.comment_rate < 0.01,
      relevance: 0
    },
    {
      id: 'new_worse_reaction',
      title: 'Новая аудитория реагирует хуже существующей',
      trigger: (metrics) => metrics.followers > 1000 && metrics.like_to_view_ratio < 0.01,
      relevance: 0
    },
    {
      id: 'old_slow_new',
      title: 'Существующая аудитория тормозит распространение новых роликов',
      trigger: (metrics) => metrics.followers > 10000 && metrics.engagement_rate < 1.5,
      relevance: 0
    },
    {
      id: 'wrong_segment',
      title: 'Видео показываются неподходящему сегменту пользователей',
      trigger: (metrics) => metrics.like_to_view_ratio > 0.02 && metrics.repost_rate < 0.005,
      relevance: 0
    },
    {
      id: 'content_conflict',
      title: 'Тематика роликов конфликтует с интересами текущих подписчиков',
      trigger: (metrics) => metrics.engagement_rate < 2 && metrics.followers > 1000,
      relevance: 0
    }
  ],

  scaling: [
    {
      id: 'stage1_pass_stage2_fail',
      title: 'Видео проходят первый этап распределения, но не проходят второй',
      trigger: (metrics) => metrics.views > 1000 && metrics.likes < metrics.views * 0.02,
      relevance: 0
    },
    {
      id: 'stage2_pass_stage3_fail',
      title: 'Видео проходят второй этап распределения, но не проходят третий',
      trigger: (metrics) => metrics.likes > 100 && metrics.reposts < 5,
      relevance: 0
    },
    {
      id: 'algo_stops_early',
      title: 'Алгоритм прекращает расширение охвата раньше среднего',
      trigger: (metrics) => metrics.views < 5000 && metrics.followers > 10000,
      relevance: 0
    },
    {
      id: 'lost_momentum',
      title: 'Видео теряют импульс после первых тестовых показов',
      trigger: (metrics) => metrics.like_to_view_ratio < 0.01,
      relevance: 0
    },
    {
      id: 'no_critical_mass',
      title: 'Контент не набирает критическую массу сигналов для масштабирования',
      trigger: (metrics) => metrics.engagement_rate < 2,
      relevance: 0
    }
  ],

  seriality: [
    {
      id: 'no_series',
      title: 'Отсутствует контентная серия',
      trigger: (metrics) => metrics.comment_rate < 0.01,
      relevance: 0
    },
    {
      id: 'no_connections',
      title: 'Нет связей между роликами',
      trigger: (metrics) => metrics.repost_rate < 0.01,
      relevance: 0
    },
    {
      id: 'no_return',
      title: 'Пользователи не возвращаются за продолжением',
      trigger: (metrics) => metrics.comment_rate < 0.02 && metrics.followers < 5000,
      relevance: 0
    },
    {
      id: 'standalone',
      title: 'Каждый ролик существует отдельно от остальных',
      trigger: (metrics) => metrics.like_to_view_ratio < 0.02,
      relevance: 0
    },
    {
      id: 'low_multi_watch',
      title: 'Низкая вероятность просмотра нескольких роликов подряд',
      trigger: (metrics) => metrics.repost_rate < 0.01 && metrics.comment_rate < 0.01,
      relevance: 0
    }
  ],

  distribution: [
    {
      id: 'high_repeat',
      title: 'Высокая доля повторяющегося контента',
      trigger: (metrics) => metrics.engagement_rate > 5,
      relevance: 0
    },
    {
      id: 'too_similar',
      title: 'Избыточно похожие публикации',
      trigger: (metrics) => metrics.engagement_rate < 1.5,
      relevance: 0
    },
    {
      id: 'duplication_signs',
      title: 'Признаки контентного дублирования',
      trigger: (metrics) => metrics.like_to_view_ratio < 0.01,
      relevance: 0
    },
    {
      id: 'risky_materials',
      title: 'Использование материалов с высоким риском ограничения охвата',
      trigger: (metrics) => metrics.repost_rate < 0.01,
      relevance: 0
    },
    {
      id: 'spam_patterns',
      title: 'Признаки спам-паттернов публикации',
      trigger: (metrics) => metrics.comment_rate < 0.005,
      relevance: 0
    },
    {
      id: 'limiting_elements',
      title: 'Контент содержит элементы, снижающие вероятность рекомендаций',
      trigger: (metrics) => metrics.engagement_rate < 2,
      relevance: 0
    }
  ]
};

export function selectSemiInsight(metrics) {
  // Расчет релевантности для каждого полу-инсайта
  const scored = semiInsights.map(insight => ({
    ...insight,
    relevance: insight.trigger(metrics) ? 1 : 0
  })).filter(i => i.relevance > 0);

  if (scored.length === 0) {
    return semiInsights[0]; // Fallback
  }

  return scored[Math.floor(Math.random() * scored.length)];
}

export function selectInsights(metrics) {
  const result = {};

  for (const [category, insights] of Object.entries(insightsByCategory)) {
    const scored = insights.map(insight => ({
      ...insight,
      relevance: insight.trigger(metrics) ? 1 : 0
    })).filter(i => i.relevance > 0);

    if (scored.length > 0) {
      result[category] = scored[Math.floor(Math.random() * scored.length)];
    }
  }

  return result;
}

export function getInsightCategories() {
  return Object.keys(insightsByCategory);
}
