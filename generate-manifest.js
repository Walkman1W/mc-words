const fs = require('fs');
const path = require('path');

const CARDS_DIR = path.join(__dirname, 'assets', 'images', 'cards');
const CATEGORIES = [
  '01-block',
  '02-tool',
  '03-weapon',
  '04-food',
  '05-ore',
  '06-armor',
  '07-redstone',
  '08-spawn-egg',
];

const FILE_PATTERN = /^(\d{3})-(.+)\.(png|jpg|jpeg)$/i;

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
    .sort((a, b) => {
      const idA = parseInt(a.match(/^(\d{3})/)[1]);
      const idB = parseInt(b.match(/^(\d{3})/)[1]);
      return idA - idB;
    });

  for (const file of files) {
    const match = file.match(FILE_PATTERN);
    const id = match[1];
    const word = match[2].trim();
    manifest[cat].push({ id, word, image: file });
  }
}

const outPath = path.join(CARDS_DIR, 'manifest.json');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf-8');

console.log('manifest.json generated successfully!');
for (const [cat, cards] of Object.entries(manifest)) {
  console.log(`  ${cat}: ${cards.length} cards`);
}
