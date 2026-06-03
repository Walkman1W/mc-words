import { loadCardData } from './cardData.js';
import { initGallery, renderCards } from './gallery.js';
import { initGame } from './game.js';
import { initTimer } from './timer.js';
import { loadConfig, initProgress } from './progress.js';
import { initAuth, getCurrentUser, logout } from './auth.js';

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
  initGallery();
  initGame();

  document.addEventListener('card-completed', () => {
    renderCards();
  });
});
