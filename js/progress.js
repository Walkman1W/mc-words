let config = null;
let progressData = {};
let favoritesData = {};
let currentUsername = null;

export async function loadConfig() {
  const res = await fetch('config.json');
  config = await res.json();
  return config;
}

export function getConfig() {
  return config;
}

export function initProgress(username) {
  currentUsername = username;
  const key = `mc-progress-${username}`;
  const saved = localStorage.getItem(key);
  if (saved) progressData = JSON.parse(saved);
  else progressData = {};

  const favKey = `mc-favorites-${username}`;
  const favSaved = localStorage.getItem(favKey);
  if (favSaved) favoritesData = JSON.parse(favSaved);
  else favoritesData = {};
}

function saveProgress() {
  if (!currentUsername) return;
  localStorage.setItem(`mc-progress-${currentUsername}`, JSON.stringify(progressData));
}

export function isCardUnlocked(categoryId, cardIndex) {
  if (cardIndex === 0) return true;
  const catProgress = progressData[categoryId] || [];
  return catProgress.includes(cardIndex);
}

export function unlockNextCard(categoryId, currentIndex) {
  if (!progressData[categoryId]) progressData[categoryId] = [];
  const nextIndex = currentIndex + 1;
  if (!progressData[categoryId].includes(nextIndex)) {
    progressData[categoryId].push(nextIndex);
  }
  if (!progressData[categoryId].includes(currentIndex)) {
    progressData[categoryId].push(currentIndex);
  }
  saveProgress();
}

export function markCardCompleted(categoryId, cardIndex) {
  if (!progressData[categoryId]) progressData[categoryId] = [];
  if (!progressData[categoryId].includes(cardIndex)) {
    progressData[categoryId].push(cardIndex);
  }
  unlockNextCard(categoryId, cardIndex);
}

export function getCompletedCards(categoryId) {
  return progressData[categoryId] || [];
}

function saveFavorites() {
  if (!currentUsername) return;
  localStorage.setItem(`mc-favorites-${currentUsername}`, JSON.stringify(favoritesData));
}

export function toggleFavorite(categoryId, cardId) {
  if (!favoritesData[categoryId]) favoritesData[categoryId] = [];
  const idx = favoritesData[categoryId].indexOf(cardId);
  if (idx >= 0) {
    favoritesData[categoryId].splice(idx, 1);
  } else {
    favoritesData[categoryId].push(cardId);
  }
  saveFavorites();
}

export function isFavorited(categoryId, cardId) {
  return (favoritesData[categoryId] || []).includes(cardId);
}

export function getFavorites() {
  return favoritesData;
}
