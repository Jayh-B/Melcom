import { chromium } from 'playwright';

(async () => {
  const url = process.argv[2] || 'http://localhost:3000/admin';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push({ type: 'console', text: msg.text(), location: msg.location() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.message, stack: err.stack }));
  page.on('requestfailed', req => logs.push({ type: 'requestfailed', url: req.url(), failure: req.failure()?.errorText }));
  page.on('response', resp => { if (!resp.ok()) logs.push({ type: 'response', status: resp.status(), url: resp.url() }); });

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    // wait a short while for lazy network requests and console messages
    await page.waitForTimeout(4000);
  } catch (e) {
    logs.push({ type: 'navigation-error', text: e.message });
  }

  console.log('--- PLAYWRIGHT CAPTURE START ---');
  for (const l of logs) console.log(JSON.stringify(l));
  console.log('--- PLAYWRIGHT CAPTURE END ---');

  await browser.close();
})();
