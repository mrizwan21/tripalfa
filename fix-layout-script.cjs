/* global console */

const fs = require("fs");
const path = require("path");

function walk(dir, cb) {
  fs.readdirSync(dir).forEach((file) => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walk(full, cb);
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) cb(full);
  });
}

function fixFile(file) {
  let content = fs.readFileSync(file, "utf8");
  let originalContent = content;

  // 1. Fix flex items-center without gap (adds gap-2)
  const flexNoGap =
    /className="([^"]*\bflex\s+items-center\b(?!.*\bgap(-[0-9a-zA-Z]+)?\b)[^"]*)"/g;
  content = content.replace(flexNoGap, (match, p1) => {
    return `className="${p1} gap-2"`;
  });

  // 2. Fix flex justify-between without gap
  const flexBetweenNoGap =
    /className="([^"]*\bflex\s+justify-between\b(?!.*\bgap(-[0-9a-zA-Z]+)?\b)[^"]*)"/g;
  content = content.replace(flexBetweenNoGap, (match, p1) => {
    return `className="${p1} gap-4"`;
  });

  // 3. Convert basic generic non-standard button styling to standard `btn` variants if they don't have sizing
  const buttonNoPadding = /<button className="([^"]*)"/g;
  content = content.replace(buttonNoPadding, (match, p1) => {
    let classes = p1;
    // We add standard button classes if not present to ensure standard look
    if (!/\b(btn|p-|px-|py-|w-|h-|size-)\b/.test(classes)) {
      classes +=
        " px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-100";
    }
    return `<button className="${classes}"`;
  });

  // 4. Standardize labels
  const labelRaw = /<label className="([^"]*)"/g;
  content = content.replace(labelRaw, (match, p1) => {
    let classes = p1;
    if (!/\b(text-sm|text-xs|text-lg|font-)\b/.test(classes)) {
      classes +=
        " text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
    }
    return `<label className="${classes}"`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log("Fixed:", file);
  }
}

["apps/booking-engine/src", "apps/b2b-admin/src"].forEach((dir) => {
  if (fs.existsSync(dir)) walk(dir, fixFile);
});
