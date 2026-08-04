// app.js — Lógica principal do Task Board

import { loadFromStorage, saveToStorage } from './utils.js';
import { renderBoard } from './board.js';

/**
 * Carrega as tarefas do localStorage.
 * Retorna array vazio na primeira execução.
 * @returns {Array} Lista de tarefas
 */
function getTasks() {
  return loadFromStorage('tasks', []);
}

/**
 * Atualiza o badge de contagem total de tarefas no header.
 * @param {Array} tasks
 */
function updateHeaderBadge(tasks) {
  const badge = document.getElementById('header-badge');
  if (badge) {
    const count = tasks.length;
    badge.textContent = count === 0 ? 'Nenhuma tarefa' : `${count} ${count === 1 ? 'tarefa' : 'tarefas'}`;
  }
}

/**
 * Renderiza todo o board dentro do container #app.
 */
function render() {
  const tasks = getTasks();
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <header class="app-header">
      <h1>
        <span class="header-icon">🗂️</span>
        Task Board
      </h1>
      <span class="header-badge" id="header-badge">Nenhuma tarefa</span>
    </header>
    <main class="board" id="board">
      ${renderBoard(tasks)}
    </main>
  `;

  updateHeaderBadge(tasks);
}

/**
 * Inicialização — renderiza a UI e registra eventos globais.
 */
function init() {
  console.log('Task Board — Fase 2: Layout e Quadro Base');
  render();
}

// Inicializa quando o DOM está pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
