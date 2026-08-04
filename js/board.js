// board.js — Renderização do quadro, colunas e drag & drop

import { loadFromStorage, saveToStorage } from './utils.js';

/**
 * Configuração padrão de colunas.
 * @type {Array<{id: string, name: string, status: string, order: number, wipLimit: number|null}>}
 */
const DEFAULT_COLUMNS = [
  { id: 'col-todo',  name: 'A Fazer',    status: 'todo',  order: 0, wipLimit: null },
  { id: 'col-doing', name: 'Fazendo',    status: 'doing', order: 1, wipLimit: null },
  { id: 'col-done',  name: 'Concluído',  status: 'done',  order: 2, wipLimit: null },
];

/**
 * Carrega a configuração de colunas do localStorage ou usa o padrão.
 * @returns {Array} Configuração de colunas
 */
export function getColumns() {
  return loadFromStorage('columns', DEFAULT_COLUMNS);
}

/**
 * Salva a configuração de colunas no localStorage.
 * @param {Array} columns
 */
export function saveColumns(columns) {
  saveToStorage('columns', columns);
}

/**
 * Retorna o rótulo amigável e ícone para o empty state de cada coluna.
 * @param {string} status
 * @returns {{icon: string, text: string, hint: string}}
 */
function getEmptyContent(status) {
  switch (status) {
    case 'todo':
      return { icon: '📋', text: 'Nenhuma tarefa aqui', hint: 'As tarefas criadas aparecem aqui' };
    case 'doing':
      return { icon: '⚡', text: 'Nada em andamento', hint: 'Mova tarefas para começar' };
    case 'done':
      return { icon: '✅', text: 'Nada concluído ainda', hint: 'Tarefas finalizadas aparecem aqui' };
    default:
      return { icon: '📭', text: 'Vazio', hint: '' };
  }
}

/**
 * Renderiza uma única coluna.
 * @param {Object} column - Configuração da coluna
 * @param {Array} tasks - Lista de tarefas (filtrada para esta coluna)
 * @returns {string} HTML da coluna
 */
export function renderColumn(column, tasks) {
  const empty = getEmptyContent(column.status);
  const taskCount = tasks.length;

  let cardsHTML = '';
  if (taskCount === 0) {
    cardsHTML = `
      <div class="column-empty" data-status="${column.status}">
        <span class="empty-icon">${empty.icon}</span>
        <span class="empty-text">${empty.text}</span>
        <span class="empty-hint">${empty.hint}</span>
      </div>
    `;
  } else {
    cardsHTML = tasks.map(task => renderCard(task)).join('');
  }

  return `
    <div class="column" data-status="${column.status}" data-column-id="${column.id}">
      <div class="column-header">
        <div class="column-title">
          <span class="column-dot"></span>
          <span>${column.name}</span>
        </div>
        <span class="column-count">${taskCount}</span>
      </div>
      <div class="column-body" data-status="${column.status}">
        ${cardsHTML}
      </div>
    </div>
  `;
}

/**
 * Renderiza um card de tarefa (placeholder visual — Fase 3 detalha o conteúdo).
 * @param {Object} task
 * @returns {string} HTML do card
 */
function renderCard(task) {
  const title = task.title || 'Sem título';
  const priority = task.priority || 'media';
  const priorityColor = {
    baixa: 'var(--green)',
    media: 'var(--blue)',
    alta: 'var(--accent)',
    urgente: 'var(--red)',
  }[priority] || 'var(--blue)';

  return `
    <div class="card" data-task-id="${task.id}">
      <div class="card-title">${title}</div>
      <div class="card-meta">
        <span style="width:6px;height:6px;border-radius:50%;background:${priorityColor};flex-shrink:0;"></span>
        <span style="font-size:0.75rem;color:var(--text-muted);text-transform:capitalize;">${priority}</span>
      </div>
    </div>
  `;
}

/**
 * Renderiza o quadro completo — Todas as colunas com suas tarefas.
 * @param {Array} tasks - Array completo de tarefas
 * @returns {string} HTML do quadro
 */
export function renderBoard(tasks) {
  const columns = getColumns();
  return columns.map(col => {
    const colTasks = tasks
      .filter(t => t.status === col.status)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return renderColumn(col, colTasks);
  }).join('');
}
