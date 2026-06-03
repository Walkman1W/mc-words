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
  return JSON.stringify(manifest);
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
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  if (url === '/assets/images/cards/manifest.json') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(generateManifest());
    return;
  }

  let filePath = path.join(ROOT, url === '/' ? 'index.html' : url);
  filePath = path.normalize(filePath);

  if (!filePath.startsWith(ROOT)) {
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
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open gallery: http://localhost:${PORT}/gallery.html`);
  console.log('Press Ctrl+C to stop');
});
