/* global console, __dirname */

const fs = require("fs");
const path = require("path");

function walk(dir, cb) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach((file) => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walk(full, cb);
    else if (
      full.endsWith(".tsx") ||
      full.endsWith(".ts") ||
      full.endsWith(".jsx")
    )
      cb(full);
  });
}

function processComponent(file) {
  let content = fs.readFileSync(file, "utf8");
  let original = content;

  // 1. Fix overlapping flex containers by adding gap-4 if no gap or justify-between is present
  // This will only affect classNames with "flex" in them.
  content = content.replace(
    /className=(["'])([^"']*\bflex\b[^"']*)\1/g,
    (match, quote, classes) => {
      // Check if there is already a mechanism for spacing
      if (
        /\b(gap(-[0-9]+)?|space-[xy](-[0-9]+)?|justify-between|justify-around|justify-evenly|hidden)\b/.test(
          classes,
        )
      ) {
        return match;
      }
      // Only add gap-4 for standard item containers
      return `className=${quote}${classes} gap-4${quote}`;
    },
  );

  // 2. Fix generic buttons missing standard classnames
  // We avoid replacing Button components here.
  content = content.replace(
    /<button([^>]*className=(["']))([^"']*)(\2)/g,
    (match, before, quote, classes, afterQuote) => {
      let newClasses = classes;
      // Standardize sizing and radius if missing
      if (!/\b(p-[0-9]+|px-[0-9]+|py-[0-9]+|h-[0-9]+)\b/.test(newClasses)) {
        newClasses += " px-4 py-2";
      }
      if (!/\b(rounded|rounded-[a-z]+)\b/.test(newClasses)) {
        newClasses += " rounded-md";
      }
      if (!/\b(text-[a-z]+)\b/.test(newClasses)) {
        newClasses += " text-sm font-medium";
      }
      return `<button${before}${newClasses}${afterQuote}`;
    },
  );

  // 3. Fix Button Standardization (shadcn/radix/mui variants vs hardcoded colors)
  // Look for custom text/bg colors overriding the primary variant, standardizing them to use variant behavior
  content = content.replace(
    /<Button([^>]*)className=(["'])([^"']*)(\2)/g,
    (match, before, quote, classes, afterQuote) => {
      let newClasses = classes;
      // We remove hardcoded `bg-xyz-xxx` and `text-xyz-xxx` to let Button variants take over,
      // UNLESS it's specifically asked by a custom tailwind configuration.
      // Given the prompt "labels and buttons are still of different sizes and colours in different pages, I do not see any standardization"
      // Removing the ad-hoc background and text colors from `<Button>` forces them to use their variants.

      // Check if variant is not specified, or if it is...
      // Strip random backgrounds unless it's gradient or specific
      newClasses = newClasses
        .replace(
          /\b(bg-(blue|indigo|purple|red|orange|yellow|green|teal|cyan|emerald|sky|rose)-(500|600|700))\b/g,
          "",
        )
        .replace(
          /\b(text-(white|black|blue|indigo|purple|red|orange|yellow|green|teal|cyan|emerald|sky|rose)-(50|100|500|600|700|800|900))\b/g,
          "",
        )
        .replace(/\s+/g, " ")
        .trim();

      return `<Button${before}className=${quote}${newClasses}${afterQuote}`;
    },
  );

  // 4. Force Label standardization
  content = content.replace(
    /<([Ll]abel)([^>]*)className=(["'])([^"']*)(\3)/g,
    (match, tag, before, quote, classes, afterQuote) => {
      let newClasses = classes;
      if (!/\b(text-(xs|sm|base|lg))\b/.test(newClasses))
        newClasses += " text-sm";
      if (!/\b(font-(medium|semibold|bold|normal))\b/.test(newClasses))
        newClasses += " font-medium";
      return `<${tag}${before}className=${quote}${newClasses}${afterQuote}`;
    },
  );

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log("Standardized:", file);
  }
}

console.log("Running standardization script...");
[
  "apps/booking-engine/src",
  "apps/b2b-admin/src",
  "packages/ui-components/src",
].forEach((dir) => {
  walk(path.resolve(__dirname, dir), processComponent);
});
console.log("Standardization script completed.");
