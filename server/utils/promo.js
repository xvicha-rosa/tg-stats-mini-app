import PromoCode from '../models/PromoCode.js';
import UserPromo from '../models/UserPromo.js';
import UserCredits from '../models/UserCredits.js';

export async function validatePromoCode(code, userId = null) {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Промокод не указан' };
  }

  try {
    const promo = await PromoCode.findOne({ code: code.toUpperCase() });

    if (!promo) {
      return { valid: false, error: 'Промокод не найден' };
    }

    if (!promo.isActive) {
      return { valid: false, error: 'Промокод деактивирован' };
    }

    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return { valid: false, error: 'Промокод истёк' };
    }

    if (promo.maxUses && promo.currentUses >= promo.maxUses) {
      return { valid: false, error: 'Лимит использований исчерпан' };
    }

    if (userId) {
      const userUsed = await UserPromo.findOne({ userId, promoCode: promo.code });
      if (userUsed) {
        return { valid: false, error: 'Вы уже использовали этот промокод' };
      }
    }

    return {
      valid: true,
      code: promo.code,
      discount: promo.discount,
      discountType: promo.discountType,
      description: promo.description
    };
  } catch (error) {
    console.error('Ошибка проверки промокода:', error);
    return { valid: false, error: 'Ошибка сервера' };
  }
}

// Активация промокода → начисляет кредиты (бесплатные анализы) пользователю
export async function redeemPromoCode(code, userId) {
  try {
    const validation = await validatePromoCode(code, userId);

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const promo = await PromoCode.findOne({ code: code.toUpperCase() });
    const grant = promo.credits != null ? promo.credits : 1;

    // Лог использования (защита от повторной активации тем же юзером)
    await new UserPromo({
      userId,
      promoCode: code.toUpperCase(),
      discount: promo.discount,
      discountType: promo.discountType
    }).save();

    await PromoCode.updateOne({ code: code.toUpperCase() }, { $inc: { currentUses: 1 } });

    // Начисление кредитов
    const updated = await UserCredits.findOneAndUpdate(
      { userId },
      { $inc: { credits: grant } },
      { upsert: true, new: true }
    );

    return {
      success: true,
      code: promo.code,
      credits_granted: grant,
      total_credits: updated.credits
    };
  } catch (error) {
    console.error('Ошибка активации промокода:', error);
    return { success: false, error: 'Ошибка сервера' };
  }
}

export async function getUserCredits(userId) {
  try {
    const rec = await UserCredits.findOne({ userId });
    return rec ? rec.credits : 0;
  } catch (error) {
    console.error('Ошибка получения кредитов:', error);
    return 0;
  }
}

// Списание 1 кредита (атомарно — только если баланс > 0)
export async function spendCredit(userId) {
  try {
    const updated = await UserCredits.findOneAndUpdate(
      { userId, credits: { $gt: 0 } },
      { $inc: { credits: -1 } },
      { new: true }
    );

    if (!updated) {
      return { success: false, error: 'Нет доступных анализов' };
    }

    return { success: true, remaining: updated.credits };
  } catch (error) {
    console.error('Ошибка списания кредита:', error);
    return { success: false, error: 'Ошибка сервера' };
  }
}

export async function createPromoCode(data) {
  try {
    const promo = new PromoCode({
      code: data.code.toUpperCase(),
      discount: data.discount,
      discountType: data.discountType || 'percent',
      maxUses: data.maxUses || null,
      expiresAt: data.expiresAt || null,
      description: data.description || '',
      isActive: true
    });

    await promo.save();
    return { success: true, promo };
  } catch (error) {
    console.error('Ошибка создания промокода:', error);
    return { success: false, error: error.message };
  }
}

export async function getPromoStats(code) {
  try {
    const promo = await PromoCode.findOne({ code: code.toUpperCase() });

    if (!promo) {
      return { error: 'Промокод не найден' };
    }

    const uses = await UserPromo.countDocuments({ promoCode: promo.code });

    return {
      code: promo.code,
      discount: promo.discount,
      discountType: promo.discountType,
      uses: promo.currentUses,
      maxUses: promo.maxUses,
      isActive: promo.isActive,
      expiresAt: promo.expiresAt,
      description: promo.description,
      createdAt: promo.createdAt
    };
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    return { error: 'Ошибка сервера' };
  }
}
