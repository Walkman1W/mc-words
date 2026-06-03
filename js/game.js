import { getCardImagePath } from './cardData.js';
import { startCardTimer, stopCardTimer, recordCardTime, formatTimeMs } from './timer.js';
import { markCardCompleted, getConfig } from './progress.js';

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
  targetWord = card.word.replace(/\s+/g, '');

  const config = getConfig();
  const timeLimit = targetWord.length * config.timer.secondsPerLetter;

  const modal = document.getElementById('game-modal');
  const gameArea = document.getElementById('game-area');
  const gameResult = document.getElementById('game-result');

  modal.classList.remove('hidden');
  gameArea.classList.remove('hidden');
  gameResult.classList.add('hidden');

  setupSpellingGame();
  startCardTimer(card.id, categoryId, timeLimit);
}

function closeGame() {
  stopCardTimer();
  document.getElementById('game-modal').classList.add('hidden');
  cleanupListeners();
  currentCard = null;
  currentCategoryId = null;
  currentCardIndex = null;
}

function onBackClick() {
  if (isSuccess) {
    closeGame();
  } else {
    retryCurrentCard();
  }
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

  const imgPath = getCardImagePath(currentCategoryId, currentCard.image);
  thumbImg.src = imgPath;
  thumbImg.alt = currentCard.word;

  const hint = currentCard.word.split('').map(c => c === ' ' ? '  ' : '_').join(' ');
  display.textContent = hint;
  feedback.textContent = '';
  feedback.className = 'game-feedback';
  attemptsEl.textContent = `Attempts: ${attempts} / ${MAX_ATTEMPTS}`;

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
    if (!tile || tile.style.display === 'none') return;
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
    sourceTile.style.display = '';
    if (!dropZone.querySelector('.letter-tile')) {
      dropZone.innerHTML = '<span class="drop-hint">Drop letters here</span>';
    }
  });

  dropZone.appendChild(clone);
  sourceTile.style.display = 'none';

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
    feedback.textContent = `Answer: ${currentCard.word.toUpperCase()}`;
    feedback.className = 'game-feedback error';
    const elapsed = recordCardTime(currentCard.id, currentCategoryId, false);
    showCardTime(elapsed);
    cleanupListeners();
    setTimeout(() => showResult(), 1500);
  } else {
    feedback.textContent = `✗ Wrong! (${MAX_ATTEMPTS - attempts} left)`;
    feedback.className = 'game-feedback error';
    resetDropZone();
  }
}

function onTimeout() {
  const feedback = document.getElementById('game-feedback');
  feedback.textContent = `⏰ Time's up! Answer: ${currentCard.word.toUpperCase()}`;
  feedback.className = 'game-feedback error timeout';

  const elapsed = recordCardTime(currentCard.id, currentCategoryId, true);
  showCardTime(elapsed);

  cleanupListeners();
  setTimeout(() => showResult(), 2000);
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
    t.style.display = '';
  });
}

function showResult() {
  const gameArea = document.getElementById('game-area');
  const gameResult = document.getElementById('game-result');
  const resultImage = document.getElementById('result-image');
  const resultWord = document.getElementById('result-word');
  const backBtn = document.getElementById('btn-back-gallery');

  gameArea.classList.add('hidden');
  gameResult.classList.remove('hidden');

  resultWord.textContent = currentCard.word;

  if (isSuccess) {
    const imgPath = getCardImagePath(currentCategoryId, currentCard.image);
    resultImage.src = imgPath;
    resultImage.alt = currentCard.word;
    resultImage.classList.remove('hidden');
    backBtn.textContent = '← Back to Cards';
  } else {
    resultImage.src = '';
    resultImage.classList.add('hidden');
    backBtn.textContent = '🔄 Try Again';
  }

  document.dispatchEvent(new CustomEvent('card-completed'));
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
