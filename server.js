const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = __dirname;
const CARDS_DIR = path.join(ROOT, 'assets', 'images', 'cards');

const CATEGORIES = [
  '01-block', '02-tool', '03-weapon', '04-food',
  '05-ore', '06-armor', '07-redstone', '08-spawn-egg',
];
const FILE_PATTERN = /^(\d{3})-(.+)\.(png|jpg|jpeg)$/i;

function encode(str) {
  const json = JSON.stringify(str);
  const b64 = Buffer.from(json, 'utf-8').toString('base64');
  return b64.split('').reverse().map(c => {
    const code = c.charCodeAt(0);
    return String.fromCharCode(code + 3);
  }).join('');
}

function generateManifest() {
  const manifest = {};
  for (const cat of CATEGORIES) {
    const catDir = path.join(CARDS_DIR, cat);
    manifest[cat] = [];
    if (!fs.existsSync(catDir)) continue;
    const files = fs.readdirSync(catDir)
      .filter(f => FILE_PATTERN.test(f))
      .sort((a, b) => parseInt(a) - parseInt(b));
    for (const file of files) {
      const match = file.match(FILE_PATTERN);
      manifest[cat].push({ id: match[1], word: match[2].trim(), image: file });
    }
  }
  return manifest;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.dat': 'application/octet-stream',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
};

function isAllowedReferer(req) {
  const referer = req.headers['referer'] || '';
  if (!referer) return false;
  try {
    const url = new URL(referer);
    return url.hostname === 'localhost' ||
           url.hostname === '127.0.0.1' ||
           url.hostname.endsWith('.pages.dev');
  } catch {
    return false;
  }
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  // Serve encoded manifest
  if (url === '/assets/images/cards/manifest.dat') {
    const manifest = generateManifest();
    const encoded = encode(manifest);
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store',
    });
    res.end(encoded);
    return;
  }

  // Block direct manifest.json access (return 403)
  if (url === '/assets/images/cards/manifest.json') {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Protect image files: require Referer header
  if (url.startsWith('/assets/images/cards/') && /\.(png|jpg|jpeg)$/i.test(url)) {
    if (!isAllowedReferer(req)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Hotlinking not allowed');
      return;
    }
  }

  let filePath = path.join(ROOT, url === '/' ? 'index.html' : url);
  filePath = path.normalize(filePath);

  if (!filePath.startsWith(ROOT) || filePath.includes('..')) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Block access to server-side files
  const basename = path.basename(filePath);
  if (basename === 'server.js' || basename === 'generate-manifest.js' || basename === 'package.json') {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    const headers = { 'Content-Type': mime };

    if (url.startsWith('/assets/images/cards/')) {
      headers['X-Content-Type-Options'] = 'nosniff';
      headers['Cache-Control'] = 'no-store';
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open gallery: http://localhost:${PORT}/gallery.html`);
  console.log('Press Ctrl+C to stop');
});
