// toast.js — Toast notifications (Fase 7 — Polimento e UX)

/**
 * Container de toasts — criado dinamicamente, anexado ao body uma única vez.
 * @type {HTMLElement|null}
 */
let toastContainer = null;

/**
 * Garante que o container de toasts existe no DOM.
 * Criado uma única vez e anexado ao <body> (não ao #app, que é reescrito a cada render).
 * @returns {HTMLElement}
 */
function ensureContainer() {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }

  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  toastContainer.setAttribute('aria-live', 'polite');
  toastContainer.setAttribute('role', 'status');
  document.body.appendChild(toastContainer);

  return toastContainer;
}

/**
 * Exibe uma notificação toast.
 *
 * @param {string} message — texto da notificação
 * @param {string} [type='info'] — tipo: 'success' | 'error' | 'info' | 'warning'
 * @param {number} [duration=3000] — tempo em ms antes de auto-fechar (0 = manual)
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = ensureContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${getIcon(type)}</span>
    <span class="toast-message">${escapeHTML(message)}</span>
    <button class="toast-close" aria-label="Fechar">×</button>
  `;

  // Botão de fechar
  toast.querySelector('.toast-close').addEventListener('click', () => {
    dismissToast(toast);
  });

  container.appendChild(toast);

  // Anima entrada
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  // Auto-fechar
  if (duration > 0) {
    setTimeout(() => {
      dismissToast(toast);
    }, duration);
  }

  return toast;
}

/**
 * Remove um toast com animação de saída.
 * @param {HTMLElement} toast
 */
function dismissToast(toast) {
  if (!toast || !toast.parentElement) return;

  toast.classList.remove('toast-visible');
  toast.classList.add('toast-leaving');

  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  }, 300);
}

/**
 * Ícone emoji para cada tipo de toast.
 * @param {string} type
 * @returns {string}
 */
function getIcon(type) {
  const icons = {
    success: '✅',
    error: '⚠️',
    info: 'ℹ️',
    warning: '⚡',
  };
  return icons[type] || icons.info;
}

/**
 * EscapaHTML para evitar XSS no conteúdo do toast.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}
