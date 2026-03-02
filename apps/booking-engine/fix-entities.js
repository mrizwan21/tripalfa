const fs = require('fs');

const files = [
  'src/services/flightBookingWorkflowOrchestrator.ts',
  'src/services/hotelBookingWorkflowOrchestrator.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix the HTML entities in the escapeHtml function
  content = content.replace(/\.replace\(\/&\/g, "&"\)/g, '.replace(/&/g, "&amp;")');
  content = content.replace(/\.replace\(\/</g, "<"\)/g, '.replace(/</g, "&lt;")');
  content = content.replace(/\.replace\(\/>/g, ">"\)/g, '.replace(/>/g, "&gt;")');
  content = content.replace(/\.replace\(\/"/g, """\)/g, '.replace(/"/g, "&quot;")');
  content = content.replace(/\.replace\(\/'/g, "&#x27;"\)/g, '.replace(/\'/g, "&#x27;")');
  
  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
});
EOF && node fix-entities.js