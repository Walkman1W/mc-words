import { initAuth, getCurrentUser, getUsers, isUsernameTaken, createUser, loginUser } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const savedUser = initAuth();
  const input = document.getElementById('username-input');
  const btn = document.getElementById('btn-start');
  const error = document.getElementById('login-error');
  const dropdownBtn = document.getElementById('btn-user-dropdown');
  const dropdown = document.getElementById('user-dropdown');

  if (savedUser) {
    input.value = savedUser;
  }

  renderDropdown();

  btn.addEventListener('click', () => {
    handleStart();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleStart();
  });

  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
    renderDropdown();
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== dropdownBtn) {
      dropdown.classList.add('hidden');
    }
  });

  function renderDropdown() {
    const users = getUsers();
    if (users.length === 0) {
      dropdown.innerHTML = '<div class="dropdown-empty">No history</div>';
      return;
    }
    dropdown.innerHTML = users.map(u => `
      <div class="dropdown-item" data-user="${u}">${u}</div>
    `).join('');
    dropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        input.value = item.dataset.user;
        dropdown.classList.add('hidden');
        handleStart();
      });
    });
  }

  function handleStart() {
    const username = input.value.trim();
    error.classList.add('hidden');

    if (!username) {
      showError('Please enter a player name');
      return;
    }

    if (username.length < 2) {
      showError('Name must be at least 2 characters');
      return;
    }

    const currentUser = getCurrentUser();
    if (currentUser && currentUser.toLowerCase() === username.toLowerCase()) {
      loginUser(username);
      window.location.href = 'gallery.html';
      return;
    }

    if (isUsernameTaken(username)) {
      loginUser(username);
      window.location.href = 'gallery.html';
      return;
    }

    const result = createUser(username);
    if (result.success) {
      window.location.href = 'gallery.html';
    } else {
      showError(result.error);
    }
  }

  function showError(msg) {
    error.textContent = msg;
    error.classList.remove('hidden');
    input.classList.add('input-error');
    setTimeout(() => input.classList.remove('input-error'), 600);
  }
});
