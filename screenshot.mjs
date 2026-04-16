import puppeteer from '/usr/local/lib/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const existing = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/^screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
const next = nums.length ? Math.max(...nums) + 1 : 1;
const filename = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const outPath = path.join(dir, filename);

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

// Scroll through page to trigger IntersectionObserver, then force-reveal all
await page.evaluate(async () => {
  await new Promise(resolve => {
    const total = document.body.scrollHeight;
    const step = 300;
    let pos = 0;
    const timer = setInterval(() => {
      window.scrollTo(0, pos);
      pos += step;
      if (pos >= total) { clearInterval(timer); resolve(); }
    }, 60);
  });
  // Force all animated elements visible so fullPage screenshot shows them
  document.querySelectorAll('.reveal, .stagger').forEach(el => el.classList.add('visible'));
  window.scrollTo(0, 0);
});
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved: ${outPath}`);
