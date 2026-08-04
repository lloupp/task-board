// board.js — Renderização do quadro, colunas e cards

import { loadFromStorage, saveToStorage, formatDate, isOverdue, daysUntilDue } from './utils.js';

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
 * Mapeamento de prioridade → classe CSS + rótulo + cor.
 */
const PRIORITY_META = {
  baixa:    { label: 'Baixa',    cls: 'priority-baixa',    color: 'var(--green)' },
  media:    { label: 'Média',    cls: 'priority-media',    color: 'var(--blue)' },
  alta:     { label: 'Alta',     cls: 'priority-alta',     color: 'var(--accent)' },
  urgente:  { label: 'Urgente',  cls: 'priority-urgente',  color: 'var(--red)' },
};

/**
 * Escapa HTML para evitar XSS em conteúdo inserido via innerHTML.
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

/**
 * Calcula a classe CSS do badge de prazo com base no warning gradual.
 * Verde (>3 dias) → amarelo (1–3 dias) → vermelho (hoje ou atrasado).
 * @param {string} dueDate
 * @returns {string} classe CSS
 */
function getDueDateClass(dueDate) {
  if (!dueDate) return '';
  if (isOverdue(dueDate)) return 'due-overdue';
  const days = daysUntilDue(dueDate);
  if (days === 0) return 'due-today';
  if (days <= 3) return 'due-soon';
  return 'due-ok';
}

/**
 * Renderiza as tags de uma tarefa como badges.
 * @param {Array<string>} tags
 * @returns {string} HTML
 */
function renderTags(tags) {
  if (!tags || tags.length === 0) return '';
  return `<div class="card-tags">${tags.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}</div>`;
}

/**
 * Renderiza o badge de prazo de uma tarefa.
 * @param {string} dueDate
 * @returns {string} HTML
 */
function renderDueDate(dueDate) {
  if (!dueDate) return '';
  const cls = getDueDateClass(dueDate);
  const label = formatDate(dueDate);
  return `<span class="card-due ${cls}">📅 ${label}</span>`;
}

/**
 * Renderiza um card de tarefa completo com prioridade visual, tags e prazo.
 * Botão de exclusão aparece no hover do card.
 * @param {Object} task
 * @returns {string} HTML do card
 */
export function renderCard(task) {
  const priority = task.priority || 'media';
  const meta = PRIORITY_META[priority] || PRIORITY_META.media;
  const escapedTitle = escapeHTML(task.title);
  const escapedDesc = escapeHTML(task.description);

  return `
    <div class="card priority-${priority}" data-task-id="${task.id}">
      <div class="card-priority-bar"></div>
      <div class="card-content">
        <div class="card-header-row">
          <div class="card-title">${escapedTitle}</div>
          <button class="card-delete-btn" data-action="delete" data-task-id="${task.id}" title="Excluir tarefa">×</button>
        </div>
        ${escapedDesc ? `<div class="card-desc">${escapedDesc}</div>` : ''}
        ${renderTags(task.tags)}
        <div class="card-meta">
          <span class="card-priority-badge ${meta.cls}">
            <span class="priority-dot" style="background:${meta.color};"></span>
            ${meta.label}
          </span>
          ${renderDueDate(task.dueDate)}
          ${task.assignee ? `<span class="card-assignee">👤 ${escapeHTML(task.assignee)}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Verifica se uma coluna deve mostrar o botão "+ Nova Tarefa".
 * Apenas a coluna "todo" (A Fazer) mostra o botão por padrão.
 * @param {string} status
 * @returns {boolean}
 */
function canAddToColumn(status) {
  return status === 'todo';
}

/**
 * Renderiza uma única coluna com botão de adicionar (se aplicável).
 * @param {Object} column - Configuração da coluna
 * @param {Array} tasks - Lista de tarefas (filtrada para esta coluna)
 * @returns {string} HTML da coluna
 */
export function renderColumn(column, tasks) {
  const empty = getEmptyContent(column.status);
  const taskCount = tasks.length;

  let cardsHTML = '';
  if (taskCount === 0 && !canAddToColumn(column.status)) {
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

  const addBtn = canAddToColumn(column.status)
    ? `<button class="add-task-btn" data-action="new-task" data-status="${column.status}">+ Nova Tarefa</button>`
    : '';

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
      ${addBtn}
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
