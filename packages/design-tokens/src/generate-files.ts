/**
 * Script to generate CSS, SCSS, and JSON files from design tokens
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateCSSVariables } from './css.js';
import { generateSCSSVariables } from './scss.js';
import { generateJSON } from './json.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputDir = join(__dirname, '..');

// Generate CSS file
const cssContent = `/**
 * Apple Design System Tokens - CSS Custom Properties
 * Generated from @tripalfa/design-tokens
 * 
 * These CSS custom properties define the Apple-inspired design system
 * for the TripAlfa booking engine.
 */

${generateCSSVariables()}
`;

writeFileSync(join(outputDir, 'tokens.css'), cssContent);
console.log('✅ Generated tokens.css');

// Generate SCSS file
const scssContent = `/**
 * Apple Design System Tokens - SCSS Variables
 * Generated from @tripalfa/design-tokens
 */

${generateSCSSVariables()}
`;

writeFileSync(join(outputDir, 'tokens.scss'), scssContent);
console.log('✅ Generated tokens.scss');

// Generate JSON file
const jsonContent = generateJSON();
writeFileSync(join(outputDir, 'tokens.json'), jsonContent);
console.log('✅ Generated tokens.json');

console.log('🎉 All design token files generated successfully!');