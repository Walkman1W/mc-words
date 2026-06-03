import { getUsers } from './auth.js';

let categoryTimes = {};
let cardRecords = {};
let cardTimerInterval = null;
let cardStartTime = null;
let currentCardId = null;
let currentCategoryForTimer = null;
let autoRevealTimeout = null;
let currentTimeLimit = 15;
let currentUsername = null;

const LEADERBOARD_DATA = {
  '01-block': [
    { name: 'SteveBuilder', time: 42300 },
    { name: 'PixelMiner', time: 55800 },
    { name: 'CreeperKing', time: 61200 },
    { name: 'DiamondDave', time: 72500 },
    { name: 'RedstonePro', time: 85100 },
    { name: 'NetherWalker', time: 93400 },
    { name: 'EnderHero', time: 108200 },
    { name: 'BlockMaster', time: 115600 },
    { name: 'CraftQueen', time: 128900 },
    { name: 'IronGolem99', time: 142300 },
  ],
  '02-tool': [
    { name: 'ToolSmith', time: 18500 },
    { name: 'SteveBuilder', time: 22100 },
    { name: 'DiamondDave', time: 25800 },
    { name: 'CraftQueen', time: 29400 },
    { name: 'PixelMiner', time: 33600 },
    { name: 'RedstonePro', time: 37200 },
    { name: 'NetherWalker', time: 41800 },
    { name: 'EnderHero', time: 46500 },
    { name: 'BlockMaster', time: 52100 },
    { name: 'IronGolem99', time: 58900 },
  ],
  '03-weapon': [
    { name: 'SwordMaster', time: 16200 },
    { name: 'BowSniper', time: 19800 },
    { name: 'CreeperKing', time: 24300 },
    { name: 'SteveBuilder', time: 28100 },
    { name: 'DiamondDave', time: 31700 },
    { name: 'PixelMiner', time: 36400 },
    { name: 'RedstonePro', time: 40200 },
    { name: 'EnderHero', time: 45600 },
    { name: 'CraftQueen', time: 51300 },
    { name: 'NetherWalker', time: 57800 },
  ],
  '04-food': [
    { name: 'FarmKing', time: 15800 },
    { name: 'SteveBuilder', time: 20200 },
    { name: 'CraftQueen', time: 24600 },
    { name: 'DiamondDave', time: 28900 },
    { name: 'PixelMiner', time: 33100 },
    { name: 'NetherWalker', time: 37800 },
    { name: 'RedstonePro', time: 42400 },
    { name: 'EnderHero', time: 47200 },
    { name: 'BlockMaster', time: 53600 },
    { name: 'IronGolem99', time: 59100 },
  ],
  '05-ore': [
    { name: 'DiamondDave', time: 14200 },
    { name: 'MineKing', time: 18600 },
    { name: 'SteveBuilder', time: 22400 },
    { name: 'PixelMiner', time: 26800 },
    { name: 'CreeperKing', time: 31500 },
    { name: 'RedstonePro', time: 35200 },
    { name: 'CraftQueen', time: 39800 },
    { name: 'EnderHero', time: 44600 },
    { name: 'NetherWalker', time: 50100 },
    { name: 'BlockMaster', time: 56300 },
  ],
  '06-armor': [
    { name: 'IronGolem99', time: 17100 },
    { name: 'SteveBuilder', time: 21500 },
    { name: 'DiamondDave', time: 25200 },
    { name: 'CreeperKing', time: 29800 },
    { name: 'PixelMiner', time: 34100 },
    { name: 'CraftQueen', time: 38700 },
    { name: 'RedstonePro', time: 43200 },
    { name: 'EnderHero', time: 48600 },
    { name: 'NetherWalker', time: 53400 },
    { name: 'BlockMaster', time: 59200 },
  ],
  '07-redstone': [
    { name: 'RedstonePro', time: 13500 },
    { name: 'MumboJumbo', time: 17200 },
    { name: 'SteveBuilder', time: 21800 },
    { name: 'DiamondDave', time: 26400 },
    { name: 'CreeperKing', time: 30100 },
    { name: 'PixelMiner', time: 34800 },
    { name: 'EnderHero', time: 39500 },
    { name: 'CraftQueen', time: 44200 },
    { name: 'NetherWalker', time: 49800 },
    { name: 'BlockMaster', time: 55100 },
  ],
  '08-spawn-egg': [
    { name: 'MobHunter', time: 15100 },
    { name: 'CreeperKing', time: 19600 },
    { name: 'SteveBuilder', time: 23400 },
    { name: 'EnderHero', time: 27800 },
    { name: 'DiamondDave', time: 32500 },
    { name: 'PixelMiner', time: 36900 },
    { name: 'RedstonePro', time: 41200 },
    { name: 'CraftQueen', time: 46800 },
    { name: 'NetherWalker', time: 51400 },
    { name: 'BlockMaster', time: 57600 },
  ],
};

