import PromoCode from '../models/PromoCode.js';
import UserPromo from '../models/UserPromo.js';

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

export async function applyPromoCode(code, userId, basePrice) {
  try {
    const validation = await validatePromoCode(code, userId);

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { discount, discountType } = validation;
    let finalPrice = basePrice;

    if (discountType === 'percent') {
      finalPrice = basePrice * (1 - discount / 100);
    } else if (discountType === 'fixed') {
      finalPrice = Math.max(0, basePrice - discount);
    }

    // Логирование использования
    const userPromo = new UserPromo({
      userId,
      promoCode: code.toUpperCase(),
      discount,
      discountType
    });
    await userPromo.save();

    // Увеличение счётчика использований
    await PromoCode.updateOne(
      { code: code.toUpperCase() },
      { $inc: { currentUses: 1 } }
    );

    return {
      success: true,
      originalPrice: basePrice,
      discount: discountType === 'percent' ? `${discount}%` : `${discount}₽`,
      finalPrice: Math.round(finalPrice * 100) / 100,
      saved: Math.round((basePrice - finalPrice) * 100) / 100
    };
  } catch (error) {
    console.error('Ошибка применения промокода:', error);
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
