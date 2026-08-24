const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = 8080;
const ROOT = __dirname;
const CARDS_DIR = path.join(ROOT, 'assets', 'images', 'cards');

const CATEGORIES = [
  '01-block', '02-tool', '03-weapon', '04-food',
  '05-ore', '06-armor', '07-animal', '08-monster',
  '09-redstone', '10-spawn-egg',
];
const FILE_PATTERN = /^(\d{3})-(.+)\.(png|jpg|jpeg|webp)$/i;

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
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.dat': 'application/octet-stream',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
};

// Compression helper - gzip for text-based responses
const TEXT_TYPES = ['text/', 'application/javascript', 'application/json'];

function compressResponse(req, res, data, headers) {
  const contentType = headers['Content-Type'] || '';
  const isText = TEXT_TYPES.some(t => contentType.startsWith(t));
  if (!isText || data.length < 256) {
    res.writeHead(200, headers);
    res.end(data);
    return;
  }
  const accept = req.headers['accept-encoding'] || '';
  if (accept.includes('br')) {
    zlib.brotliCompress(data, (err, compressed) => {
      if (err) { res.writeHead(200, headers); res.end(data); return; }
      headers['Content-Encoding'] = 'br';
      headers['Content-Length'] = compressed.length;
      headers['Vary'] = 'Accept-Encoding';
      res.writeHead(200, headers);
      res.end(compressed);
    });
  } else if (accept.includes('gzip')) {
    zlib.gzip(data, (err, compressed) => {
      if (err) { res.writeHead(200, headers); res.end(data); return; }
      headers['Content-Encoding'] = 'gzip';
      headers['Content-Length'] = compressed.length;
      headers['Vary'] = 'Accept-Encoding';
      res.writeHead(200, headers);
      res.end(compressed);
    });
  } else {
    res.writeHead(200, headers);
    res.end(data);
  }
}

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
  let url = decodeURIComponent(req.url.split('?')[0]);

  // Match the public Book 2 video URL when previewing the static site locally.
  if (url === '/videos2' || url === '/videos2/') {
    url = '/videos2/index.html';
  }

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
  if (url.startsWith('/assets/images/cards/') && /\.(png|jpg|jpeg|webp)$/i.test(url)) {
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

    // Cache headers by content type
    if (ext === '.html') {
      headers['Cache-Control'] = 'public, max-age=3600, must-revalidate';
    } else if (ext === '.css' || ext === '.js') {
      headers['Cache-Control'] = 'public, max-age=604800, immutable';
    } else if (/\.(png|jpg|jpeg|webp|svg|ico)$/.test(ext)) {
      headers['Cache-Control'] = 'public, max-age=2592000, immutable';
      headers['X-Content-Type-Options'] = 'nosniff';
    } else if (ext === '.json') {
      headers['Cache-Control'] = 'public, max-age=3600';
    }

    // Compress text-based files
    const isText = TEXT_TYPES.some(t => mime.startsWith(t)) || ext === '.html' || ext === '.css';
    if (isText) {
      fs.readFile(filePath, (readErr, data) => {
        if (readErr) { res.writeHead(500); res.end('Internal Error'); return; }
        compressResponse(req, res, data, headers);
      });
    } else {
      headers['Content-Length'] = stats.size;
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open gallery: http://localhost:${PORT}/gallery.html`);
  console.log('Press Ctrl+C to stop');
});
