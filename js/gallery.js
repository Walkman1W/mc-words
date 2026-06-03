import { getCategories, getCurrentCategory, setCurrentCategory } from './categories.js';
import { getCardsForCategory, getCardImagePath } from './cardData.js';
import { openGame } from './game.js';
import { getCategoryTime, getLeaderboard, getPlayerRank, formatTimeMs } from './timer.js';
import { getConfig, isCardUnlocked, getFavorites } from './progress.js';

let showingFavorites = false;

export function initGallery() {
  renderTabs();
  renderCards();
  renderCategoryStats();
  initLeaderboard();
}

function renderTabs() {
  const tabsContainer = document.getElementById('tabs');
  const categories = getCategories();

  tabsContainer.innerHTML = categories.map(cat => `
    <button class="tab-btn ${!showingFavorites && cat.id === getCurrentCategory() ? 'active' : ''}" data-id="${cat.id}">
      ${cat.label}
    </button>
  `).join('') + `
    <button class="tab-btn tab-favorites ${showingFavorites ? 'active' : ''}" data-id="__favorites__">
      ⭐ Favorites
    </button>
  `;

  tabsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (btn.dataset.id === '__favorites__') {
      showingFavorites = true;
      renderFavorites();
      renderCategoryStats();
    } else {
      showingFavorites = false;
      setCurrentCategory(btn.dataset.id);
      renderCards();
      renderCategoryStats();
    }
  });
}

export function renderCards() {
  if (showingFavorites) {
    renderFavorites();
    return;
  }
  const grid = document.getElementById('card-grid');
  const categoryId = getCurrentCategory();
  const cards = getCardsForCategory(categoryId);
  const config = getConfig();
  const lockConfig = config.levelLock;

  if (cards.length === 0) {
    grid.innerHTML = `<div class="empty-state">No cards yet.<br>Add images to assets/images/cards/${categoryId}/</div>`;
    return;
  }

  grid.innerHTML = cards.map((card, index) => {
    const unlocked = isCardUnlocked(categoryId, index);
    const imgPath = getCardImagePath(categoryId, card.image);

    if (unlocked) {
      return `
        <div class="card-thumb" data-category="${categoryId}" data-index="${index}">
          <img src="${imgPath}" alt="${card.word}" onerror="this.style.display='none'">
          <div class="card-label">${card.word}</div>
        </div>
      `;
    } else {
      return `
        <div class="card-thumb card-locked" data-category="${categoryId}" data-index="${index}">
          ${lockConfig.showThumbnailOnLocked
            ? `<img src="${imgPath}" alt="${card.word}" onerror="this.style.display='none'">`
            : `<div class="card-locked-icon">?</div>`
          }
          ${lockConfig.showWordOnLocked
            ? `<div class="card-label">${card.word}</div>`
            : `<div class="card-label">???</div>`
          }
          <div class="card-lock-overlay"><span class="lock-icon">🔒</span></div>
        </div>
      `;
    }
  }).join('');

  grid.querySelectorAll('.card-thumb:not(.card-locked)').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const cat = thumb.dataset.category;
      const idx = parseInt(thumb.dataset.index);
      const cardInfo = getCardsForCategory(cat)[idx];
      openGame(cardInfo, cat, idx);
    });
  });
}

function renderFavorites() {
  const grid = document.getElementById('card-grid');
  const favorites = getFavorites();
  const categories = getCategories();

  let allFavCards = [];
  for (const cat of categories) {
    const favIds = favorites[cat.id] || [];
    if (favIds.length === 0) continue;
    const cards = getCardsForCategory(cat.id);
    for (const card of cards) {
      if (favIds.includes(card.id)) {
        allFavCards.push({ card, categoryId: cat.id, categoryLabel: cat.label });
      }
    }
  }

  if (allFavCards.length === 0) {
    grid.innerHTML = `<div class="empty-state">No favorites yet.<br>Complete cards and click ⭐ to collect!</div>`;
    return;
  }

  grid.innerHTML = allFavCards.map(({ card, categoryId }) => {
    const imgPath = getCardImagePath(categoryId, card.image);
    const cards = getCardsForCategory(categoryId);
    const index = cards.findIndex(c => c.id === card.id);
    return `
      <div class="card-thumb" data-category="${categoryId}" data-index="${index}">
        <img src="${imgPath}" alt="${card.word}" onerror="this.style.display='none'">
        <div class="card-label">${card.word}</div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.card-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const cat = thumb.dataset.category;
      const idx = parseInt(thumb.dataset.index);
      const cardInfo = getCardsForCategory(cat)[idx];
      openGame(cardInfo, cat, idx);
    });
  });
}

function renderCategoryStats() {
  const statsEl = document.getElementById('category-stats');

  if (showingFavorites) {
    statsEl.innerHTML = '';
    return;
  }

  const categoryId = getCurrentCategory();
  const totalTime = getCategoryTime(categoryId);
  const playerRank = getPlayerRank(categoryId);

  if (!totalTime) {
    statsEl.innerHTML = `<div class="stats-empty">Complete cards to see your stats</div>`;
    return;
  }

  statsEl.innerHTML = `
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">Total Time</span>
        <span class="stat-value">${formatTimeMs(totalTime)}</span>
      </div>
      ${playerRank ? `
      <div class="stat-item">
        <span class="stat-label">Rank</span>
        <span class="stat-value rank-value">#${playerRank.rank}</span>
      </div>
      ` : ''}
    </div>
  `;
}

function initLeaderboard() {
  const btn = document.getElementById('btn-leaderboard');
  const modal = document.getElementById('leaderboard-modal');
  const closeBtn = document.getElementById('btn-close-leaderboard');

  btn.addEventListener('click', () => {
    renderLeaderboard();
    modal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
}

function renderLeaderboard() {
  const categoryId = getCurrentCategory();
  const categories = getCategories();
  const currentCat = categories.find(c => c.id === categoryId);
  const leaderboard = getLeaderboard(categoryId);

  const categoryEl = document.getElementById('leaderboard-category');
  categoryEl.textContent = currentCat ? currentCat.label : '';

  const listEl = document.getElementById('leaderboard-list');

  const entries = leaderboard.map((entry, i) => ({
    rank: i + 1,
    name: entry.name,
    time: entry.time,
    isCurrent: entry.isCurrent || false,
    isLocal: entry.isLocal || false,
  }));

  listEl.innerHTML = entries.map(entry => `
    <div class="leaderboard-entry ${entry.isCurrent ? 'player-entry' : ''} ${entry.isLocal && !entry.isCurrent ? 'local-entry' : ''} ${entry.rank <= 3 ? 'top-three' : ''}">
      <span class="lb-rank">${getRankIcon(entry.rank)}</span>
      <span class="lb-name">${entry.isCurrent ? '⭐ ' : ''}${entry.name}</span>
      <span class="lb-time">${formatTimeMs(entry.time)}</span>
    </div>
  `).join('');
}

function getRankIcon(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}
