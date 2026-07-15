import sharp from 'sharp';
import { readdirSync, statSync, existsSync, unlinkSync, readFileSync, writeFileSync } from 'fs';
import { join, extname, relative } from 'path';

const SRC_DIRS = ['src/assets', 'public/images', 'public/lovable-uploads', 'public'];
const CODE_DIRS = ['src', 'public', 'index.html'];
const MIN_SIZE = 100 * 1024;
const exts = new Set(['.png', '.jpg', '.jpeg']);

const converted = []; // {oldPath, newPath}

async function walk(dir) {
  if (!existsSync(dir)) return;
  const st = statSync(dir);
  if (!st.isDirectory()) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let s;
    try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) { await walk(p); continue; }
    const ext = extname(name).toLowerCase();
    if (!exts.has(ext)) continue;
    if (s.size < MIN_SIZE) continue;
    const base = p.slice(0, -ext.length);
    const webp = base + '.webp';
    try {
      await sharp(p).webp({ quality: 82 }).toFile(webp + '.tmp');
      // replace
      const { renameSync } = await import('fs');
      renameSync(webp + '.tmp', webp);
      const newSize = statSync(webp).size;
      if (newSize < s.size) {
        unlinkSync(p);
        converted.push({ old: p, new: webp, saved: s.size - newSize });
        console.log('✓', p, '→', webp, `(${Math.round((1-newSize/s.size)*100)}% smaller)`);
      } else {
        unlinkSync(webp);
        console.log('=', p, 'skipped (webp bigger)');
      }
    } catch (e) {
      console.warn('✗', p, e.message);
    }
  }
}

for (const d of SRC_DIRS) await walk(d);

console.log(`\nConverted ${converted.length} files, saved ${Math.round(converted.reduce((a,c)=>a+c.saved,0)/1024/1024*10)/10} MB\n`);

// Now rewrite references
import { execSync } from 'child_process';
const codeFiles = execSync(`find src public index.html -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.html" -o -name "*.json" -o -name "*.xml" -o -name "*.md" \\) 2>/dev/null`).toString().trim().split('\n').filter(Boolean);

let touchedFiles = 0;
for (const f of codeFiles) {
  let src;
  try { src = readFileSync(f, 'utf8'); } catch { continue; }
  let out = src;
  for (const c of converted) {
    // Match basename with extension in the file
    const oldBase = c.old.replace(/^public\//, '/'); // public paths served from root
    const newBase = c.new.replace(/^public\//, '/');
    // Replace full absolute-style path and just the filename+ext
    const oldExt = extname(c.old);
    const newExt = '.webp';
    // simple: replace the exact filename+ext occurrence
    const fileName = c.old.split('/').pop();
    const newFileName = c.new.split('/').pop();
    if (out.includes(fileName)) {
      out = out.split(fileName).join(newFileName);
    }
  }
  if (out !== src) {
    writeFileSync(f, out);
    touchedFiles++;
  }
}
console.log(`Updated references in ${touchedFiles} files`);
