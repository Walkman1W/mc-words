// Video App - Main entry point for videos page
import { videoData } from './videoData.js';

// Auth helpers (simplified - reuse from gallery)
function getCurrentUser() {
  return localStorage.getItem('mc-current-user');
}

function logout() {
  localStorage.removeItem('mc-current-user');
  window.location.href = 'index.html';
}

// DOM Elements
let videoGrid, videoTabs, emptyState, videoModal, videoPlayer, videoTitle, videoDescription;

// Category label map (for display)
let categoryLabelMap = {};

function initElements() {
  videoGrid = document.getElementById('video-grid');
  videoTabs = document.getElementById('video-tabs');
  emptyState = document.getElementById('empty-state');
  videoModal = document.getElementById('video-modal');
  videoPlayer = document.getElementById('video-player');
  videoTitle = document.getElementById('video-title');
  videoDescription = document.getElementById('video-description');
}

// Render video tabs
function renderTabs(categories) {
  videoTabs.innerHTML = '';
  // Build label map
  categoryLabelMap = {};
  categories.forEach(cat => {
    categoryLabelMap[cat.id] = cat.label;
  });

  categories.forEach(cat => {
    const tab = document.createElement('button');
    tab.className = `video-tab ${cat.id === 'all' ? 'active' : ''}`;
    tab.textContent = cat.label;
    tab.dataset.category = cat.id;
    tab.addEventListener('click', () => {
      document.querySelectorAll('.video-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderVideos(cat.id);
    });
    videoTabs.appendChild(tab);
  });
}

// Render video grid
function renderVideos(category = 'all') {
  const videos = videoData.getVideos(category);
  videoGrid.innerHTML = '';

  if (videos.length === 0) {
    emptyState.classList.remove('hidden');
    videoGrid.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  videoGrid.classList.remove('hidden');

  videos.forEach(video => {
    const card = createVideoCard(video);
    videoGrid.appendChild(card);
  });
}

// SVG placeholder for missing thumbnails
const PLACEHOLDER_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect fill="#1a1a2e" width="16" height="9"/><text x="8" y="5.5" text-anchor="middle" fill="#4CAF50" font-size="2.5" font-family="sans-serif">🎬</text></svg>`)}`;

// Create video card element
function createVideoCard(video) {
  const card = document.createElement('div');
  card.className = 'video-card';
  const hasBvid = video.bvid && video.bvid.trim() !== '';
  const catLabel = categoryLabelMap[video.category] || video.category || '';

  card.innerHTML = `
    <div class="video-card-thumb">
      <img src="${video.thumbnail || PLACEHOLDER_SVG}"
           alt="${video.title}"
           loading="lazy"
           onerror="this.src='${PLACEHOLDER_SVG}'">
      ${hasBvid ? '<div class="video-play-icon"></div>' : '<div class="video-coming-soon">即将上线</div>'}
      ${video.duration ? `<span class="video-duration">${video.duration}</span>` : ''}
    </div>
    <div class="video-card-info">
      <h3 class="video-card-title">${video.cardName || video.title}</h3>
      <span class="video-card-category">${catLabel}</span>
    </div>
  `;

  if (hasBvid) {
    card.addEventListener('click', () => openVideoModal(video));
  } else {
    card.classList.add('video-card-locked');
  }
  return card;
}

// Open video modal
function openVideoModal(video) {
  videoTitle.textContent = video.title;
  videoDescription.textContent = video.description || '';

  // Clear previous player
  videoPlayer.innerHTML = '';

  // Check if Bilibili video
  if (video.bvid) {
    videoPlayer.innerHTML = `
      <iframe src="//player.bilibili.com/player.html?bvid=${video.bvid}&autoplay=1&high_quality=1"
              scrolling="no"
              border="0"
              frameborder="no"
              framespacing="0"
              allowfullscreen="true">
      </iframe>
    `;
  } else {
    videoPlayer.innerHTML = `
      <div class="video-unavailable">
        <p>视频即将上线，敬请期待</p>
        <p class="video-unavailable-hint">Coming Soon</p>
      </div>
    `;
  }

  videoModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// Render video stats
function renderStats() {
  const statsEl = document.getElementById('video-stats');
  if (!statsEl) return;
  const stats = videoData.getStats();
  if (stats.total === 0) {
    statsEl.classList.add('hidden');
    return;
  }
  statsEl.classList.remove('hidden');
  statsEl.innerHTML = `
    <span class="stats-total">共 ${stats.total} 个视频</span>
    ${stats.available > 0 ? `<span class="stats-available">${stats.available} 个可播放</span>` : '<span class="stats-pending">视频陆续上传中</span>'}
  `;
}

// Close video modal
function closeVideoModal() {
  videoModal.classList.add('hidden');
  videoPlayer.innerHTML = '';
  document.body.style.overflow = '';
}

// Initialize app
async function init() {
  initElements();

  // Check auth (optional for video page)
  const user = getCurrentUser();
  const userDisplay = document.getElementById('user-display');
  const logoutBtn = document.getElementById('btn-logout');

  if (user) {
    if (userDisplay) userDisplay.textContent = user;
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
  } else {
    if (userDisplay) userDisplay.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
  }

  // Load video data
  await videoData.load();

  // Render UI
  renderTabs(videoData.getCategories());
  renderVideos();
  renderStats();

  // Event listeners
  document.getElementById('btn-close-video')?.addEventListener('click', closeVideoModal);

  videoModal?.addEventListener('click', (e) => {
    if (e.target === videoModal) closeVideoModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !videoModal.classList.contains('hidden')) {
      closeVideoModal();
    }
  });
}

init();
