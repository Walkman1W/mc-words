let CARD_DATA = {};
let loaded = false;
let loadPromise = null;

// 运行时从 manifest.json 加载卡片数据
// manifest 由 generate-manifest.js 扫描图片目录自动生成
// 图片文件名格式: 001-Word Name.png / .jpg
// 只有符合此格式的文件才会被识别
export function loadCardData() {
  if (loadPromise) return loadPromise;
  loadPromise = fetch('assets/images/cards/manifest.json')
    .then(res => {
      if (!res.ok) throw new Error('manifest.json not found');
      return res.json();
    })
    .then(data => {
      CARD_DATA = data;
      loaded = true;
    })
    .catch(err => {
      console.warn('Failed to load manifest.json:', err.message);
      CARD_DATA = {};
      loaded = true;
    });
  return loadPromise;
}

export function getCardsForCategory(categoryId) {
  return CARD_DATA[categoryId] || [];
}

export function getCardImagePath(categoryId, imageName) {
  return `assets/images/cards/${categoryId}/${encodeURIComponent(imageName)}`;
}
