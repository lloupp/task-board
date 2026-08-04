// app.js — Lógica principal do Task Board (CRUD de tarefas)

import { loadFromStorage } from './utils.js';
import {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  parseTags,
} from './tasks.js';
import { renderBoard } from './board.js';

/**
 * Estado da UI: 'editId' é null quando criando nova tarefa, string quando editando.
 */
let editId = null;

/**
 * Atualiza o badge de contagem total de tarefas no header.
 * @param {Array} tasks
 */
function updateHeaderBadge(tasks) {
  const badge = document.getElementById('header-badge');
  if (badge) {
    const count = tasks.length;
    badge.textContent = count === 0
      ? 'Nenhuma tarefa'
      : `${count} ${count === 1 ? 'tarefa' : 'tarefas'}`;
  }
}

/**
 * Renderiza todo o board dentro do container #app.
 */
function render() {
  const tasks = getTasks();
  const app = document.getElementById('app');
  if (!app) return;

  // Preserva o modal se estiver aberto
  const modalOpen = document.querySelector('.modal-overlay');

  app.innerHTML = `
    <header class="app-header">
      <h1>
        <span class="header-icon">🗂️</span>
        Task Board
      </h1>
      <button class="btn-new-task" data-action="new-task">+ Nova Tarefa</button>
      <span class="header-badge" id="header-badge">Nenhuma tarefa</span>
    </header>
    <main class="board" id="board">
      ${renderBoard(tasks)}
    </main>
  `;

  updateHeaderBadge(tasks);

  // Reanexa o modal se estava aberto
  if (modalOpen) {
    app.appendChild(modalOpen);
  }
}

/**
 * Abre o modal de tarefa (criar ou editar).
 * Se `id` for fornecido, carrega os dados da tarefa existente.
 * @param {string|null} id - ID da tarefa ao editar, null ao criar
 */
function openTaskModal(id = null) {
  editId = id;
  const isEdit = id !== null;
  const task = isEdit ? getTaskById(id) : null;

  if (isEdit && !task) return;

  const tagsStr = task ? (task.tags || []).join(', ') : '';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
        <button class="modal-close" data-action="modal-close">×</button>
      </div>
      <form id="task-form" class="modal-form">
        <label class="form-label">Título <span class="req">*</span></label>
        <input type="text" id="form-title" class="form-input" required maxlength="200"
          placeholder="O que precisa ser feito?" value="${task ? (task.title || '') : ''}" />

        <label class="form-label">Descrição</label>
        <textarea id="form-description" class="form-textarea" rows="3" maxlength="1000"
          placeholder="Detalhes opcionais...">${task ? (task.description || '') : ''}</textarea>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Prioridade</label>
            <select id="form-priority" class="form-select">
              <option value="baixa"   ${task && task.priority === 'baixa' ? 'selected' : ''}>🔵 Baixa</option>
              <option value="media"   ${task && (!task.priority || task.priority === 'media') ? 'selected' : ''}>🔵 Média</option>
              <option value="alta"    ${task && task.priority === 'alta' ? 'selected' : ''}>🟠 Alta</option>
              <option value="urgente" ${task && task.priority === 'urgente' ? 'selected' : ''}>🔴 Urgente</option>
            </select>
          </div>
          <div class="form-col">
            <label class="form-label">Prazo</label>
            <input type="date" id="form-dueDate" class="form-input"
              value="${task && task.dueDate ? task.dueDate.split('T')[0] : ''}" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Tags (separadas por vírgula)</label>
            <input type="text" id="form-tags" class="form-input" maxlength="200"
              placeholder="ex: trabalho, pessoal, estudo"
              value="${tagsStr}" />
          </div>
          <div class="form-col">
            <label class="form-label">Responsável</label>
            <input type="text" id="form-assignee" class="form-input" maxlength="100"
              placeholder="Quem vai fazer?"
              value="${task && task.assignee ? task.assignee : ''}" />
          </div>
        </div>

        <div class="modal-footer">
          ${isEdit ? '<button type="button" class="btn-danger" data-action="delete-task">Excluir</button>' : ''}
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-action="modal-close">Cancelar</button>
            <button type="submit" class="btn-primary">${isEdit ? 'Salvar' : 'Criar'}</button>
          </div>
        </div>
      </form>
    </div>
  `;

  document.getElementById('app').appendChild(overlay);

  // Foco no título
  setTimeout(() => {
    const titleInput = document.getElementById('form-title');
    if (titleInput) titleInput.focus();
  }, 50);
}

/**
 * Fecha o modal e limpa o estado de edição.
 */
function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.remove();
  editId = null;
}

/**
 * Processa o submit do formulário (criar ou editar tarefa).
 * @param {Event} e
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('form-title').value.trim();
  if (!title) return; // required já valida mas por segurança

  const data = {
    title,
    description: document.getElementById('form-description').value.trim(),
    priority: document.getElementById('form-priority').value,
    dueDate: document.getElementById('form-dueDate').value
      ? new Date(document.getElementById('form-dueDate').value).toISOString()
      : null,
    tags: parseTags(document.getElementById('form-tags').value),
    assignee: document.getElementById('form-assignee').value.trim() || null,
  };

  if (editId) {
    updateTask(editId, data);
  } else {
    createTask(data);
  }

  closeModal();
  render();
}

/**
 * Confirma e executa a exclusão de uma tarefa.
 * @param {string} id
 */
function handleDelete(id) {
  const task = getTaskById(id);
  if (!task) return;

  if (confirm(`Excluir "${task.title}"?\n\nEsta ação não pode ser desfeita.`)) {
    deleteTask(id);
    closeModal();
    render();
  }
}

/**
 * Trata cliques no board (event delegation).
 * @param {Event} e
 */
function handleClick(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  const taskId = target.dataset.taskId;

  switch (action) {
    case 'new-task':
      openTaskModal(null);
      break;
    case 'modal-close':
      if (confirm('Deseja cancelar? As alterações não serão salvas.')) {
        closeModal();
      }
      break;
    case 'delete-task':
      if (editId) handleDelete(editId);
      break;
    case 'delete':
      // Botão × no card
      e.stopPropagation();
      if (taskId) handleDelete(taskId);
      break;
    default:
      break;
  }
}

/**
 * Trata cliques em cards para abrir modal de edição.
 * @param {Event} e
 */
function handleCardClick(e) {
  // Ignora cliques no botão delete
  if (e.target.closest('.card-delete-btn')) return;

  const card = e.target.closest('.card');
  if (!card) return;

  const taskId = card.dataset.taskId;
  if (taskId) openTaskModal(taskId);
}

/**
 * Trata teclas globais (Escape fecha modal).
 * @param {Event} e
 */
function handleKeydown(e) {
  if (e.key === 'Escape') {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      closeModal();
    }
  }
}

/**
 * Inicialização — renderiza a UI e registra eventos globais.
 */
function init() {
  console.log('Task Board — Fase 3: CRUD de Tarefas');
  render();

  // Event delegation no container principal
  const app = document.getElementById('app');
  if (app) {
    app.addEventListener('click', handleClick);
    app.addEventListener('click', handleCardClick);
  }

  // Teclado
  document.addEventListener('keydown', handleKeydown);
}

// Inicializa quando o DOM está pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
