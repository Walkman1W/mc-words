import { getCategories } from './categories.js';
import { getCardsForCategory } from './cardData.js';
import { getCompletedCards } from './progress.js';
import { getCategoryTime, getLeaderboard } from './timer.js';

const RANKS = [
  { level: 0, name: 'Unranked', icon: '📦', minCategories: 0 },
  { level: 1, name: 'Wood', icon: '🪵', minCategories: 1 },
  { level: 2, name: 'Stone', icon: '🪨', minCategories: 2 },
  { level: 3, name: 'Iron', icon: '⛓️', minCategories: 4 },
  { level: 4, name: 'Gold', icon: '🥇', minCategories: 6 },
  { level: 5, name: 'Diamond', icon: '💎', minCategories: 8 },
  { level: 6, name: 'Netherite', icon: '🏆', minCategories: 8, requireAllThreeStar: true },
];

let currentUsername = null;

export function initRank(username) {
  currentUsername = username;
}

export function isCategoryCompleted(categoryId) {
  const cards = getCardsForCategory(categoryId);
  if (cards.length === 0) return false;
  const completed = getCompletedCards(categoryId);
  for (let i = 0; i < cards.length; i++) {
    if (!completed.includes(i)) return false;
  }
  return true;
}

export function getCategoryStars(categoryId) {
  if (!isCategoryCompleted(categoryId)) return 0;
  const playerTime = getCategoryTime(categoryId);
  if (!playerTime) return 0;

  const leaderboard = getLeaderboard(categoryId);
  const npcEntries = leaderboard.filter(e => !e.isLocal);
  const thirdPlace = npcEntries[2] ? npcEntries[2].time : Infinity;
  const sixthPlace = npcEntries[5] ? npcEntries[5].time : Infinity;

  if (playerTime <= thirdPlace) return 3;
  if (playerTime <= sixthPlace) return 2;
  return 1;
}

export function getRankInfo() {
  const categories = getCategories();
  let completedCount = 0;
  const stars = {};
  let totalStars = 0;

  for (const cat of categories) {
    const completed = isCategoryCompleted(cat.id);
    if (completed) {
      completedCount++;
      const s = getCategoryStars(cat.id);
      stars[cat.id] = s;
      totalStars += s;
    } else {
      stars[cat.id] = 0;
    }
  }

  let rank = RANKS[0];
  for (let i = RANKS.length - 1; i >= 0; i--) {
    const r = RANKS[i];
    if (r.requireAllThreeStar) {
      const avgStars = completedCount > 0 ? totalStars / completedCount : 0;
      if (completedCount >= r.minCategories && avgStars >= 3) {
        rank = r;
        break;
      }
    } else {
      if (completedCount >= r.minCategories) {
        rank = r;
        break;
      }
    }
  }

  const score = completedCount * 100 + totalStars * 50;

  return {
    level: rank.level,
    name: rank.name,
    icon: rank.icon,
    score,
    completedCategories: completedCount,
    totalCategories: categories.length,
    stars,
    totalStars,
  };
}
