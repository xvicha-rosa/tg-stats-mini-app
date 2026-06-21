import { chromium } from 'playwright';

const captureId = process.argv[2];
const screen = process.argv[3] || 'home';
const url = `http://localhost:3000/?screen=${screen}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

const r = await page.context().request.get('https://mcp.figma.com/mcp/html-to-design/capture.js');
const js = await r.text();
await page.evaluate((s) => { const el = document.createElement('script'); el.textContent = s; document.head.appendChild(el); }, js);
await page.waitForTimeout(800);

const result = await page.evaluate(({ id }) => {
  const cap = window.figma.captureForDesign({
    captureId: id,
    endpoint: `https://mcp.figma.com/mcp/capture/${id}/submit`,
    selector: 'body'
  });
  const to = new Promise((_, rej) => setTimeout(() => rej(new Error('watchdog-60s')), 60000));
  return Promise.race([cap, to]).then(r => ({ ok: true, r })).catch(e => ({ ok: false, err: String(e.message || e) }));
}, { id: captureId });

console.log('capture result:', JSON.stringify(result).slice(0, 400));
await browser.close();
