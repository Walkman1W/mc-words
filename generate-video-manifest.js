/**
 * 从本地视频文件夹生成 videos/manifest.json
 * 扫描 E:\mc-cards-vedio\01-08 目录结构，映射视频编号到卡片名称
 *
 * 用法: node generate-video-manifest.js
 */

const fs = require('fs');
const path = require('path');

const VIDEO_ROOT = 'E:\\mc-cards-vedio\\01-08';
const CARDS_ROOT = path.join(__dirname, 'assets', 'images', 'cards');

// 视频分类目录 -> 显示名称映射
const VIDEO_CATEGORIES = {
  '01-block': { id: 'block', label: '方块 Block' },
  '02-tool': { id: 'tool', label: '工具 Tool' },
  '03-weapon': { id: 'weapon', label: '武器 Weapon' },
  '04-food': { id: 'food', label: '食物 Food' },
  '05-ore': { id: 'ore', label: '矿石 Ore' },
  '06-redstone': { id: 'redstone', label: '红石 Redstone' },
  '07-animal': { id: 'animal', label: '动物 Animal' },
  '08-monster': { id: 'monster', label: '怪物 Monster' }
};

// 从卡片图片目录读取编号->名称映射
function loadCardNameMap(categoryDir) {
  const map = {};
  const cardsDir = path.join(CARDS_ROOT, categoryDir);
  if (!fs.existsSync(cardsDir)) return map;

  const files = fs.readdirSync(cardsDir).filter(f => f.endsWith('.png'));
  for (const file of files) {
    const match = file.match(/^(\d+)-(.+)\.png$/);
    if (match) {
      const num = parseInt(match[1], 10);
      // 保留真实文件名，避免名称含空格等字符时拼错路径
      map[num] = { name: match[2].trim(), file };
    }
  }
  return map;
}

// 显式映射：视频目录 -> 卡片目录
const VIDEO_TO_CARDS_MAP = {
  '01-block': '01-block',
  '02-tool': '02-tool',
  '03-weapon': '03-weapon',
  '04-food': '04-food',
  '05-ore': '05-ore',
  '06-redstone': '06-armor',
  '07-animal': '07-animal',
  '08-monster': '08-monster'
};

// 找到对应的卡片分类目录
function findCardsCategoryDir(videoDirName) {
  const mapped = VIDEO_TO_CARDS_MAP[videoDirName];
  if (mapped && fs.existsSync(path.join(CARDS_ROOT, mapped))) {
    return mapped;
  }
  // 降级：直接匹配
  if (fs.existsSync(path.join(CARDS_ROOT, videoDirName))) {
    return videoDirName;
  }
  return null;
}

// 扫描视频目录
function scanVideoDir(dirPath) {
  const videos = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  // 检查是否有子目录结构（如 01-block/001/001.mp4）
  const subdirs = entries.filter(e => e.isDirectory());
  const mp4Files = entries.filter(e => e.isFile() && e.name.endsWith('.mp4'));

  if (subdirs.length > 0) {
    // 有子目录，递归扫描
    for (const subdir of subdirs.sort((a, b) => a.name.localeCompare(b.name))) {
      const subdirPath = path.join(dirPath, subdir.name);
      const files = fs.readdirSync(subdirPath).filter(f => f.endsWith('.mp4'));
      for (const file of files) {
        const num = parseInt(file.replace('.mp4', ''), 10);
        if (!isNaN(num)) {
          videos.push({
            num,
            file: path.join(subdirPath, file),
            dirName: subdir.name
          });
        }
      }
    }
  } else {
    // 扁平结构（如 02-tool/001.mp4）
    for (const file of mp4Files.sort((a, b) => a.name.localeCompare(b.name))) {
      const num = parseInt(file.name.replace('.mp4', ''), 10);
      if (!isNaN(num)) {
        videos.push({
          num,
          file: path.join(dirPath, file.name),
          dirName: null
        });
      }
    }
  }

  return videos.sort((a, b) => a.num - b.num);
}

function main() {
  console.log('=== 视频Manifest生成工具 ===\n');

  const allVideos = [];
  const usedCategories = [];

  // 遍历视频分类目录
  const videoDirs = fs.readdirSync(VIDEO_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const videoDir of videoDirs) {
    const catInfo = VIDEO_CATEGORIES[videoDir.name];
    if (!catInfo) {
      console.log(`跳过未知分类: ${videoDir.name}`);
      continue;
    }

    const videoDirPath = path.join(VIDEO_ROOT, videoDir.name);
    const videos = scanVideoDir(videoDirPath);

    if (videos.length === 0) {
      console.log(`${videoDir.name}: 无视频文件`);
      continue;
    }

    // 加载卡片名称映射
    const cardsDir = findCardsCategoryDir(videoDir.name);
    const nameMap = cardsDir ? loadCardNameMap(cardsDir) : {};

    console.log(`${videoDir.name} (${catInfo.label}): ${videos.length} 个视频`);

    for (const v of videos) {
      const card = nameMap[v.num];
      const cardName = card ? card.name : `Video ${v.num}`;
      // 使用视频缩略图路径，避免服务器防盗链问题
      const thumbnailPath = `assets/videos/thumbnails/${String(allVideos.length + 1).padStart(3, '0')}.jpg`;
      allVideos.push({
        id: String(allVideos.length + 1).padStart(3, '0'),
        bvid: '', // 待上传B站后填入
        title: `${cardName} - Minecraft英语单词`,
        description: `学习Minecraft中${cardName}的英语表达`,
        thumbnail: thumbnailPath,
        duration: '',
        category: catInfo.id,
        cardName: cardName,
        videoNum: v.num
      });
    }

    usedCategories.push(catInfo);
  }

  // 构建分类列表
  const categories = [
    { id: 'all', label: '全部' },
    ...usedCategories
  ];

  const manifest = {
    videos: allVideos,
    categories: categories
  };

  const manifestPath = path.join(__dirname, 'assets', 'videos', 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`\n=== 完成 ===`);
  console.log(`共 ${allVideos.length} 个视频`);
  console.log(`分类: ${categories.map(c => c.label).join(', ')}`);
  console.log(`已保存到: ${manifestPath}`);
  console.log(`\n注意: BV号为空，上传B站后需要更新manifest.json中的bvid字段`);
}

main();
