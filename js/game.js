import { getCardImagePath } from './cardData.js';
import { startCardTimer, stopCardTimer, recordCardTime, formatTimeMs, getCardTime } from './timer.js';
import { markCardCompleted, getConfig, toggleFavorite, isFavorited } from './progress.js';

let currentCard = null;
let currentCategoryId = null;
let currentCardIndex = null;
let attempts = 0;
let targetWord = '';
let isSuccess = false;
const MAX_ATTEMPTS = 3;

let poolController = null;
let dropController = null;

export function initGame() {
  document.getElementById('btn-close-modal').addEventListener('click', closeGame);
  document.getElementById('btn-back-gallery').addEventListener('click', onBackClick);
  document.getElementById('btn-favorite').addEventListener('click', onFavoriteClick);
  document.getElementById('btn-retry').addEventListener('click', onRetryClick);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('game-modal');
      if (!modal.classList.contains('hidden')) {
        closeGame();
      }
    }
  });

  document.addEventListener('card-timeout', () => {
    onTimeout();
  });
}

export function openGame(card, categoryId, cardIndex) {
  currentCard = card;
  currentCategoryId = categoryId;
  currentCardIndex = cardIndex;
  attempts = 0;
  isSuccess = false;
  targetWord = card.word.replace(/\s+/g, '').toLowerCase();

  const config = getConfig();
  const timeLimit = targetWord.length * config.timer.secondsPerLetter;

  const modal = document.getElementById('game-modal');
  const gameArea = document.getElementById('game-area');
  const gameResult = document.getElementById('game-result');

  modal.classList.remove('hidden');
  gameArea.classList.remove('hidden');
  gameResult.classList.add('hidden');
  document.body.style.overflow = 'hidden';

  setupSpellingGame();
  startCardTimer(card.id, categoryId, timeLimit);
}

function closeGame() {
  stopCardTimer();
  const modal = document.getElementById('game-modal');
  modal.classList.add('hidden');
  modal.querySelector('.modal-content').classList.remove('result-mode');
  document.body.style.overflow = '';
  cleanupListeners();
  currentCard = null;
  currentCategoryId = null;
  currentCardIndex = null;
}

function onBackClick() {
  closeGame();
}

function onRetryClick() {
  retryCurrentCard();
}

function retryCurrentCard() {
  if (!currentCard) return;
  attempts = 0;
  isSuccess = false;
  targetWord = currentCard.word.replace(/\s+/g, '');

  const config = getConfig();
  const timeLimit = targetWord.length * config.timer.secondsPerLetter;

  const gameArea = document.getElementById('game-area');
  const gameResult = document.getElementById('game-result');

  gameArea.classList.remove('hidden');
  gameResult.classList.add('hidden');

  setupSpellingGame();
  startCardTimer(currentCard.id, currentCategoryId, timeLimit);
}

function cleanupListeners() {
  if (poolController) {
    poolController.abort();
    poolController = null;
  }
  if (dropController) {
    dropController.abort();
    dropController = null;
  }
}

function setupSpellingGame() {
  cleanupListeners();

  const thumbImg = document.getElementById('game-thumb-img');
  const display = document.getElementById('game-word-display');
  const dropZone = document.getElementById('game-drop-zone');
  const letterPool = document.getElementById('game-letter-pool');
  const feedback = document.getElementById('game-feedback');
  const attemptsEl = document.getElementById('game-attempts');
  const retryBar = document.getElementById('game-retry-bar');

  const imgPath = getCardImagePath(currentCategoryId, currentCard.image);
  thumbImg.src = imgPath;
  thumbImg.alt = currentCard.word;

  const hint = currentCard.word.split('').map(c => c === ' ' ? '  ' : '_').join(' ');
  display.textContent = hint;
  feedback.textContent = '';
  feedback.className = 'game-feedback';
  attemptsEl.textContent = `Attempts: ${attempts} / ${MAX_ATTEMPTS}`;
  retryBar.classList.remove('hidden');

  dropZone.innerHTML = '<span class="drop-hint">Drop letters here</span>';

  const shuffled = shuffleArray(targetWord.split(''));
  letterPool.innerHTML = shuffled.map((letter, i) => `
    <div class="letter-tile" draggable="true" data-letter="${letter}" data-index="${i}">
      ${letter}
    </div>
  `).join('');

  setupDragAndDrop();
}

