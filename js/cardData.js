let CARD_DATA = {};
let loaded = false;
let loadPromise = null;
const blobCache = new Map();

function decode(encoded) {
  const unshifted = encoded.split('').map(c => {
    const code = c.charCodeAt(0);
    return String.fromCharCode(code - 3);
  }).join('');
  const b64 = unshifted.split('').reverse().join('');
  const json = atob(b64);
  return JSON.parse(json);
}

export function loadCardData() {
  if (loadPromise) return loadPromise;
  loadPromise = fetch('assets/images/cards/manifest.dat')
    .then(res => {
      if (!res.ok) throw new Error('manifest.dat not found');
      return res.text();
    })
    .then(encoded => {
      CARD_DATA = decode(encoded);
      loaded = true;
    })
    .catch(() => {
      // Fallback to plain manifest.json for dev
      return fetch('assets/images/cards/manifest.json')
        .then(res => res.ok ? res.json() : {})
        .then(data => { CARD_DATA = data; loaded = true; })
        .catch(() => { CARD_DATA = {}; loaded = true; });
    });
  return loadPromise;
}

export function getCardsForCategory(categoryId) {
  return CARD_DATA[categoryId] || [];
}

export function getCardImagePath(categoryId, imageName) {
  return `assets/images/cards/${categoryId}/${encodeURIComponent(imageName)}`;
}

export async function getCardImageBlobUrl(categoryId, imageName) {
  const realPath = getCardImagePath(categoryId, imageName);
  if (blobCache.has(realPath)) return blobCache.get(realPath);

  try {
    const res = await fetch(realPath);
    if (!res.ok) return realPath;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    blobCache.set(realPath, blobUrl);
    return blobUrl;
  } catch {
    return realPath;
  }
}

export function revokeAllBlobUrls() {
  for (const url of blobCache.values()) {
    URL.revokeObjectURL(url);
  }
  blobCache.clear();
}
