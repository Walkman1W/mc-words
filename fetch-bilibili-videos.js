/**
 * B站视频批量获取脚本
 * 从B站UP主空间获取所有视频，生成 manifest.json
 *
 * 用法: node fetch-bilibili-videos.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const MID = '422489691'; // UP主ID
const PAGE_SIZE = 50;

// B站API请求头
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://space.bilibili.com/',
  'Origin': 'https://space.bilibili.com'
};

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: HEADERS
    };
    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON parse error: ${data.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// 获取WBI签名所需密钥
async function getWbiKeys() {
  const data = await httpsGet('https://api.bilibili.com/x/web-interface/nav');
  // code=-101 表示未登录，但 wbi_img 数据仍然可用
  if (data.data?.wbi_img) {
    const imgUrl = data.data.wbi_img.img_url;
    const subUrl = data.data.wbi_img.sub_url;
    return {
      imgKey: imgUrl.split('/').pop().split('.')[0],
      subKey: subUrl.split('/').pop().split('.')[0]
    };
  }
  console.log('无法获取WBI密钥');
  return null;
}

// WBI签名混合表
const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35,
  27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13,
  37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4,
  22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52
];

function getMixinKey(orig) {
  return MIXIN_KEY_ENC_TAB.map(n => orig[n]).join('').slice(0, 32);
}

function md5(str) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(str).digest('hex');
}

function encWbi(params, imgKey, subKey) {
  const mixinKey = getMixinKey(imgKey + subKey);
  const currTime = Math.round(Date.now() / 1000);
  params.wts = currTime;

  // 按key排序
  const query = Object.keys(params).sort().map(key => {
    const val = String(params[key]).replace(/[!'()*]/g, '');
    return `${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
  }).join('&');

  const wbiSign = md5(query + mixinKey);
  return query + '&w_rid=' + wbiSign;
}

// 获取单页视频列表
async function fetchVideoPage(page, wbiKeys) {
  const params = {
    mid: MID,
    ps: PAGE_SIZE,
    pn: page,
    order: 'pubdate',
    keyword: '',
    tid: 0
  };

  let url;
  if (wbiKeys) {
    const query = encWbi(params, wbiKeys.imgKey, wbiKeys.subKey);
    url = `https://api.bilibili.com/x/space/wbi/arc/search?${query}`;
  } else {
    // 降级尝试
    const qs = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
    url = `https://api.bilibili.com/x/space/arc/search?${qs}`;
  }

  return httpsGet(url);
}

// 根据视频标题自动分类
function categorizeVideo(title) {
  const t = title.toLowerCase();
  if (/单词|word|spell|拼写|词汇/.test(t)) return 'vocabulary';
  if (/句子|sentence|语法|grammar/.test(t)) return 'grammar';
  if (/对话|dialog|conversation|口语|speak/.test(t)) return 'conversation';
  if (/听力|listen|发音|pronunciat/.test(t)) return 'listening';
  if (/阅读|read|故事|story/.test(t)) return 'reading';
  if (/写作|write|作文/.test(t)) return 'writing';
  if (/游戏|game|minecraft|我的世界|生存|build/.test(t)) return 'gameplay';
  if (/教程|tutorial|教|学|learn|how/.test(t)) return 'tutorial';
  if (/测评|review|测试|test/.test(t)) return 'review';
  return 'tutorial'; // 默认分类
}

// 格式化时长 (秒 -> mm:ss)
function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

async function main() {
  console.log('=== B站视频批量获取工具 ===');
  console.log(`UP主ID: ${MID}`);
  console.log();

  // 1. 获取WBI密钥
  console.log('正在获取WBI签名密钥...');
  let wbiKeys = null;
  try {
    wbiKeys = await getWbiKeys();
    if (wbiKeys) {
      console.log('WBI密钥获取成功');
    }
  } catch (e) {
    console.log('WBI密钥获取失败，将尝试直接请求:', e.message);
  }

  // 2. 获取所有视频
  const allVideos = [];
  let page = 1;
  let total = Infinity;

  while ((page - 1) * PAGE_SIZE < total) {
    console.log(`正在获取第 ${page} 页...`);
    try {
      const result = await fetchVideoPage(page, wbiKeys);

      if (result.code !== 0) {
        console.error(`API错误: code=${result.code}, message=${result.message}`);
        if (page === 1) {
          console.error('\n获取失败。可能原因:');
          console.error('1. B站API需要登录或签名验证');
          console.error('2. 请求过于频繁');
          console.error('3. UP主ID不正确');
          console.error('\n请手动在浏览器中访问以下地址获取视频数据:');
          console.error(`https://api.bilibili.com/x/space/wbi/arc/search?mid=${MID}&ps=50&pn=1`);
          console.error('\n或者手动编辑 assets/videos/manifest.json 添加视频数据');
          process.exit(1);
        }
        break;
      }

      const data = result.data;
      total = data.page?.count || 0;
      const vlist = data.list?.vlist || [];

      console.log(`  找到 ${vlist.length} 个视频 (总计: ${total})`);

      for (const v of vlist) {
        allVideos.push({
          id: String(allVideos.length + 1).padStart(3, '0'),
          bvid: v.bvid,
          title: v.title,
          description: v.description || '',
          thumbnail: v.pic?.replace('http:', 'https:') || '',
          duration: formatDuration(v.length ? parseDurationStr(v.length) : v.duration),
          category: categorizeVideo(v.title),
          created: v.created
        });
      }

      page++;
      // 避免请求太快
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      console.error(`第 ${page} 页获取失败:`, e.message);
      break;
    }
  }

  if (allVideos.length === 0) {
    console.log('\n未获取到视频。请检查网络连接或UP主ID。');
    process.exit(1);
  }

  // 3. 按发布时间倒序排列（最新的在前）
  allVideos.sort((a, b) => (b.created || 0) - (a.created || 0));

  // 重新编号
  allVideos.forEach((v, i) => {
    v.id = String(i + 1).padStart(3, '0');
  });

  // 4. 收集实际存在的分类
  const usedCategories = new Set(allVideos.map(v => v.category));
  const categories = [
    { id: 'all', label: '全部' },
    { id: 'vocabulary', label: '单词' },
    { id: 'grammar', label: '语法' },
    { id: 'conversation', label: '对话' },
    { id: 'listening', label: '听力' },
    { id: 'reading', label: '阅读' },
    { id: 'gameplay', label: '游戏' },
    { id: 'tutorial', label: '教程' },
    { id: 'review', label: '测评' }
  ].filter(c => c.id === 'all' || usedCategories.has(c.id));

  // 5. 生成manifest
  const manifest = { videos: allVideos, categories };

  const manifestPath = path.join(__dirname, 'assets', 'videos', 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`\n=== 完成 ===`);
  console.log(`共获取 ${allVideos.length} 个视频`);
  console.log(`分类: ${categories.map(c => c.label).join(', ')}`);
  console.log(`已保存到: ${manifestPath}`);
}

// 解析 "5:30" 格式的时长字符串为秒数
function parseDurationStr(str) {
  if (!str) return 0;
  const parts = String(str).split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

main().catch(err => {
  console.error('脚本执行出错:', err);
  process.exit(1);
});
