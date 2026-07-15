/**
 * 更新 manifest.json 中的 B站 BV号
 *
 * 用法:
 *   node update-bvid.js                    # 交互式添加BV号
 *   node update-bvid.js --csv bvid.csv     # 从CSV文件批量导入
 *   node update-bvid.js --set 001 BV1xx    # 设置单个视频的BV号
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const MANIFEST_PATH = path.join(__dirname, 'assets', 'videos', 'manifest.json');

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

// 设置单个BV号
function setBvid(manifest, id, bvid) {
  const video = manifest.videos.find(v => v.id === id);
  if (!video) {
    console.error(`未找到视频 ID: ${id}`);
    return false;
  }
  video.bvid = bvid;
  console.log(`已更新: ${id} - ${video.cardName || video.title} -> ${bvid}`);
  return true;
}

// 从CSV导入 (格式: id,bvid 或 title,bvid)
function importCsv(manifest, csvPath) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  let updated = 0;

  for (const line of lines) {
    const [idOrTitle, bvid] = line.split(',').map(s => s.trim().replace(/"/g, ''));
    if (!bvid) continue;

    // 尝试按ID匹配
    let video = manifest.videos.find(v => v.id === idOrTitle);
    // 尝试按标题匹配
    if (!video) video = manifest.videos.find(v => v.title === idOrTitle);
    // 尝试按卡片名匹配
    if (!video) video = manifest.videos.find(v => v.cardName === idOrTitle);

    if (video) {
      video.bvid = bvid;
      updated++;
    } else {
      console.warn(`未找到匹配: ${idOrTitle}`);
    }
  }

  console.log(`\n从CSV导入完成，更新了 ${updated} 个视频`);
}

// 交互式添加
async function interactiveAdd(manifest) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (q) => new Promise(resolve => rl.question(q, resolve));

  console.log('\n=== 交互式添加BV号 ===');
  console.log('输入视频ID和BV号，格式: 001 BV1xx411x7xx');
  console.log('输入 q 退出\n');

  // 显示没有BV号的视频
  const noBvid = manifest.videos.filter(v => !v.bvid);
  console.log(`还有 ${noBvid.length} 个视频没有BV号:\n`);
  noBvid.slice(0, 10).forEach(v => {
    console.log(`  ${v.id} - ${v.cardName || v.title}`);
  });
  if (noBvid.length > 10) console.log(`  ... 还有 ${noBvid.length - 10} 个`);
  console.log();

  while (true) {
    const input = await question('输入 (id bvid): ');
    if (input.toLowerCase() === 'q') break;

    const parts = input.trim().split(/\s+/);
    if (parts.length !== 2) {
      console.log('格式错误，请输入: 001 BV1xx411x7xx');
      continue;
    }

    const [id, bvid] = parts;
    setBvid(manifest, id, bvid);
    saveManifest(manifest);
  }

  rl.close();
}

// 显示统计
function showStats(manifest) {
  const total = manifest.videos.length;
  const withBvid = manifest.videos.filter(v => v.bvid).length;
  const noBvid = total - withBvid;

  console.log('\n=== 视频统计 ===');
  console.log(`总计: ${total} 个视频`);
  console.log(`已有BV号: ${withBvid} 个`);
  console.log(`待上传: ${noBvid} 个`);

  if (noBvid > 0) {
    console.log('\n待上传视频 (按分类):');
    const byCategory = {};
    manifest.videos.filter(v => !v.bvid).forEach(v => {
      if (!byCategory[v.category]) byCategory[v.category] = [];
      byCategory[v.category].push(v);
    });
    for (const [cat, videos] of Object.entries(byCategory)) {
      console.log(`  ${cat}: ${videos.length} 个`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const manifest = loadManifest();

  if (args[0] === '--csv' && args[1]) {
    importCsv(manifest, args[1]);
    saveManifest(manifest);
  } else if (args[0] === '--set' && args[1] && args[2]) {
    setBvid(manifest, args[1], args[2]);
    saveManifest(manifest);
  } else if (args[0] === '--stats') {
    showStats(manifest);
  } else {
    showStats(manifest);
    await interactiveAdd(manifest);
  }
}

main().catch(console.error);