function setupDragAndDrop() {
  poolController = new AbortController();
  dropController = new AbortController();

  const letterPool = document.getElementById('game-letter-pool');
  const dropZone = document.getElementById('game-drop-zone');
  let draggedEl = null;

  letterPool.addEventListener('dragstart', (e) => {
    const tile = e.target.closest('.letter-tile');
    if (!tile) return;
    draggedEl = tile;
    tile.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }, { signal: poolController.signal });

  letterPool.addEventListener('dragend', (e) => {
    const tile = e.target.closest('.letter-tile');
    if (tile) tile.classList.remove('dragging');
  }, { signal: poolController.signal });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  }, { signal: dropController.signal });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  }, { signal: dropController.signal });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (!draggedEl) return;

    placeTile(draggedEl, dropZone);
    draggedEl = null;
  }, { signal: dropController.signal });

  letterPool.addEventListener('click', (e) => {
    const tile = e.target.closest('.letter-tile');
    if (!tile || tile.classList.contains('used')) return;
    placeTile(tile, dropZone);
  }, { signal: poolController.signal });
}

function placeTile(sourceTile, dropZone) {
  const hint = dropZone.querySelector('.drop-hint');
  if (hint) hint.remove();

  const clone = document.createElement('div');
  clone.className = 'letter-tile placed';
  clone.dataset.letter = sourceTile.dataset.letter;
  clone.dataset.sourceIndex = sourceTile.dataset.index;
  clone.textContent = sourceTile.dataset.letter;
  clone.draggable = false;

  clone.addEventListener('click', () => {
    clone.remove();
    sourceTile.classList.remove('used');
    if (!dropZone.querySelector('.letter-tile')) {
      dropZone.innerHTML = '<span class="drop-hint">Drop letters here</span>';
    }
  });

  dropZone.appendChild(clone);
  sourceTile.classList.add('used');

  checkAutoSubmit();
}

function checkAutoSubmit() {
  const dropZone = document.getElementById('game-drop-zone');
  const placed = dropZone.querySelectorAll('.letter-tile');

  if (placed.length !== targetWord.length) return;

  const spelled = Array.from(placed).map(t => t.dataset.letter).join('');

  if (spelled === targetWord) {
    onCorrect();
  } else {
    onWrong();
  }
}

function onCorrect() {
  isSuccess = true;
  const feedback = document.getElementById('game-feedback');
  feedback.textContent = '✓ Correct!';
  feedback.className = 'game-feedback success';

  const elapsed = recordCardTime(currentCard.id, currentCategoryId, false);
  showCardTime(elapsed);

  markCardCompleted(currentCategoryId, currentCardIndex);

  cleanupListeners();
  setTimeout(() => showResult(), 1200);
}

function onWrong() {
  attempts++;
  const feedback = document.getElementById('game-feedback');
  const attemptsEl = document.getElementById('game-attempts');

  attemptsEl.textContent = `Attempts: ${attempts} / ${MAX_ATTEMPTS}`;

  if (attempts >= MAX_ATTEMPTS) {
    feedback.textContent = `✗ Answer: ${capitalize(currentCard.word)}`;
    feedback.className = 'game-feedback error';
    const elapsed = recordCardTime(currentCard.id, currentCategoryId, false);
    showCardTime(elapsed);
    cleanupListeners();
    showRetryBar();
  } else {
    feedback.textContent = `✗ Wrong! (${MAX_ATTEMPTS - attempts} left)`;
    feedback.className = 'game-feedback error';
    resetDropZone();
  }
}

function onTimeout() {
  const feedback = document.getElementById('game-feedback');
  feedback.textContent = `⏰ Time's up! Answer: ${capitalize(currentCard.word)}`;
  feedback.className = 'game-feedback error timeout';

  const elapsed = recordCardTime(currentCard.id, currentCategoryId, true);
  showCardTime(elapsed);

  cleanupListeners();
  showRetryBar();
}

