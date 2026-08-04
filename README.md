# 📋 Task Board — Quadro Kanban Pessoal

> 🚀 **Online**: [https://lloupp.github.io/task-board/](https://lloupp.github.io/task-board/)

Quadro Kanban web para organizar tarefas: arrastar e soltar entre colunas, prioridades, tags, prazos e resumo de produtividade. 100% client-side, sem backend, sem build — abre direto no navegador.

## Recursos

- 🗂️ **3 colunas** — A Fazer | Fazendo | Concluído
- 🖱️ **Drag & Drop** — mover cards entre colunas (HTML5 Drag API + fallback touch para mobile)
- 🔄 **Reordenar** — arraste cards dentro da mesma coluna
- 🔴🟡🟢 **Prioridades** — urgente, alta, média, baixa com cores e badges
- 🏷️ **Tags** — categorize tarefas livremente
- 📅 **Prazos** — data limite com indicador visual gradual de atraso (verde → amarelo → vermelho)
- 🔍 **Filtros** — por tag, prioridade, prazo e busca por texto
- 📊 **Resumo** — contador por coluna, atrasadas, concluídas na semana + mini gráfico de produtividade (Canvas)
- 💾 **Offline** — dados salvos no navegador (localStorage, prefixo `tb_`)
- 🌙 **Tema escuro** nativo
- 📱 **Responsivo** — celular, tablet e desktop (colunas com scroll horizontal no mobile)
- ⌨️ **Atalhos** — `N` = nova tarefa, `/` = busca, `Esc` = fechar modal
- 🔔 **Toast notifications** — feedback visual para criar, editar, excluir e mover
- ✅ **Confirmação** — modal custom ao excluir tarefas

## Tech Stack

- **HTML5** (Drag and Drop API, Canvas API)
- **CSS3** (Grid, Flexbox, animações, scroll-snap)
- **JavaScript vanilla** (ES modules, sem frameworks, sem build)
- **localStorage** para persistência (prefixo `tb_`)

## Estrutura

```
task-board/
├── index.html              — HTML base
├── css/style.css           — estilos (tema escuro, responsivo, animações)
├── js/
│   ├── app.js              — orquestra UI, modal, event delegation
│   ├── board.js            — renderiza colunas e cards
│   ├── tasks.js            — CRUD de tarefas, lógica de movimentação
│   ├── filters.js          — filtros e busca
│   ├── summary.js          — resumo e mini gráfico de produtividade
│   ├── toast.js            — toast notifications
│   └── utils.js            — storage, escape HTML, helpers de data
└── .nojekyll               — desativa Jekyll no GitHub Pages
```

## Como usar

1. **Online**: acesse [lloupp.github.io/task-board](https://lloupp.github.io/task-board/)
2. **Local**: clone o repositório e abra `index.html` no navegador.

```bash
git clone https://github.com/lloupp/task-board.git
cd task-board
# abra index.html no navegador
```

**Atalhos de teclado**: `N` para nova tarefa · `/` para buscar · `Esc` para fechar modais

## Desenvolvimento

Projeto construído incrementalmente em 8 fases via cron jobs no Hermes Agent:

1. ✅ Pesquisa de mercado (Trello, Asana, Linear, Monday, Notion)
2. ✅ Layout e quadro base
3. ✅ CRUD de tarefas
4. ✅ Drag & drop (desktop + mobile touch fallback)
5. ✅ Filtros e busca
6. ✅ Resumo, indicadores e mini gráfico
7. ✅ Polimento e UX (toast, confirmação, atalhos, responsividade)
8. ✅ Deploy no GitHub Pages

## Licença

MIT
