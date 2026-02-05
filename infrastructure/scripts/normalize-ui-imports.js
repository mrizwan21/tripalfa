const fs = require('fs').promises;
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'apps', 'b2b-admin', 'src');
const BACKUP_DIR = path.join(__dirname, '.normalize-backup-' + Date.now());

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      files.push(...await walk(full));
    } else if (/\.(ts|tsx|js|jsx)$/.test(ent.name)) {
      files.push(full);
    }
  }
  return files;
}

async function ensureDir(p) {
  try { await fs.mkdir(p, { recursive: true }); } catch (e) {}
}

(async () => {
  console.log('Target:', TARGET);
  await ensureDir(BACKUP_DIR);
  const files = await walk(TARGET);
  let changed = 0;
  for (const file of files) {
    const rel = path.relative(TARGET, file);
    let src = await fs.readFile(file, 'utf8');
    let out = src;

    if (file.includes(path.join('apps', 'b2b-admin', 'src', 'components', 'ui'))) {
      // inside the ui primitives folder: convert ../components/ui/... -> ./...
      out = out.replace(/(\.\.\/components\/ui\/)/g, './');
      out = out.replace(/(\.\.\/components\/ui')/g, "./'");
      out = out.replace(/(\.\.\/components\/ui\")/g, './"');
    } else {
      // for other files: normalize to alias
      out = out.replace(/(\.\.\/components\/ui\/)/g, '@/components/ui/');
      out = out.replace(/(\.\.\/components\/ui')/g, "@/components/ui'");
      out = out.replace(/(\.\.\/components\/ui\")/g, '@/components/ui"');
    }

    if (out !== src) {
      const backupPath = path.join(BACKUP_DIR, rel);
      await ensureDir(path.dirname(backupPath));
      await fs.writeFile(backupPath, src, 'utf8');
      await fs.writeFile(file, out, 'utf8');
      changed++;
      console.log('Patched:', rel);
    }
  }
  console.log(`Done. Files changed: ${changed}. Backups in ${BACKUP_DIR}`);
})();