function showCardTime(elapsed) {
  const timerDisplay = document.getElementById('card-timer-display');
  if (timerDisplay) {
    timerDisplay.textContent = formatTimeMs(elapsed);
    timerDisplay.classList.remove('timer-warning');
    timerDisplay.classList.add('timer-done');
  }
}

function resetDropZone() {
  const dropZone = document.getElementById('game-drop-zone');
  const letterPool = document.getElementById('game-letter-pool');

  dropZone.innerHTML = '<span class="drop-hint">Drop letters here</span>';
  letterPool.querySelectorAll('.letter-tile').forEach(t => {
    t.classList.remove('used');
  });
}

function showRetryBar() {
  const retryBar = document.getElementById('game-retry-bar');
  retryBar.classList.remove('hidden');
}

function showResult() {
  const gameArea = document.getElementById('game-area');
  const gameResult = document.getElementById('game-result');
  const resultImage = document.getElementById('result-image');
  const resultWord = document.getElementById('result-word');
  const backBtn = document.getElementById('btn-back-gallery');
  const favoriteBtn = document.getElementById('btn-favorite');
  const modalContent = document.getElementById('game-modal').querySelector('.modal-content');

  gameArea.classList.add('hidden');
  gameResult.classList.remove('hidden');
  modalContent.classList.add('result-mode');

  resultWord.textContent = currentCard.word;

  const cardTime = getCardTime(currentCategoryId, currentCard.id);
  const timeEl = document.getElementById('result-time');
  if (timeEl) {
    timeEl.textContent = cardTime ? `⏱ ${formatTimeMs(cardTime)}` : '';
  }

  const imgPath = getCardImagePath(currentCategoryId, currentCard.image);
  resultImage.src = imgPath;
  resultImage.alt = currentCard.word;
  resultImage.classList.remove('hidden');
  backBtn.textContent = '← Back to Cards';
  favoriteBtn.classList.remove('hidden');
  updateFavoriteButton();

  document.dispatchEvent(new CustomEvent('card-completed'));
}

function onFavoriteClick() {
  if (!currentCard || !currentCategoryId) return;
  toggleFavorite(currentCategoryId, currentCard.id);
  updateFavoriteButton();
}

function updateFavoriteButton() {
  const btn = document.getElementById('btn-favorite');
  const fav = isFavorited(currentCategoryId, currentCard.id);
  if (fav) {
    btn.textContent = '⭐ Collected';
    btn.classList.add('favorited');
  } else {
    btn.textContent = '☆ Collect';
    btn.classList.remove('favorited');
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function openPreview(card, categoryId) {
  currentCard = card;
  currentCategoryId = categoryId;
  currentCardIndex = null;

  const modal = document.getElementById('game-modal');
  const gameArea = document.getElementById('game-area');
  const gameResult = document.getElementById('game-result');
  const resultImage = document.getElementById('result-image');
  const resultWord = document.getElementById('result-word');
  const favoriteBtn = document.getElementById('btn-favorite');
  const modalContent = modal.querySelector('.modal-content');

  modal.classList.remove('hidden');
  gameArea.classList.add('hidden');
  gameResult.classList.remove('hidden');
  modalContent.classList.add('result-mode');
  document.body.style.overflow = 'hidden';

  resultWord.textContent = card.word;

  const imgPath = getCardImagePath(categoryId, card.image);
  resultImage.src = imgPath;
  resultImage.alt = card.word;
  resultImage.classList.remove('hidden');

  const cardTime = getCardTime(categoryId, card.id);
  const timeEl = document.getElementById('result-time');
  if (timeEl) {
    timeEl.textContent = cardTime ? `⏱ ${formatTimeMs(cardTime)}` : '';
  }

  favoriteBtn.classList.remove('hidden');
  updateFavoriteButton();
}

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (shuffled.join('') === arr.join('') && shuffled.length > 1) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}
