import sharp from 'sharp';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';

const dirs = ['src/assets', 'public/images', 'public/lovable-uploads'];
const exts = new Set(['.png', '.jpg', '.jpeg']);

async function walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { await walk(p); continue; }
    const ext = extname(name).toLowerCase();
    if (!exts.has(ext)) continue;
    const base = p.slice(0, -ext.length);
    const tasks = [];
    if (!existsSync(base + '.avif')) tasks.push(['avif', sharp(p).avif({ quality: 55, effort: 4 }).toFile(base + '.avif')]);
    if (!existsSync(base + '.webp')) tasks.push(['webp', sharp(p).webp({ quality: 78 }).toFile(base + '.webp')]);
    if (tasks.length) {
      try {
        await Promise.all(tasks.map(t => t[1]));
        console.log('✓', p, '→', tasks.map(t => t[0]).join(','));
      } catch (e) {
        console.warn('✗', p, e.message);
      }
    }
  }
}

for (const d of dirs) await walk(d);
console.log('Done.');
