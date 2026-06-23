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

// Create video card element
function createVideoCard(video) {
  const card = document.createElement('div');
  card.className = 'video-card';
  card.innerHTML = `
    <div class="video-card-thumb">
      <img src="${video.thumbnail || 'assets/videos/thumbnails/default.jpg'}"
           alt="${video.title}"
           loading="lazy"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 9%22><rect fill=%22%23333%22 width=%2216%22 height=%229%22/><text x=%228%22 y=%225%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%222%22>📹</text></svg>'">
      <div class="video-play-icon"></div>
      ${video.duration ? `<span class="video-duration">${video.duration}</span>` : ''}
    </div>
    <div class="video-card-info">
      <h3 class="video-card-title">${video.title}</h3>
      ${video.category ? `<span class="video-card-category">${video.category}</span>` : ''}
    </div>
  `;

  card.addEventListener('click', () => openVideoModal(video));
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
      <iframe src="//player.bilibili.com/player.html?bvid=${video.bvid}&autoplay=1"
              scrolling="no"
              border="0"
              frameborder="no"
              framespacing="0"
              allowfullscreen="true">
      </iframe>
    `;
  } else if (video.file) {
    // Direct video file
    videoPlayer.innerHTML = `
      <video controls autoplay>
        <source src="assets/videos/${video.file}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    `;
  } else {
    videoPlayer.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--mc-stone);">
        <p>Video not available</p>
      </div>
    `;
  }

  videoModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// Close video modal
function closeVideoModal() {
  videoModal.classList.add('hidden');
  videoPlayer.innerHTML = '';
  document.body.style.overflow = '';
}

// Initialize app
async function init() {
  // Check auth
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  // Update user display
  const userDisplay = document.getElementById('user-display');
  if (userDisplay) userDisplay.textContent = user;

  // Init DOM elements
  initElements();

  // Load video data
  await videoData.load();

  // Render UI
  renderTabs(videoData.getCategories());
  renderVideos();

  // Event listeners
  document.getElementById('btn-logout')?.addEventListener('click', logout);
  document.getElementById('btn-close-video')?.addEventListener('click', closeVideoModal);

  // Close modal on background click
  videoModal?.addEventListener('click', (e) => {
    if (e.target === videoModal) closeVideoModal();
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !videoModal.classList.contains('hidden')) {
      closeVideoModal();
    }
  });
}

// Start the app
init();
