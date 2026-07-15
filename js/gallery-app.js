import { loadCardData } from './cardData.js';
import { initGallery, renderCards, renderRankBadge } from './gallery.js';
import { initGame } from './game.js';
import { initTimer } from './timer.js';
import { loadConfig, initProgress } from './progress.js';
import { initAuth, getCurrentUser, logout } from './auth.js';
import { initRank } from './rank.js';
import { initImageProtection } from './image-protect.js';

document.addEventListener('DOMContentLoaded', async () => {
  initAuth();
  const username = getCurrentUser();
  if (!username) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('user-display').textContent = username;
  document.getElementById('btn-logout').addEventListener('click', () => {
    logout();
    window.location.href = 'index.html';
  });

  await loadConfig();
  await loadCardData();
  initProgress(username);
  initTimer(username);
  initRank(username);
  initGallery();
  initGame();
  initImageProtection();

  document.addEventListener('card-completed', () => {
    renderCards();
    renderRankBadge();
  });
});
