// bilibili-verify.js — 主页 160 个稿件核对脚本
// 用法: node bilibili-verify.js [--no-fetch] [--no-covers]
//  1) 拉取空间全部投稿（bilibili-fetch-videos.js）
//  2) 数量 + 标题键（分类|课号|单词）与 assets/videos/manifest.json 比对
//  3) 下载全部封面到 verify-covers/，调 verify-sheets.py 拼 8 张 contact sheet 到 verify-sheets/
//  4) 读 sheet 图核对「游戏释义」单词与标题是否一致（人工或 AI 读图）
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJ = __dirname;
const CN = { block: '方块', tool: '工具', weapon: '武器', food: '食物', ore: '矿石', redstone: '红石', animal: '动物', monster: '怪物' };
const EN = Object.fromEntries(Object.entries(CN).map(([k, v]) => [v, k]));
const args = process.argv.slice(2);
const noFetch = args.includes('--no-fetch');
const noCovers = args.includes('--no-covers');

// 解析线上标题 -> {cat,num,word}；兼容 - 和 ｜ 分隔、词尾中文（如 "Block 方块"）
function parseTitle(t) {
  const m = t.match(/单词卡[-｜](.{1,3}?)类第(\d{3})课[-｜](.+)$/);
  if (!m) return null;
  return { cat: EN[m[1]], num: m[2], word: m[3].replace(/\s+[一-鿿].*$/, '') };
}

(async () => {
  // 1) 拉列表
  if (!noFetch) execSync('node bilibili-fetch-videos.js', { cwd: PROJ, stdio: 'inherit' });
  const list = JSON.parse(fs.readFileSync(path.join(PROJ, 'bilibili-video-list.json'), 'utf-8'));
  const man = JSON.parse(fs.readFileSync(path.join(PROJ, 'assets', 'videos', 'manifest.json'), 'utf-8')).videos;

  // 2) 数量 + 标题键比对
  console.log(`\n=== 数量 ===\n线上: ${list.length}  manifest: ${man.length}`);
  const exp = new Map();
  for (const m of man) exp.set(`${m.category}|${String(m.videoNum).padStart(3, '0')}|${m.cardName}`, m);
  const online = new Map();
  let dupWarn = 0;
  for (const v of list) {
    const p = parseTitle(v.title);
    if (!p) { console.log('无法解析标题:', v.bvid, v.title); continue; }
    const key = `${p.cat}|${p.num}|${p.word}`;
    if (online.has(key)) { console.log('⚠ 重复稿件:', key, online.get(key).bvid, '与', v.bvid); dupWarn++; }
    online.set(key, { ...p, ...v });
  }
  let ok = 0;
  const missing = [], extra = [];
  for (const k of exp.keys()) { if (online.has(k)) ok++; else missing.push(k); }
  for (const k of online.keys()) { if (!exp.has(k)) extra.push(k); }
  console.log(`=== 标题键比对 ===\n匹配: ${ok}/${exp.size}  线上缺: ${missing.length}  线上多出: ${extra.length}  重复: ${dupWarn}`);
  missing.forEach(k => console.log('  缺:', k));
  extra.forEach(k => console.log('  多出:', k, online.get(k).bvid));

  // 3) 下载封面 + 拼图
  if (!noCovers) {
    const outDir = path.join(PROJ, 'verify-covers');
    fs.mkdirSync(outDir, { recursive: true });
    const items = [...online.values()].sort((a, b) => a.cat.localeCompare(b.cat) || a.num.localeCompare(b.num));
    for (const it of items) {
      const f = path.join(outDir, `${it.cat}-${it.num}.jpg`);
      if (!fs.existsSync(f) || fs.statSync(f).size < 5000) {
        execSync(`curl -s -e "https://www.bilibili.com" -o "${f}" "${it.pic.replace(/^http:/, 'https:')}"`);
      }
      if (fs.statSync(f).size < 5000) console.log('下载异常(太小):', f);
    }
    // 期望单词表，读图时对照
    fs.writeFileSync(path.join(outDir, 'expected.json'),
      JSON.stringify(items.map(i => `${i.cat}-${i.num}: ${i.word}`), null, 1));
    console.log(`\n=== 封面 ===\n已下载 ${items.length} 张到 verify-covers/`);
    execSync('python verify-sheets.py', { cwd: PROJ, stdio: 'inherit' });
    console.log('拼图完成: verify-sheets/<分类>.jpg（每格带课号角标，按 001-020 从左到右、从上到下排列）');
    console.log('请读图核对每格「游戏释义」的单词与 expected.json 是否一致');
  }

  console.log('\n=== 完成 ===');
})();