export function initTimer(username) {
  currentUsername = username;
  const timesKey = `mc-category-times-${username}`;
  const recordsKey = `mc-card-records-${username}`;
  const saved = localStorage.getItem(timesKey);
  if (saved) categoryTimes = JSON.parse(saved);
  else categoryTimes = {};
  const savedRecords = localStorage.getItem(recordsKey);
  if (savedRecords) cardRecords = JSON.parse(savedRecords);
  else cardRecords = {};
}

export function startCardTimer(cardId, categoryId, timeLimit) {
  stopCardTimer();
  currentCardId = cardId;
  currentCategoryForTimer = categoryId;
  currentTimeLimit = timeLimit || 15;
  cardStartTime = Date.now();

  updateCardTimerDisplay(0);

  cardTimerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - cardStartTime) / 1000);
    updateCardTimerDisplay(elapsed);
  }, 100);

  autoRevealTimeout = setTimeout(() => {
    onCardTimeout();
  }, currentTimeLimit * 1000);
}

export function stopCardTimer() {
  if (cardTimerInterval) {
    clearInterval(cardTimerInterval);
    cardTimerInterval = null;
  }
  if (autoRevealTimeout) {
    clearTimeout(autoRevealTimeout);
    autoRevealTimeout = null;
  }
}

export function recordCardTime(cardId, categoryId, wasAutoRevealed) {
  stopCardTimer();
  const elapsed = cardStartTime ? Date.now() - cardStartTime : 0;

  if (!cardRecords[categoryId]) cardRecords[categoryId] = {};
  cardRecords[categoryId][cardId] = {
    time: elapsed,
    autoRevealed: wasAutoRevealed,
  };

  if (!categoryTimes[categoryId]) categoryTimes[categoryId] = 0;
  categoryTimes[categoryId] += elapsed;

  if (currentUsername) {
    localStorage.setItem(`mc-category-times-${currentUsername}`, JSON.stringify(categoryTimes));
    localStorage.setItem(`mc-card-records-${currentUsername}`, JSON.stringify(cardRecords));
  }

  return elapsed;
}

export function getCategoryTime(categoryId) {
  return categoryTimes[categoryId] || 0;
}

export function getCategoryTimes() {
  return { ...categoryTimes };
}

export function getLeaderboard(categoryId) {
  const npcEntries = (LEADERBOARD_DATA[categoryId] || []).map(e => ({ ...e, isLocal: false }));
  const localEntries = getLocalUsersEntries(categoryId);
  const all = [...npcEntries, ...localEntries];
  all.sort((a, b) => a.time - b.time);
  return all;
}

function getLocalUsersEntries(categoryId) {
  const users = getUsers();
  const entries = [];
  for (const username of users) {
    const timesKey = `mc-category-times-${username}`;
    const saved = localStorage.getItem(timesKey);
    if (!saved) continue;
    const times = JSON.parse(saved);
    if (times[categoryId]) {
      entries.push({
        name: username,
        time: times[categoryId],
        isLocal: true,
        isCurrent: username === currentUsername,
      });
    }
  }
  return entries;
}

export function getPlayerRank(categoryId) {
  const playerTime = categoryTimes[categoryId];
  if (!playerTime) return null;
  const leaderboard = getLeaderboard(categoryId);
  const idx = leaderboard.findIndex(e => e.isLocal && e.isCurrent);
  if (idx === -1) return { rank: leaderboard.length + 1, time: playerTime };
  return { rank: idx + 1, time: playerTime };
}

export function isAutoRevealTriggered() {
  return autoRevealTimeout === null && cardTimerInterval === null && cardStartTime !== null;
}

function onCardTimeout() {
  stopCardTimer();
  const event = new CustomEvent('card-timeout', {
    detail: { cardId: currentCardId, categoryId: currentCategoryForTimer }
  });
  document.dispatchEvent(event);
}

function updateCardTimerDisplay(seconds) {
  const el = document.getElementById('card-timer-display');
  if (!el) return;
  const remaining = Math.max(0, currentTimeLimit - seconds);
  el.textContent = remaining + 's';
  if (remaining <= 5) {
    el.classList.add('timer-warning');
  } else {
    el.classList.remove('timer-warning');
  }
}

export function formatTimeMs(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 10);
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${seconds}.${String(milliseconds).padStart(2, '0')}s`;
}
