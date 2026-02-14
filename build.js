import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import enData from './src/data/en.js';
import zhData from './src/data/zh.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Helper to get nested value
function getValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// Find matching closing tag, handling nesting
function findMatchingClose(str, openTag, closeTag, startPos) {
  let depth = 1;
  let pos = startPos;
  while (depth > 0 && pos < str.length) {
    const nextOpen = str.indexOf(openTag, pos);
    const nextClose = str.indexOf(closeTag, pos);
    
    if (nextClose === -1) return -1;
    
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + openTag.length;
    } else {
      depth--;
      if (depth === 0) return nextClose;
      pos = nextClose + closeTag.length;
    }
  }
  return -1;
}

// Process {{#each}}...{{/each}} blocks
function processEach(template, context) {
  let result = template;
  let safetyCounter = 0;
  
  while (result.includes('{{#each ') && safetyCounter < 100) {
    safetyCounter++;
    const match = result.match(/\{\{#each ([\w.]+)\}\}/);
    if (!match) break;
    
    const arrayName = match[1];
    const startPos = match.index;
    const openTagEnd = startPos + match[0].length;
    const closeTag = '{{/each}}';
    const closePos = findMatchingClose(result, '{{#each ', closeTag, openTagEnd);
    
    if (closePos === -1) break;
    
    const innerTemplate = result.substring(openTagEnd, closePos);
    const arr = getValue(context, arrayName);
    
    let replacement = '';
    if (Array.isArray(arr)) {
      replacement = arr.map(item => {
        if (typeof item === 'string') {
          return innerTemplate.replace(/\{\{this\}\}/g, item);
        }
        // For objects, recursively process the template with item as context
        let itemResult = processEach(innerTemplate, item);
        itemResult = processIf(itemResult, item);
        itemResult = processVariables(itemResult, item);
        return itemResult;
      }).join('');
    }
    
    result = result.substring(0, startPos) + replacement + result.substring(closePos + closeTag.length);
  }
  
  return result;
}

// Process {{#if}}...{{/if}} blocks
function processIf(template, context) {
  let result = template;
  let safetyCounter = 0;
  
  while (result.includes('{{#if ') && safetyCounter < 100) {
    safetyCounter++;
    const match = result.match(/\{\{#if ([\w.]+)\}\}/);
    if (!match) break;
    
    const varName = match[1];
    const startPos = match.index;
    const openTagEnd = startPos + match[0].length;
    const closeTag = '{{/if}}';
    const closePos = findMatchingClose(result, '{{#if ', closeTag, openTagEnd);
    
    if (closePos === -1) break;
    
    const innerTemplate = result.substring(openTagEnd, closePos);
    const value = getValue(context, varName);
    
    let replacement = '';
    if (value) {
      replacement = innerTemplate;
      // We don't specificly replace the variable here anymore,
      // as processVariables will handle it later with full context support.
    }
    
    result = result.substring(0, startPos) + replacement + result.substring(closePos + closeTag.length);
  }
  
  return result;
}

// Process simple {{variable}} and {{{variable}}} and {{obj.key}} patterns
function processVariables(template, context) {
  let result = template;
  
  // Replace {{{variable}}} patterns (unescaped HTML) - support dots
  // Note: match specific patterns first
  result = result.replace(/\{\{\{([\w.]+)\}\}\}/g, (match, key) => {
    const val = getValue(context, key);
    return val !== undefined ? val : match;
  });
  
  // Replace {{variable}} patterns - support dots
  result = result.replace(/\{\{([\w.]+)\}\}/g, (match, key) => {
    const val = getValue(context, key);
    return val !== undefined ? val : match;
  });
  
  return result;
}

// Main render function
function render(template, data) {
  let result = template;
  result = processEach(result, data);
  result = processIf(result, data);
  result = processVariables(result, data);
  return result;
}

// Build process
console.log('Building...');

// Read templates
const enTemplate = readFileSync(join(__dirname, 'src/en/index.html'), 'utf-8');
const zhTemplate = readFileSync(join(__dirname, 'src/zh/index.html'), 'utf-8');
const indexHtml = readFileSync(join(__dirname, 'src/index.html'), 'utf-8');

// Generate HTML
const enHtml = render(enTemplate, enData);
const zhHtml = render(zhTemplate, zhData);

// Create dist directories
mkdirSync(join(__dirname, 'dist/en'), { recursive: true });
mkdirSync(join(__dirname, 'dist/zh'), { recursive: true });

// Write HTML files
writeFileSync(join(__dirname, 'dist/index.html'), indexHtml);
writeFileSync(join(__dirname, 'dist/en/index.html'), enHtml);
writeFileSync(join(__dirname, 'dist/zh/index.html'), zhHtml);

// Copy static assets
cpSync(join(__dirname, 'public'), join(__dirname, 'dist'), { recursive: true });

// Copy JS
const mainJs = readFileSync(join(__dirname, 'src/main.js'), 'utf-8');
writeFileSync(join(__dirname, 'dist/main.js'), mainJs);

console.log('Build complete!');
console.log('  dist/index.html');
console.log('  dist/en/index.html');
console.log('  dist/zh/index.html');
console.log('  dist/css/style.css');
console.log('  dist/images/...');
console.log('  dist/main.js');
