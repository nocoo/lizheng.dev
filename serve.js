import { watch } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Run build first
await import('./build.js');

// Start server
const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;
    
    // Handle directory requests
    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    }
    
    // Try to serve file
    const filePath = join(__dirname, 'dist', pathname);
    const file = Bun.file(filePath);
    
    if (await file.exists()) {
      return new Response(file);
    }
    
    // 404
    return new Response('Not Found', { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
console.log('Watching for changes...');

// Watch for changes and rebuild
const srcDir = join(__dirname, 'src');
watch(srcDir, { recursive: true }, async (event, filename) => {
  console.log(`Change detected: ${filename}`);
  try {
    // Clear module cache and rebuild
    delete require.cache[require.resolve('./build.js')];
    await import('./build.js?' + Date.now());
    console.log('Rebuilt!');
  } catch (e) {
    console.error('Build error:', e.message);
  }
});
