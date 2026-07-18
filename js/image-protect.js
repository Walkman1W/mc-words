let devtoolsOpen = false;

export function initImageProtection() {
  disableContextMenu();
  disableImageDrag();
  disableKeyboardShortcuts();
  detectDevTools();
  preventTouchSave();
}

function disableContextMenu() {
  document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'IMG' || e.target.closest('.card-thumb, .game-thumbnail, .game-result')) {
      e.preventDefault();
    }
  });
}

function disableImageDrag() {
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });
}

function disableKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
    }
    // Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
    }
    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
    }
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
    }
    // Ctrl+S (Save page)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
    }
  });
}

function detectDevTools() {
  const threshold = 160;

  const check = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    const wasOpen = devtoolsOpen;
    devtoolsOpen = widthThreshold || heightThreshold;

    if (devtoolsOpen && !wasOpen) {
      onDevToolsOpen();
    } else if (!devtoolsOpen && wasOpen) {
      onDevToolsClose();
    }
  };

  setInterval(check, 1000);

  // Debugger trap: detecting console usage
  const el = new Image();
  Object.defineProperty(el, 'id', {
    get: function () {
      devtoolsOpen = true;
      onDevToolsOpen();
    }
  });
  // Periodically push to console to trigger getter
  setInterval(() => {
    console.log('%c', el);
    console.clear();
  }, 2000);
}

function onDevToolsOpen() {
  document.body.classList.add('devtools-open');
}

function onDevToolsClose() {
  document.body.classList.remove('devtools-open');
}

function preventTouchSave() {
  document.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'IMG') {
      e.target.style.webkitTouchCallout = 'none';
    }
  });

  // Prevent iOS long press
  document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      return false;
    }
  });
}

export function isDevToolsOpen() {
  return devtoolsOpen;
}
