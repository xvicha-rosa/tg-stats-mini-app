import crypto from 'crypto';

export function verifyTelegramData(initData) {
  try {
    if (!initData) return null;

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not set');
      return null;
    }

    const data = new URLSearchParams(initData);
    const hash = data.get('hash');

    if (!hash) return null;

    // Remove hash from data to verify
    data.delete('hash');

    // Sort and create verification string
    const entries = [...data.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const dataToCheck = entries.map(([key, value]) => `${key}=${value}`).join('\n');

    // Create HMAC
    const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secret).update(dataToCheck).digest('hex');

    // Verify hash
    if (calculatedHash !== hash) {
      console.error('Telegram data verification failed');
      return null;
    }

    // Parse user data
    const userStr = data.get('user');
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    return user;
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    return null;
  }
}

export function generatePaymentLink(user_id, amount) {
  // Generate invoice for Telegram Stars
  const payload = `premium_analysis_${user_id}_${Date.now()}`;

  return {
    provider_token: 'YOUR_TELEGRAM_PAYMENT_TOKEN', // Not needed for Stars
    title: 'Полный анализ статистики',
    description: 'Получи детальные рекомендации по улучшению',
    payload,
    currency: 'XTR', // Telegram Stars currency
    prices: [
      {
        label: 'Полный анализ',
        amount: amount // в звёздах
      }
    ]
  };
}
