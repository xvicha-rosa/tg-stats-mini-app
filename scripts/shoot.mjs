import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const OUT = 'public/design-screens';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

// Хелпер: показать конкретную вкладку
async function showTab(name) {
  await page.evaluate((n) => {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(e => e.classList.remove('active'));
    document.getElementById(n).classList.add('active');
    document.querySelector('.content').scrollTop = 0;
  }, name);
  await page.waitForTimeout(250);
}

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log('✓', name);
}

// 1. HOME
await showTab('home');
await shot('1-home');

// 2. АНАЛИЗ — пустой
await showTab('analysis');
await shot('2-analysis-empty');

// 3. АНАЛИЗ — с результатами (фейк)
await page.evaluate(() => {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('res-metric1-val', '21 000 000'); set('res-metric1-label', 'Подписчики');
  set('res-metric2-val', '5%'); set('res-metric2-label', 'Энгейджмент');
  set('res-metric3-val', '6.2%'); set('res-metric3-label', 'Лайки/просмотр');
  set('res-metric4-val', '4.0%'); set('res-metric4-label', 'Комментарии');
  set('advice-1', 'Низкий процент досмотров до конца');
  set('advice-2', 'Недостаточный уровень репостов для масштабирования ролика');
  set('advice-3', 'Контент получает просмотры, но не получает сигналов для масштабирования');
  document.getElementById('results').classList.add('show');
});
await shot('3-analysis-results');

// 4. PREMIUM-результат (фейк)
await page.evaluate(() => {
  document.getElementById('premium-rootcause').textContent = 'Видео проходят первый этап распределения, но не получают сигналов для масштабирования на втором.';
  const box = document.getElementById('premium-insights');
  const items = [['Удержание','Резкий провал удержания на конкретном моменте ролика'],['Алгоритм','Низкая конверсия просмотра в подписку'],['Контент','Слабый первый кадр'],['Масштабирование','Видео теряют импульс после первых тестовых показов']];
  box.innerHTML = items.map(([c,t]) => `<div class="feature"><div class="feature-icon">▸</div><div class="feature-text"><strong>${c}:</strong> ${t}</div></div>`).join('');
  document.getElementById('premium-conclusion').textContent = 'Основная проблема — слабый хук в первые секунды. Переделай первый кадр на 3-5 роликах, добавь открытую петлю в начале. Повтори анализ через неделю.';
  document.getElementById('premium-result').style.display = 'block';
});
await shot('4-premium-result');

// 5. УСЛУГИ
await showTab('services');
await shot('5-services');

// 6. ПРОФИЛЬ (фейк-юзер)
await showTab('profile');
await page.evaluate(() => {
  document.getElementById('pf-name').textContent = 'Максим';
  document.getElementById('pf-username').textContent = '@xvichals';
  document.getElementById('pf-avatar').textContent = 'М';
  document.getElementById('pf-analyses').textContent = '3';
  document.getElementById('pf-promo').textContent = '1';
  document.getElementById('pf-status').textContent = '⭐ 1 Premium-анализ';
});
await shot('6-profile');

// 7. МОДАЛКА оплаты
await page.evaluate(() => {
  document.getElementById('pay-credits').textContent = 'Доступно: 1';
  document.getElementById('paymentModal').classList.add('show');
});
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/7-modal-payment.png` });
console.log('✓ 7-modal-payment');

// 8. МОДАЛКА промокода (успех)
await page.evaluate(() => {
  document.getElementById('paymentModal').classList.remove('show');
  const r = document.getElementById('promoResult');
  r.innerHTML = '✅ Промокод активирован!<br>Начислено: <strong>1 бесплатный анализ</strong><br>Всего доступно: <strong>1</strong>';
  r.classList.add('show');
  document.getElementById('promoModal').classList.add('show');
});
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/8-modal-promo.png` });
console.log('✓ 8-modal-promo');

await browser.close();
console.log('Готово →', OUT);
