// app.js — Lógica principal do Task Board (CRUD de tarefas + filtros)

import { loadFromStorage } from './utils.js';
import {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  moveTask,
  parseTags,
} from './tasks.js';
import { renderBoard } from './board.js';
import {
  getFilters,
  saveFilters,
  hasActiveFilters,
  collectAllTags,
  applyFilters,
} from './filters.js';
import { renderSummaryPanel, refreshChart } from './summary.js';

/**
 * Estado da UI: 'editId' é null quando criando nova tarefa, string quando editando.
 */
let editId = null;

/**
 * ID da tarefa que acabou de ser movida via drag & drop (para animação de pouso).
 * @type {string|null}
 */
let animateDroppedCard = null;

/**
 * Estado atual dos filtros (carregado do localStorage na init).
 * @type {Object|null}
 */
let filterState = null;

/**
 * Timer para debounce da busca textual (evita re-render a cada tecla).
 * @type {number|null}
 */
let searchDebounce = null;

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
 * Monta o HTML da barra de filtros (toolbar entre header e board).
 * @param {Array} allTasks — lista completa de tarefas (para coletar tags)
 * @returns {string} HTML da toolbar
 */
function renderFilterBar(allTasks) {
  const f = filterState;
  const tags = collectAllTags(allTasks);
  const active = hasActiveFilters(f);

  const tagOptions = tags
    .map(t => `<option value="${t}" ${f.tag === t ? 'selected' : ''}>#${t}</option>`)
    .join('');

  return `
    <div class="filter-bar" id="filter-bar">
      <div class="filter-search-wrap">
        <span class="filter-search-icon">🔍</span>
        <input type="text" id="filter-search" class="filter-input" placeholder="Buscar tarefas..."
          value="${escapeForAttr(f.searchText || '')}" maxlength="200" />
      </div>

      <select id="filter-tag" class="filter-select">
        <option value="">Todas as tags</option>
        ${tagOptions}
      </select>

      <select id="filter-priority" class="filter-select">
        <option value="">Todas as prioridades</option>
        <option value="baixa"   ${f.priority === 'baixa'   ? 'selected' : ''}>🔵 Baixa</option>
        <option value="media"   ${f.priority === 'media'   ? 'selected' : ''}>🔵 Média</option>
        <option value="alta"    ${f.priority === 'alta'    ? 'selected' : ''}>🟠 Alta</option>
        <option value="urgente" ${f.priority === 'urgente' ? 'selected' : ''}>🔴 Urgente</option>
      </select>

      <select id="filter-due" class="filter-select">
        <option value="">Todos os prazos</option>
        <option value="overdue" ${f.dueDate === 'overdue' ? 'selected' : ''}>⚠ Atrasadas</option>
        <option value="today"   ${f.dueDate === 'today'   ? 'selected' : ''}>📌 Hoje</option>
        <option value="week"    ${f.dueDate === 'week'    ? 'selected' : ''}>📅 Esta semana</option>
      </select>

      ${active ? '<button class="filter-clear-btn" data-action="clear-filters">✕ Limpar filtros</button>' : ''}

      <span class="filter-summary" id="filter-summary"></span>
    </div>
  `;
}

/**
 * Escapa texto para uso seguro dentro de atributos HTML.
 * @param {string} str
 * @returns {string}
 */
