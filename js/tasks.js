// tasks.js — CRUD de tarefas (create, read, update, delete)

import { loadFromStorage, saveToStorage, generateId } from './utils.js';

/**
 * Carrega todas as tarefas do localStorage.
 * @returns {Array} Lista de tarefas
 */
export function getTasks() {
  return loadFromStorage('tasks', []);
}

/**
 * Salva a lista completa de tarefas no localStorage.
 * @param {Array} tasks
 */
export function saveTasks(tasks) {
  saveToStorage('tasks', tasks);
}

/**
 * Cria uma nova tarefa com os dados fornecidos.
 * @param {Object} data - { title, description, priority, tags, dueDate, assignee }
 * @returns {Object} A tarefa criada
 */
export function createTask(data) {
  const tasks = getTasks();
  const now = new Date().toISOString();

  const task = {
    id: generateId(),
    title: (data.title || '').trim() || 'Sem título',
    description: (data.description || '').trim(),
    status: 'todo',
    priority: data.priority || 'media',
    tags: Array.isArray(data.tags) ? data.tags : [],
    dueDate: data.dueDate || null,
    assignee: data.assignee || null,
    order: tasks.filter(t => t.status === 'todo').length,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };

  tasks.push(task);
  saveTasks(tasks);
  return task;
}

/**
 * Busca uma tarefa pelo ID.
 * @param {string} id
 * @returns {Object|null}
 */
export function getTaskById(id) {
  const tasks = getTasks();
  return tasks.find(t => t.id === id) || null;
}

/**
 * Atualiza uma tarefa existente.
 * @param {string} id
 * @param {Object} updates - Campos a atualizar
 * @returns {Object|null} A tarefa atualizada ou null se não encontrada
 */
export function updateTask(id, updates) {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;

  const task = tasks[idx];
  const wasDone = task.status === 'done';
  const nowDone = updates.status === 'done';

  Object.assign(task, updates, { updatedAt: new Date().toISOString() });

  // Gerencia completedAt: define se passou para done, limpa se saiu de done
  if (!wasDone && nowDone) {
    task.completedAt = new Date().toISOString();
  } else if (wasDone && updates.status && updates.status !== 'done') {
    task.completedAt = null;
  }

  tasks[idx] = task;
  saveTasks(tasks);
  return task;
}

/**
 * Remove uma tarefa pelo ID.
 * @param {string} id
 * @returns {boolean} true se removida
 */
export function deleteTask(id) {
  const tasks = getTasks();
  const filtered = tasks.filter(t => t.id !== id);
  if (filtered.length === tasks.length) return false;
  saveTasks(filtered);
  return true;
}

/**
 * Move uma tarefa para outro status ( útil para drag & drop futuro ).
 * Reordena o campo `order` dentro do novo status.
 * @param {string} id
 * @param {string} newStatus
 * @param {number} [newOrder] - Posição desejada dentro do status
 */
export function moveTask(id, newStatus, newOrder) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const oldStatus = task.status;
  task.status = newStatus;
  task.updatedAt = new Date().toISOString();

  if (newStatus === 'done' && oldStatus !== 'done') {
    task.completedAt = new Date().toISOString();
  } else if (newStatus !== 'done' && oldStatus === 'done') {
    task.completedAt = null;
  }

  // Reordena tarefas no status de origem
  if (oldStatus !== newStatus) {
    tasks
      .filter(t => t.status === oldStatus && t.id !== id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((t, i) => { t.order = i; });
  }

  // Reordena tarefas no status de destino
  const destTasks = tasks
    .filter(t => t.status === newStatus && t.id !== id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (typeof newOrder === 'number') {
    destTasks.forEach((t, i) => {
      t.order = i >= newOrder ? i + 1 : i;
    });
    task.order = newOrder;
  } else {
    task.order = destTasks.length;
  }

  destTasks.forEach((t, i) => {
    if (t.id === id) return;
    // já ajustado acima
  });

  saveTasks(tasks);
}

/**
 * Converte uma string de tags separadas por vírgula em array limpo.
 * @param {string} input
 * @returns {Array<string>}
 */
export function parseTags(input) {
  if (!input) return [];
  return input
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0)
    .filter((t, i, arr) => arr.indexOf(t) === i); // remove duplicatas
}
