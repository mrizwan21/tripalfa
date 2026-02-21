#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Icon name mappings from old to new
const iconMappings = {
  // Common renames
  'Edit2': 'Edit',
  'Settings2': 'Settings',
  'Clock4': 'Clock',
  'RefreshCcw': 'RefreshCw',
  'ArrowDownRight': 'ArrowRight',
  'ArrowDownLeft': 'ArrowLeft',
  'Building': 'Building2',
  'Loader': 'Loader2',
  'CalendarRange': 'Calendar',
  'PieChart': 'ChartPie',
  'LineChart': 'ChartLine',
  'FileIcon': 'File',
  'FileWarning': 'AlertTriangle',
  'Link2': 'Link',
  'RepeatIcon': 'Repeat',
  'CalendarClock': 'Calendar',
  'ListPlus': 'Plus',
  'GitBranch': 'GitBranch',
  'Copy': 'Copy',
  'ExternalLink': 'ExternalLink',
  'Command': 'Command',
  'Network': 'Network',
  'Scale': 'Scale',
  'Activity': 'Activity',
  'ClipboardList': 'ClipboardList',
  'MousePointer': 'MousePointer',
  'EyeOff': 'EyeOff',
  'Play': 'Play',
  'Pause': 'Pause',
  'Server': 'Server',
  'Cloud': 'Cloud',
  'Cpu': 'Cpu',
  'LayoutGrid': 'LayoutGrid'
};

function findFiles(dir, extensions) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  traverse(dir);
  return files;
}

function fixIcons() {
  try {
    // Find all TypeScript/React files
    const srcDir = path.join(process.cwd(), 'src');
    const files = findFiles(srcDir, ['.ts', '.tsx']);

    let totalFiles = 0;
    let totalReplacements = 0;

    for (const filePath of files) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      let fileReplacements = 0;

      // First, fix icon name mappings
      for (const [oldName, newName] of Object.entries(iconMappings)) {
        if (oldName === newName) continue;

        // Match import statements and usage
        const importRegex = new RegExp(`\\b${oldName}\\b`, 'g');

        if (importRegex.test(content)) {
          content = content.replace(importRegex, newName);
          modified = true;
          fileReplacements++;
        }
      }

      // Second, convert named imports to wildcard imports for lucide-react
      if (content.includes("from 'lucide-react'")) {
        const lucideImportRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]lucide-react['"]/g;

        content = content.replace(lucideImportRegex, (match, imports) => {
          const iconNames = imports.split(',').map(icon => icon.trim()).filter(icon => icon);
          return `import * as Icons from 'lucide-react';\n\nconst {\n  ${iconNames.join(',\n  ')}\n} = Icons as any;`;
        });

        modified = true;
        fileReplacements++;
      }

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);
        console.log(`✅ Fixed ${fileReplacements} icons in ${relativePath}`);
        totalFiles++;
        totalReplacements += fileReplacements;
      }
    }

    console.log(`\n🎉 Icon fix complete!`);
    console.log(`📁 Files modified: ${totalFiles}`);
    console.log(`🔄 Total replacements: ${totalReplacements}`);

  } catch (error) {
    console.error('❌ Error fixing icons:', error);
    process.exit(1);
  }
}

fixIcons();
