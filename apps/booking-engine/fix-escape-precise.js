const fs = require('fs');

const files = [
  'src/services/flightBookingWorkflowOrchestrator.ts',
  'src/services/hotelBookingWorkflowOrchestrator.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the incorrect escapeHtml function with the correct one
  const oldFunction = `function escapeHtml(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return "";
  const str = String(text);
  return str
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """)
    .replace(/'/g, "&#x27;");
}`;

  const newFunction = `function escapeHtml(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return "";
  const str = String(text);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}`;

  content = content.replace(oldFunction, newFunction);
  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
});
EOF && node fix-escape-precise.js