function escapeForAttr(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

/**
 * Renderiza todo o board dentro do container #app.
 */
function render() {
  const allTasks = getTasks();
  const app = document.getElementById('app');
  if (!app) return;

  // Preserva o modal se estiver aberto
  const modalOpen = document.querySelector('.modal-overlay');

  // Preserva o valor do campo de busca (pode ter sido digitado desde o último render)
  const searchEl = document.getElementById('filter-search');
  const currentSearchVal = searchEl ? searchEl.value : null;

  // Aplica filtros
  const filteredTasks = applyFilters(allTasks, filterState);
  const filtersActive = hasActiveFilters(filterState);

  app.innerHTML = `
    <header class="app-header">
      <h1>
        <span class="header-icon">🗂️</span>
        Task Board
      </h1>
      <button class="btn-new-task" data-action="new-task">+ Nova Tarefa</button>
      <span class="header-badge" id="header-badge">Nenhuma tarefa</span>
    </header>
    ${renderFilterBar(allTasks)}
    ${renderSummaryPanel(allTasks)}
    <main class="board ${filtersActive ? 'filtered' : ''}" id="board">
      ${renderBoard(filteredTasks)}
    </main>
  `;

  updateHeaderBadge(allTasks);

  // Atualiza resumo de filtros
  const summary = document.getElementById('filter-summary');
  if (summary) {
    if (filtersActive) {
      summary.textContent = `${filteredTasks.length} de ${allTasks.length} tarefas`;
    } else {
      summary.textContent = '';
    }
  }

  // Restaura foco e cursor do campo de busca se ele estava ativo
  if (currentSearchVal !== null) {
    const newSearchEl = document.getElementById('filter-search');
    if (newSearchEl) {
      newSearchEl.value = currentSearchVal;
      // Só restaura foco se o debounce ainda está ativo (usuário estava digitando)
      if (searchDebounce !== null) {
        newSearchEl.focus();
        const len = currentSearchVal.length;
        newSearchEl.setSelectionRange(len, len);
      }
    }
  }

  // Anima o card que acabou de ser solto via drag & drop
  if (animateDroppedCard) {
    const droppedCard = document.querySelector(`[data-task-id="${animateDroppedCard}"]`);
    if (droppedCard) {
      droppedCard.classList.add('dropped');
    }
    animateDroppedCard = null;
  }

  // Desenha o mini gráfico de produtividade no canvas do painel de resumo
  refreshChart();

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
    case 'clear-filters':
      clearFilters();
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

  // Suprime click se um drag acabou de terminar (evita abrir modal após arrastar)
  if (suppressNextClick) {
    suppressNextClick = false;
    return;
  }

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

// ============================================================
// FILTROS E BUSCA — Fase 5
// ============================================================

/**
 * Limpa todos os filtros ativos e re-renderiza.
 */
function clearFilters() {
  filterState = { searchText: '', tag: '', priority: '', dueDate: '' };
  saveFilters(filterState);
  searchDebounce = null;
  render();
}

/**
 * Atualiza um campo do estado de filtros, salva e re-renderiza.
 * @param {string} key — nome do campo (searchText, tag, priority, dueDate)
 * @param {string} value — novo valor
 * @param {boolean} skipRender — se true, não re-renderiza (para uso no debounce)
 */
function updateFilter(key, value, skipRender = false) {
  filterState[key] = value;
  saveFilters(filterState);
  if (!skipRender) {
    render();
  }
}

/**
 * Handler para digitação no campo de busca (com debounce de 250ms).
 * Ignora inputs que não sejam do campo de busca (ex.: formulário do modal).
 * @param {Event} e
 */
function handleSearchInput(e) {
  // Só processa o campo de busca — ignora inputs do modal
  if (e.target.id !== 'filter-search') return;

  const value = e.target.value;
  filterState.searchText = value;
  saveFilters(filterState);

  // Limpa debounce anterior
  if (searchDebounce !== null) {
    clearTimeout(searchDebounce);
  }

  // Agenda re-render após 250ms de inatividade
  searchDebounce = setTimeout(() => {
    searchDebounce = null;
    render();
  }, 250);
}

/**
 * Handler para mudança nos selects de filtro (tag, prioridade, prazo).
 * @param {Event} e
 */
function handleFilterChange(e) {
  const id = e.target.id;
  const value = e.target.value;

  if (id === 'filter-tag') {
    updateFilter('tag', value);
  } else if (id === 'filter-priority') {
    updateFilter('priority', value);
  } else if (id === 'filter-due') {
    updateFilter('dueDate', value);
  }
}

/**
 * Registra os event listeners para os campos de filtro.
 * Usa delegation no #app (container estável que sobrevive a re-renders).
 */
function registerFilterHandlers() {
  const app = document.getElementById('app');
  if (!app) return;

  app.addEventListener('input', handleSearchInput);

  app.addEventListener('change', handleFilterChange);
}

// ============================================================
// DRAG & DROP — Fase 4
// ============================================================

/** Estado de drag atual (elemento arrastado + seu ID). */
let dragData = null;  // { id: string, element: HTMLElement }

/** Flag: um drag ocorceu neste turno — suprime o próximo click (evita abrir modal após drag). */
let suppressNextClick = false;

/**
 * Encontra a column-body mais próxima de um elemento.
 * @param {HTMLElement} el
 * @returns {HTMLElement|null}
 */
function findColumnBody(el) {
  return el ? el.closest('.column-body') : null;
}

/**
 * Calcula onde soltar o card dentro da coluna-alvo com base na posição Y
 * do cursor em relação aos cards existentes.
 * @param {HTMLElement} columnBody - elemento .column-body de destino
 * @param {number} clientY - posição Y do cursor
 * @returns {number} índice (0-based) onde o card deve ser inserido
 */
function calcDropIndex(columnBody, clientY) {
  const cards = Array.from(columnBody.querySelectorAll('.card:not(.dragging)'));
  if (cards.length === 0) return 0;

  for (let i = 0; i < cards.length; i++) {
    const rect = cards[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (clientY < midY) {
      return i;
    }
  }
  return cards.length;
}

// ---------- Drag (desktop, HTML5 Drag API) ----------

/**
 * Inicia o drag de um card.
 * @param {DragEvent} e
 */
function handleDragStart(e) {
  const card = e.target.closest('.card');
  if (!card || card.getAttribute('draggable') !== 'true') return;

  dragData = { id: card.dataset.taskId, element: card };
  card.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', card.dataset.taskId);
}

/**
 * Permite o drop e destaca a coluna-alvo.
 * Calcula e mostra um placeholder visual na posição de drop.
 * @param {DragEvent} e
 */
function handleDragOver(e) {
  if (!dragData) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const colBody = findColumnBody(e.target);
  if (!colBody) return;

  // Destaca a coluna inteira
  colBody.closest('.column').classList.add('drag-over');

  // Remove placeholder anterior
  removePlaceholder();

  // Calcula posição e insere placeholder
  const dropIndex = calcDropIndex(colBody, e.clientY);
  const placeholder = createPlaceholder();
  const cards = Array.from(colBody.querySelectorAll('.card:not(.dragging)'));

  if (dropIndex >= cards.length) {
    colBody.appendChild(placeholder);
  } else {
    colBody.insertBefore(placeholder, cards[dropIndex]);
  }
}

/**
 * Remove destaque da coluna ao sair.
 * @param {DragEvent} e
 */
function handleDragLeave(e) {
  if (!dragData) return;

  const colBody = findColumnBody(e.target);
  if (!colBody) return;

  // Só remove destaque se realmente saiu da coluna (não entrou em um filho)
  const related = e.relatedTarget;
  if (related && colBody.contains(related)) return;
  if (related && colBody.closest('.column') === related.closest('.column')) return;

  colBody.closest('.column').classList.remove('drag-over');
}

/**
 * Executa o drop — move a tarefa para a nova coluna/posição.
 * @param {DragEvent} e
 */
function handleDrop(e) {
  if (!dragData) return;
  e.preventDefault();

  const colBody = findColumnBody(e.target);
  if (!colBody) return;

  const newStatus = colBody.dataset.status;
  const dropIndex = calcDropIndex(colBody, e.clientY);
  const taskId = dragData.id;
  const task = getTaskById(taskId);

  if (task && task.status !== newStatus) {
    // Moveu entre colunas
    moveTask(taskId, newStatus, dropIndex);
    animateDroppedCard = taskId;
  } else if (task && task.status === newStatus) {
    // Reordenou dentro da mesma coluna
    moveTask(taskId, newStatus, dropIndex);
    animateDroppedCard = taskId;
  }

  // Limpeza visual
  colBody.closest('.column').classList.remove('drag-over');
  removePlaceholder();

  render();
}

/**
 * Limpa o estado após o drag terminar (mesmo se cancelado).
 * @param {DragEvent} e
 */
function handleDragEnd(e) {
  if (!dragData) return;

  dragData.element.classList.remove('dragging');
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  removePlaceholder();
  dragData = null;
  suppressNextClick = true;
}

// ---------- Placeholder visual ----------

/**
 * Cria o placeholder "fantasma" que mostra onde o card vai pousar.
 * @returns {HTMLElement}
 */
function createPlaceholder() {
  const ph = document.createElement('div');
  ph.className = 'card-placeholder';
  ph.innerHTML = '<div class="card-placeholder-inner"></div>';
  return ph;
}

/**
 * Remove qualquer placeholder existente.
 */
function removePlaceholder() {
  document.querySelectorAll('.card-placeholder').forEach(el => el.remove());
}

// ---------- Touch fallback (mobile) ----------

/**
 * Estado de touch-drag para mobile.
 * @type {{ id: string, ghost: HTMLElement, startX: number, startY: number, origColumn: HTMLElement }|null}
 */
let touchData = null;

/**
 * Inicia o touch drag.
 * @param {TouchEvent} e
 */
function handleTouchStart(e) {
  if (e.target.closest('.card-delete-btn')) return;  // não interfere no botão delete
  const card = e.target.closest('.card');
  if (!card) return;

  const touch = e.touches[0];
  const rect = card.getBoundingClientRect();

  touchData = {
    id: card.dataset.taskId,
    ghost: null,
    startX: touch.clientX,
    startY: touch.clientY,
    origColumn: card.closest('.column-body'),
    originalCard: card,
    offsetX: touch.clientX - rect.left,
    offsetY: touch.clientY - rect.top,
    moved: false,
  };

  // Não preventDefault aqui — deixamos o scroll funcionar até o usuário mover o suficiente
}

/**
 * Move o card fantasma durante o touch drag.
 * @param {TouchEvent} e
 */
function handleTouchMove(e) {
  if (!touchData) return;

  const touch = e.touches[0];
  const dx = touch.clientX - touchData.startX;
  const dy = touch.clientY - touchData.startY;

  // Se ainda não moveu o suficiente, não inicia drag (evita conflito com scroll)
  if (!touchData.moved) {
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      touchData.moved = true;
    } else {
      return;
    }
  }

  e.preventDefault();  // agora sim, impede o scroll

  // Cria o fantasma na primeira vez
  if (!touchData.ghost) {
    const card = touchData.originalCard;
    const ghost = card.cloneNode(true);
    ghost.className = 'card ghost-card';
    ghost.style.width = card.getBoundingClientRect().width + 'px';
    document.body.appendChild(ghost);
    touchData.ghost = ghost;
    card.classList.add('dragging');

    // Esconde o card original
    card.style.opacity = '0.3';
  }

  // Posiciona o fantasma
  const ghost = touchData.ghost;
  ghost.style.left = (touch.clientX - touchData.offsetX) + 'px';
  ghost.style.top = (touch.clientY - touchData.offsetY) + 'px';

  // Detecta coluna sob o dedo
  const elBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  const colBody = findColumnBody(elBelow);

  // Limpa destacamentos anteriores
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  removePlaceholder();

  if (colBody) {
    colBody.closest('.column').classList.add('drag-over');
    const dropIndex = calcDropIndex(colBody, touch.clientY);
    const placeholder = createPlaceholder();
    const cards = Array.from(colBody.querySelectorAll('.card:not(.dragging)'));

    if (dropIndex >= cards.length) {
      colBody.appendChild(placeholder);
    } else {
      colBody.insertBefore(placeholder, cards[dropIndex]);
    }
  }
}

/**
 * Finaliza o touch drag — solta o card na coluna detectada.
 * @param {TouchEvent} e
 */
function handleTouchEnd(e) {
  if (!touchData) return;

  const touch = e.changedTouches[0];

  if (touchData.moved) {
    const elBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const colBody = findColumnBody(elBelow);

    if (colBody) {
      const newStatus = colBody.dataset.status;
      const dropIndex = calcDropIndex(colBody, touch.clientY);
      moveTask(touchData.id, newStatus, dropIndex);
      animateDroppedCard = touchData.id;
      render();
    } else {
      // Volta ao normal se não soltou em uma coluna
      if (touchData.originalCard) {
        touchData.originalCard.style.opacity = '';
      }
    }
  }

  // Limpeza
  if (touchData.ghost) touchData.ghost.remove();
  if (touchData.originalCard) {
    touchData.originalCard.classList.remove('dragging');
    touchData.originalCard.style.opacity = '';
  }
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  removePlaceholder();
  touchData = null;
  suppressNextClick = true;
}

/**
 * Cancela o touch drag (ex.: interrompido pelo sistema).
 */
function handleTouchCancel() {
  if (!touchData) return;

  if (touchData.ghost) touchData.ghost.remove();
  if (touchData.originalCard) {
    touchData.originalCard.classList.remove('dragging');
    touchData.originalCard.style.opacity = '';
  }
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  removePlaceholder();
  touchData = null;
}

// ---------- Drag registration ----------

/**
 * Registra todos os event listeners de drag & drop (desktop + touch).
 * Usa delegation no container #board para funcionar após re-renders.
 */
function registerDragHandlers() {
  const app = document.getElementById('app');
  if (!app) return;

  // Desktop (HTML5 Drag API) — delegação no #app (não é destruído no re-render)
  app.addEventListener('dragstart', handleDragStart);
  app.addEventListener('dragover', handleDragOver);
  app.addEventListener('dragleave', handleDragLeave);
  app.addEventListener('drop', handleDrop);
  app.addEventListener('dragend', handleDragEnd);

  // Mobile (touch fallback)
  app.addEventListener('touchstart', handleTouchStart, { passive: true });
  app.addEventListener('touchmove', handleTouchMove, { passive: false });
  app.addEventListener('touchend', handleTouchEnd);
  app.addEventListener('touchcancel', handleTouchCancel);
}

/**
 * Inicialização — renderiza a UI e registra eventos globais.
 */
function init() {
  console.log('Task Board — Fase 6: Resumo e Indicadores');

  // Carrega filtros salvos do localStorage
  filterState = getFilters();

  render();

  // Event delegation no container principal
  const app = document.getElementById('app');
  if (app) {
    app.addEventListener('click', handleClick);
    app.addEventListener('click', handleCardClick);
  }

  // Filtros e busca (delegation no container estável)
  registerFilterHandlers();

  // Drag & drop (desktop + touch)
  registerDragHandlers();

  // Teclado
  document.addEventListener('keydown', handleKeydown);
}

// Inicializa quando o DOM está pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
