// Generates a 1200x630 Open Graph PNG per post into _site/assets/og/<slug>.png
// Run after `jekyll build`, before uploading the Pages artifact.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import matter from 'gray-matter';

const POSTS_DIR = '_posts';
const OUT_DIR = '_site/assets/og';
const SITE = 'gutem.github.io';

const BG = '#0d1117';
const ACCENT = '#f14e32';
const FG = '#e6edf3';
const MUTED = '#8b949e';

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrap(text, maxChars, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line.trim());
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/.{1}$/, '') + '\u2026';
    return kept;
  }
  return lines;
}

function slugOf(file) {
  return file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.(md|markdown)$/, '');
}

function buildSvg(title) {
  const lines = wrap(title, 26, 4);
  const fontSize = 66;
  const lineHeight = 82;
  const startY = 315 - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map((l, i) => `<tspan x="90" y="${startY + i * lineHeight}">${escapeXml(l)}</tspan>`)
    .join('');
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${BG}"/>
  <rect x="0" y="0" width="14" height="630" fill="${ACCENT}"/>
  <text x="90" y="110" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" font-weight="700" fill="${ACCENT}" letter-spacing="2">${escapeXml(SITE)}</text>
  <text font-family="DejaVu Sans, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="${FG}">${tspans}</text>
  <text x="90" y="565" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" fill="${MUTED}">Thoughts, Black Tea and some Code</text>
</svg>`;
}

function main() {
  if (!existsSync(POSTS_DIR)) {
    console.error(`No ${POSTS_DIR} directory found`);
    process.exit(0);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  const files = readdirSync(POSTS_DIR).filter((f) => /\.(md|markdown)$/.test(f));
  let count = 0;
  for (const file of files) {
    const slug = slugOf(file);
    let title = slug;
    try {
      const { data } = matter(readFileSync(`${POSTS_DIR}/${file}`, 'utf8'));
      if (data && data.title) title = String(data.title);
    } catch (e) {
      console.warn(`front matter parse failed for ${file}: ${e.message}`);
    }
    const svg = buildSvg(title);
    const png = new Resvg(svg, {
      fitTo: { mode: 'original' },
      font: { loadSystemFonts: true, defaultFontFamily: 'DejaVu Sans' },
    })
      .render()
      .asPng();
    writeFileSync(`${OUT_DIR}/${slug}.png`, png);
    count++;
  }
  console.log(`Generated ${count} OG image(s) in ${OUT_DIR}`);
}

main();
