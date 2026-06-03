import { initAuth, getCurrentUser, isUsernameTaken, createUser, loginUser } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const savedUser = initAuth();
  const input = document.getElementById('username-input');
  const btn = document.getElementById('btn-start');
  const error = document.getElementById('login-error');

  if (savedUser) {
    input.value = savedUser;
  }

  btn.addEventListener('click', () => {
    handleStart();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleStart();
  });

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
