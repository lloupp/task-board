// summary.js — Resumo semanal e indicadores de produtividade

import { isOverdue, daysUntilDue, formatDate } from './utils.js';
import { getTasks } from './tasks.js';

/**
 * Calcula todos os indicadores de produtividade a partir da lista de tarefas.
 *
 * @param {Array} tasks — lista completa de tarefas
 * @returns {Object} {
 *   byStatus:    { todo, doing, done },
 *   overdue:     Array de tarefas atrasadas,
 *   overdueCount: number,
 *   completedThisWeek: number,
 *   completedByDay:     Array<{ date: Date, count: number, label: string }>,  // últimos 7 dias
 *   totalCompleted:     number,
 * }
 */
export function computeSummary(tasks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // --- Contagem por status ---
  const byStatus = { todo: 0, doing: 0, done: 0 };
  for (const t of tasks) {
    const s = t.status || 'todo';
    if (byStatus[s] !== undefined) byStatus[s]++;
  }

  // --- Tarefas atrasadas (status ≠ done, dueDate < hoje) ---
  const overdue = tasks.filter(
    t => t.status !== 'done' && t.dueDate && isOverdue(t.dueDate)
  );
  const overdueCount = overdue.length;

  // --- Concluídas na semana (completedAt nos últimos 7 dias) ---
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6); // 7 dias incluindo hoje
  weekAgo.setHours(0, 0, 0, 0);

  let completedThisWeek = 0;
  const totalCompleted = byStatus.done;

  // --- Array dos últimos 7 dias para o mini-gráfico ---
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push({
      date: d,
      count: 0,
      label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      dayLabel: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    });
  }

  // Conta concluídas por dia
  for (const t of tasks) {
    if (t.status === 'done' && t.completedAt) {
      const cDate = new Date(t.completedAt);
      cDate.setHours(0, 0, 0, 0);

      // Verifica se está nos últimos 7 dias
      for (let i = 0; i < days.length; i++) {
        if (days[i].date.getTime() === cDate.getTime()) {
          days[i].count++;
          completedThisWeek++;
          break;
        }
      }
    }
  }

  return {
    byStatus,
    overdue,
    overdueCount,
    completedThisWeek,
    completedByDay: days,
    totalCompleted,
  };
}

/**
 * Desenha o mini gráfico de produtividade em um elemento <canvas>.
 * Mostra barras de tarefas concluídas por dia nos últimos 7 dias.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{date:Date,count:number,label:string,dayLabel:string}>} data — últimos 7 dias
 */
export function drawProductivityChart(canvas, data) {
  if (!canvas || !data) return;

  const ctx = canvas.getContext('2d');

  // Escala para retina/HiDPI
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 280;
  const cssH = canvas.clientHeight || 100;

  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  ctx.scale(dpr, dpr);

  // Limpa
  ctx.clearRect(0, 0, cssW, cssH);

  // Config
  const maxCount = Math.max(1, ...data.map(d => d.count));
  const labelH = 22;     // espaço para labels dos dias
  const chartH = cssH - labelH - 8;
  const chartW = cssW - 20;
  const marginLeft = 10;
  const barGap = 6;
  const barW = (chartW - barGap * (data.length - 1)) / data.length;

  // Cores do tema (matches --accent / --green)
  const colorBar = '#f59e0b';       // --accent
  const colorBarToday = '#22c55e';  // --green
  const textColor = '#5c6373';     // --text-muted
  const gridColor = 'rgba(30, 37, 53, 0.6)'; // --border com transparência

  // Linha de baseline
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const baselineY = chartH + 4;
  ctx.moveTo(marginLeft, baselineY);
  ctx.lineTo(marginLeft + chartW, baselineY);
  ctx.stroke();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Barras
  data.forEach((d, i) => {
    const x = marginLeft + i * (barW + barGap);
    const h = (d.count / maxCount) * chartH;
    const y = baselineY - h;

    const isToday = d.date.getTime() === today.getTime();

    // barra
    if (d.count > 0) {
      ctx.fillStyle = isToday ? colorBarToday : colorBar;
      // barra arredondada no topo
      const radius = 3;
      ctx.beginPath();
      ctx.moveTo(x, baselineY);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.lineTo(x + barW - radius, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
      ctx.lineTo(x + barW, baselineY);
      ctx.closePath();
      ctx.fill();

      // número acima da barra
      ctx.fillStyle = textColor;
      ctx.font = '600 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(d.count), x + barW / 2, y - 4);
    } else {
      // barrinha de "0"
      ctx.fillStyle = gridColor;
      const zeroH = 2;
      ctx.fillRect(x, baselineY - zeroH, barW, zeroH);
    }

    // Label do dia
    ctx.fillStyle = isToday ? colorBarToday : textColor;
    ctx.font = isToday ? '600 9px Inter, sans-serif' : '400 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barW / 2, cssH - 8);
  });
}

/**
 * Monta o HTML do painel de resumo e indicadores.
 *
 * @param {Array} tasks — lista completa de tarefas
 * @returns {string} HTML do painel
 */
export function renderSummaryPanel(tasks) {
  const s = computeSummary(tasks);

  return `
    <div class="summary-panel" id="summary-panel">
      <div class="summary-cards">
        <div class="summary-card summary-card-total">
          <span class="summary-icon">🗂️</span>
          <div class="summary-info">
            <span class="summary-value">${tasks.length}</span>
            <span class="summary-label">Total</span>
          </div>
        </div>
        <div class="summary-card summary-card-todo">
          <span class="summary-icon">📋</span>
          <div class="summary-info">
            <span class="summary-value">${s.byStatus.todo}</span>
            <span class="summary-label">A Fazer</span>
          </div>
        </div>
        <div class="summary-card summary-card-doing">
          <span class="summary-icon">⚡</span>
          <div class="summary-info">
            <span class="summary-value">${s.byStatus.doing}</span>
            <span class="summary-label">Fazendo</span>
          </div>
        </div>
        <div class="summary-card summary-card-done">
          <span class="summary-icon">✅</span>
          <div class="summary-info">
            <span class="summary-value">${s.byStatus.done}</span>
            <span class="summary-label">Concluídas</span>
          </div>
        </div>
        <div class="summary-card summary-card-overdue ${s.overdueCount > 0 ? 'summary-warn' : ''}">
          <span class="summary-icon">${s.overdueCount > 0 ? '⚠️' : '🗓️'}</span>
          <div class="summary-info">
            <span class="summary-value ${s.overdueCount > 0 ? 'value-warn' : ''}">${s.overdueCount}</span>
            <span class="summary-label">Atrasadas</span>
          </div>
        </div>
        <div class="summary-card summary-card-week">
          <span class="summary-icon">📈</span>
          <div class="summary-info">
            <span class="summary-value">${s.completedThisWeek}</span>
            <span class="summary-label">Concluídas na semana</span>
          </div>
        </div>
      </div>
      <div class="summary-chart-wrap">
        <div class="summary-chart-title">
          <span class="chart-icon">📊</span>
          Produtividade — últimos 7 dias
        </div>
        <canvas id="summary-chart" class="summary-chart"></canvas>
      </div>
    </div>
  `;
}

/**
 * Após o re-render, redesenha o mini gráfico no canvas do painel de resumo.
 */
export function refreshChart() {
  const canvas = document.getElementById('summary-chart');
  if (!canvas) return;

  const tasks = getTasks();
  const s = computeSummary(tasks);
  drawProductivityChart(canvas, s.completedByDay);
}
