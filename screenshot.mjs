import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';
const dir = './temporary screenshots';

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const existing = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0'));
const next = nums.length ? Math.max(...nums) + 1 : 1;
const file = path.join(dir, `screenshot-${next}${label}.png`);

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0' });
// Scroll through page to trigger IntersectionObserver reveals
await page.evaluate(async () => {
  await new Promise(resolve => {
    let pos = 0;
    const step = 600;
    const interval = setInterval(() => {
      window.scrollBy(0, step);
      pos += step;
      if (pos >= document.body.scrollHeight) {
        window.scrollTo(0, 0);
        clearInterval(interval);
        setTimeout(resolve, 400);
      }
    }, 80);
  });
});
await new Promise(r => setTimeout(r, 2500));
await page.screenshot({ path: file, fullPage: true });
await browser.close();
console.log(`Saved: ${file}`);
