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
      cb(full, dir);
  });
}

function processComponent(file) {
  let content = fs.readFileSync(file, "utf8");
  let original = content;

  // 1. Fix Button prop typing errors that previous script introducted in booking-engine
  if (file.includes("apps/booking-engine")) {
    // booking-engine button size is 'sm' | 'md' | 'lg', default is 'md'
    content = content.replace(
      /<[Bb]utton([^>]*)size=(["'])default(\2)/g,
      '<Button$1size="md"',
    );
    content = content.replace(
      /<[Bb]utton([^>]*)size=(["'])icon(\2)/g,
      '<Button$1size="sm"',
    );
    content = content.replace(
      /<[Bb]utton([^>]*)variant=(["'])default(\2)/g,
      '<Button$1variant="primary"',
    );
  }

  // 1b. Fix Button props in b2b-admin (shadcn/radix based usually)
  if (file.includes("apps/b2b-admin")) {
    content = content.replace(
      /<[Bb]utton([^>]*)variant=(["'])primary(\2)/g,
      '<Button$1variant="default"',
    );
  }

  // 2. Standardize form spacing in both apps (Add space-y-4 to form containers if they don't have it and have multiple fields)
  // We'll target `<form>` and adding gap/space if missing
  content = content.replace(
    /<form([^>]*className=(["']))([^"']*)(\2)/g,
    (match, before, quote, classes, afterQuote) => {
      let newClasses = classes;
      if (!/\b(gap(-[0-9]+)?|space-[xy](-[0-9]+)?)\b/.test(newClasses)) {
        newClasses += " space-y-6"; // forms usually need larger vertical spacing
      }
      return `<form${before}${newClasses}${afterQuote}`;
    },
  );

  // 3. Textarea Standardization
  content = content.replace(
    /<textarea([^>]*className=(["']))([^"']*)(\2)/g,
    (match, before, quote, classes, afterQuote) => {
      let newClasses = classes;
      if (!/\b(p-[0-9]+|px-[0-9]+|py-[0-9]+|min-h-[0-9]+)\b/.test(newClasses)) {
        newClasses += " px-3 py-2 min-h-[100px]";
      }
      if (!/\b(rounded|rounded-[a-z]+)\b/.test(newClasses)) {
        newClasses += " rounded-md";
      }
      if (!newClasses.includes("border")) {
        // basic border
        newClasses += " border border-input";
      }
      return `<textarea${before}${newClasses}${afterQuote}`;
    },
  );

  // 4. Card and Dialog padding standardization (ensure smooth edges and breathing room)
  // E.g. targeting `<CardContent className="...">` or standardizing basic Card class
  content = content.replace(
    /<CardContent([^>]*className=(["']))([^"']*)(\2)/g,
    (match, before, quote, classes, afterQuote) => {
      let newClasses = classes;
      if (
        !/\b(p-[0-9]+|pt-[0-9]+|pb-[0-9]+|px-[0-9]+|py-[0-9]+)\b/.test(
          newClasses,
        )
      ) {
        newClasses += " p-6"; // standard shadcn padding
      }
      return `<CardContent${before}${newClasses}${afterQuote}`;
    },
  );

  // 5. Remove redundant generic color assignments in headings to rely on CSS variables/theme.
  content = content.replace(
    /<(h[1-6]|p)([^>]*className=(["']))([^"']*)(\3)/g,
    (match, tag, before, quote, classes, afterQuote) => {
      let newClasses = classes;

      // Convert hardcoded hex colors or harsh gray-900 to standard foreground variables in UI contexts
      // B2B Admin uses a lot of shadcn so text-foreground, text-muted-foreground.
      // Wait, let's just make sure there are no random explicit colors like text-blue-500 for headers unless requested

      // Instead of messing up semantic colors, just ensure typography classes are solid
      if (tag === "h1" && !/\b(text-[2-9]xl|text-xl)\b/.test(newClasses))
        newClasses += " text-3xl font-bold tracking-tight";
      if (tag === "h2" && !/\b(text-[xl|2-9]xl)\b/.test(newClasses))
        newClasses += " text-2xl font-semibold tracking-tight";
      if (tag === "h3" && !/\b(text-(lg|xl))\b/.test(newClasses))
        newClasses += " text-xl font-semibold tracking-tight";

      // For paragraphs that are clearly muted hints
      if (
        tag === "p" &&
        classes.includes("text-sm") &&
        !classes.includes("text-")
      ) {
        newClasses += " text-muted-foreground";
      }

      return `<${tag}${before}${newClasses}${afterQuote}`;
    },
  );

  // 6. Generic container fix for "distorted/overlapping"
  content = content.replace(
    /className=(["'])([^"']*\b(grid|grid-cols-[0-9]+)\b[^"']*)\1/g,
    (match, quote, classes) => {
      if (!/\b(gap(-[0-9]+)?|gap-[xy](-[0-9]+)?)\b/.test(classes)) {
        return `className=${quote}${classes} gap-4${quote}`;
      }
      return match;
    },
  );

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log("Standardized Phase 2:", file);
  }
}

console.log("Running standardization Phase 2 script...");
[
  "apps/booking-engine/src",
  "apps/b2b-admin/src",
  "packages/ui-components/src",
].forEach((dir) => {
  walk(path.resolve(__dirname, dir), processComponent);
});
console.log("Phase 2 script completed.");
