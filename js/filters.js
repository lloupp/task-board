// filters.js — Filtros e busca do Task Board

import { loadFromStorage, saveToStorage, isOverdue, daysUntilDue } from './utils.js';

/**
 * Estado atual dos filtros.
 * @typedef {Object} FilterState
 * @property {string} searchText    — texto buscado (título + descrição)
 * @property {string} tag           — tag selecionada ('' = todas)
 * @property {string} priority      — prioridade selecionada ('' = todas)
 * @property {string} dueDate       — filtro de prazo ('' = todos, 'overdue', 'today', 'week')
 */

/** Chave do localStorage para persistir filtros. */
const SETTINGS_KEY = 'settings';

/**
 * Carrega os filtros salvos ou retorna o estado padrão (tudo vazio).
 * @returns {FilterState}
 */
export function getFilters() {
  const settings = loadFromStorage(SETTINGS_KEY, {});
  return {
    searchText: settings.searchText || '',
    tag: settings.tag || '',
    priority: settings.priority || '',
    dueDate: settings.dueDate || '',
  };
}

/**
 * Salva os filtros ativos no localStorage (tb_settings).
 * @param {FilterState} filters
 */
export function saveFilters(filters) {
  const settings = loadFromStorage(SETTINGS_KEY, {});
  Object.assign(settings, filters);
  saveToStorage(SETTINGS_KEY, settings);
}

/**
 * Verifica se algum filtro está ativo.
 * @param {FilterState} filters
 * @returns {boolean}
 */
export function hasActiveFilters(filters) {
  return !!(
    filters.searchText ||
    filters.tag ||
    filters.priority ||
    filters.dueDate
  );
}

/**
 * Coleta todas as tags únicas das tarefas, ordenadas alfabeticamente.
 * @param {Array} tasks
 * @returns {Array<string>}
 */
export function collectAllTags(tasks) {
  const set = new Set();
  tasks.forEach(t => {
    if (t.tags && Array.isArray(t.tags)) {
      t.tags.forEach(tag => set.add(tag));
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Verifica se uma tarefa corresponde ao filtro de prazo.
 * @param {Object} task
 * @param {string} dueFilter — 'overdue' | 'today' | 'week' | ''
 * @returns {boolean}
 */
function matchesDueDate(task, dueFilter) {
  if (!dueFilter) return true;
  if (!task.dueDate) return false;  // sem prazo → não casa com nenhum filtro de prazo

  const days = daysUntilDue(task.dueDate);

  switch (dueFilter) {
    case 'overdue':
      return isOverdue(task.dueDate);
    case 'today':
      return days === 0;
    case 'week':
      return days >= 0 && days <= 7;
    default:
      return true;
  }
}

/**
 * Verifica se uma tarefa corresponde à busca textual (título + descrição).
 * @param {Object} task
 * @param {string} searchText
 * @returns {boolean}
 */
function matchesSearch(task, searchText) {
  if (!searchText) return true;
  const q = searchText.toLowerCase();
  const title = (task.title || '').toLowerCase();
  const desc = (task.description || '').toLowerCase();
  return title.includes(q) || desc.includes(q);
}

/**
 * Verifica se uma tarefa corresponde ao filtro de tag.
 * @param {Object} task
 * @param {string} tag
 * @returns {boolean}
 */
function matchesTag(task, tag) {
  if (!tag) return true;
  return task.tags && task.tags.includes(tag);
}

/**
 * Verifica se uma tarefa corresponde ao filtro de prioridade.
 * @param {Object} task
 * @param {string} priority
 * @returns {boolean}
 */
function matchesPriority(task, priority) {
  if (!priority) return true;
  return (task.priority || 'media') === priority;
}

/**
 * Filtra a lista de tarefas conforme o estado de filtros ativo.
 * @param {Array} tasks — lista completa de tarefas
 * @param {FilterState} filters — estado de filtros
 * @returns {Array} tarefas filtradas
 */
export function applyFilters(tasks, filters) {
  if (!hasActiveFilters(filters)) return tasks;

  return tasks.filter(task =>
    matchesSearch(task, filters.searchText) &&
    matchesTag(task, filters.tag) &&
    matchesPriority(task, filters.priority) &&
    matchesDueDate(task, filters.dueDate)
  );
}
