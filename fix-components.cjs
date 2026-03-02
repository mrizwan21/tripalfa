/* global console */

const fs = require("fs");
const { execSync } = require("child_process");

["apps/booking-engine/src", "apps/b2b-admin/src"].forEach((appDir) => {
  if (!fs.existsSync(appDir)) return;

  let files = [];
  try {
    files = execSync(`grep -rl "<button " ${appDir}`)
      .toString()
      .split("\n")
      .filter(Boolean);
  } catch {
    // no files found
  }

  files.forEach((file) => {
    let content = fs.readFileSync(file, "utf8");
    let original = content;

    content = content.replace(/<button([^>]*)>/g, (match, attrs) => {
      let variant = "outline";
      let size = "default";

      if (
        attrs.includes("bg-transparent") ||
        attrs.includes("absolute") ||
        attrs.includes("hover:bg-gray-100") ||
        attrs.includes("border-transparent")
      ) {
        variant = "ghost";
      } else if (
        attrs.includes("bg-[#") ||
        attrs.includes("bg-white") ||
        attrs.includes("bg-primary") ||
        attrs.includes("bg-blue-600") ||
        attrs.includes("bg-foreground")
      ) {
        variant = "primary";
      }

      if (
        (attrs.includes("w-") &&
          attrs.includes("h-") &&
          attrs.includes("p-")) ||
        attrs.includes("size=")
      ) {
        size = "icon";
      }

      return `<Button variant="${variant}" size="${size}"${attrs}>`;
    });

    content = content.replace(/<\/button>/g, "</Button>");

    // Same for label -> Label
    content = content.replace(/<label([^>]*)>/g, "<Label$1>");
    content = content.replace(/<\/label>/g, "</Label>");

    if (content !== original) {
      if (
        content.includes("<Button") &&
        !content.includes('Button"') &&
        !content.includes("Button'") &&
        !content.includes("import { Button }")
      ) {
        const isUiDir = file.includes("/components/ui/");
        // For b2b-admin it might be different, let's use relative or generic alias
        // Assuming @tripalfa/ui-components or local for b2b-admin
        let importStr = `import { Button } from '@/components/ui/button';\n`;
        if (file.includes("apps/b2b-admin")) {
          importStr = `import { Button } from '@tripalfa/ui-components';\n`;
        } else if (isUiDir) {
          importStr = `import { Button } from './button';\n`;
        }

        const lastBaseImport = content.lastIndexOf("import ");
        if (lastBaseImport !== -1) {
          const endOfLine = content.indexOf("\n", lastBaseImport);
          content =
            content.slice(0, endOfLine + 1) +
            importStr +
            content.slice(endOfLine + 1);
        } else {
          content = importStr + content;
        }
      }

      if (content.includes("<Label") && !content.includes("import { Label }")) {
        let importStr = `import { Label } from '@/components/ui/label';\n`;
        if (file.includes("apps/b2b-admin")) {
          importStr = `import { Label } from '@tripalfa/ui-components';\n`;
        } else if (file.includes("/components/ui/")) {
          importStr = `import { Label } from './label';\n`;
        }
        const lastBaseImport = content.lastIndexOf("import ");
        if (lastBaseImport !== -1) {
          const endOfLine = content.indexOf("\n", lastBaseImport);
          content =
            content.slice(0, endOfLine + 1) +
            importStr +
            content.slice(endOfLine + 1);
        } else {
          content = importStr + content;
        }
      }

      fs.writeFileSync(file, content);
      console.log("Migrated raw tags in:", file);
    }
  });
});
