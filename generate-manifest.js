const fs = require('fs');
const path = require('path');

const CARDS_DIR = path.join(__dirname, 'assets', 'images', 'cards');
const CATEGORIES = [
  '01-block', '02-tool', '03-weapon', '04-food',
  '05-ore', '06-armor', '07-redstone', '08-spawn-egg',
];
const FILE_PATTERN = /^(\d{3})-(.+)\.(png|jpg|jpeg)$/i;

function encode(str) {
  const json = JSON.stringify(str);
  const b64 = Buffer.from(json, 'utf-8').toString('base64');
  // Reverse + simple char shift
  return b64.split('').reverse().map(c => {
    const code = c.charCodeAt(0);
    return String.fromCharCode(code + 3);
  }).join('');
}

const manifest = {};
for (const cat of CATEGORIES) {
  const catDir = path.join(CARDS_DIR, cat);
  manifest[cat] = [];
  if (!fs.existsSync(catDir)) {
    fs.mkdirSync(catDir, { recursive: true });
    continue;
  }
  const files = fs.readdirSync(catDir)
    .filter(f => FILE_PATTERN.test(f))
    .sort((a, b) => parseInt(a.match(/^(\d{3})/)[1]) - parseInt(b.match(/^(\d{3})/)[1]));
  for (const file of files) {
    const match = file.match(FILE_PATTERN);
    manifest[cat].push({ id: match[1], word: match[2].trim(), image: file });
  }
}

const encoded = encode(manifest);
const outPath = path.join(CARDS_DIR, 'manifest.dat');
fs.writeFileSync(outPath, encoded, 'utf-8');

// Also keep the old manifest.json for backwards compat during transition
const jsonOutPath = path.join(CARDS_DIR, 'manifest.json');
fs.writeFileSync(jsonOutPath, JSON.stringify(manifest, null, 2), 'utf-8');

console.log('manifest.dat (encoded) generated successfully!');
console.log('manifest.json (plain, to be removed after deploy) also updated.');
for (const [cat, cards] of Object.entries(manifest)) {
  console.log(`  ${cat}: ${cards.length} cards`);
}
