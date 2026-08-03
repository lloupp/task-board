// utils.js — Funções utilitárias

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function saveToStorage(key, data) {
  try {
    localStorage.setItem(`tb_${key}`, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Erro ao salvar:', e);
    return false;
  }
}

export function loadFromStorage(key, fallback = null) {
  try {
    const data = localStorage.getItem(`tb_${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error('Erro ao carregar:', e);
    return fallback;
  }
}

export function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export function daysUntilDue(dueDate) {
  if (!dueDate) return null;
  const diff = new Date(dueDate) - new Date(new Date().toDateString());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
