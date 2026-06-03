const STORAGE_KEY = 'mc-users';
const CURRENT_USER_KEY = 'mc-current-user';

let currentUser = null;

export function initAuth() {
  const saved = localStorage.getItem(CURRENT_USER_KEY);
  if (saved) {
    currentUser = saved;
  }
  return currentUser;
}

export function getCurrentUser() {
  return currentUser;
}

export function getUsers() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function isUsernameTaken(username) {
  const users = getUsers();
  return users.some(u => u.toLowerCase() === username.toLowerCase());
}

export function createUser(username) {
  if (isUsernameTaken(username)) {
    return { success: false, error: 'Username already exists' };
  }
  const users = getUsers();
  users.push(username);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  currentUser = username;
  localStorage.setItem(CURRENT_USER_KEY, username);
  return { success: true };
}

export function loginUser(username) {
  currentUser = username;
  localStorage.setItem(CURRENT_USER_KEY, username);
}

export function logout() {
  currentUser = null;
  localStorage.removeItem(CURRENT_USER_KEY);
}
