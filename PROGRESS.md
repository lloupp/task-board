# Task Board — Plano de Desenvolvimento Incremental

## Skill de referência: `task-board-kanban-builder`
TODAS as fases devem seguir a skill `task-board-kanban-builder` (carregada no cron).
Ela contém o schema de dados, fluxo de UX, features, boas práticas e pitfalls.
A Fase 1 (pesquisa) pode ATUALIZAR essa skill com novos conhecimentos.

## Status: Fase 4 concluída — próxima: Fase 5

## Fases

### Fase 1 — Pesquisa de mercado [CONCLUÍDO — 03/08/2026]
- Pesquisar: Trello, Asana, Notion, Linear, Monday — features de quadros Kanban
- Identificar o que faz um bom drag & drop UX
- Validar schema de dados contra apps reais
- ATUALIZAR a skill `task-board-kanban-builder` com aprendizados
- Commit: `docs: Fase 1 — pesquisa + skill`

### Fase 2 — Layout e Quadro Base [CONCLUÍDO — 03/08/2026]
- Header com título "Task Board"
- 3 colunas: A Fazer | Fazendo | Concluído
- Empty state em cada coluna
- CSS: grid de colunas, cards, tema escuro, responsivo
- Commit: `feat: layout e quadro base`

### Fase 3 — CRUD de Tarefas [CONCLUÍDO — 03/08/2026]
- Formulário: título, descrição, prioridade, tags, prazo
- Card visual com prioridade colorida, tags, prazo
- Editar (modal) e excluir com confirmação
- localStorage `tb_tasks`
- Commit: `feat: CRUD de tarefas`

### Fase 4 — Drag & Drop [CONCLUÍDO — 04/08/2026]
- Mover cards entre colunas (HTML5 Drag and Drop API)
- Reordenar dentro da mesma coluna
- Atualizar status ao mover
- Animação visual no drop
- Salvar ordem automaticamente
- Commit: `feat: drag and drop`

### Fase 5 — Filtros e Busca [PENDENTE]
- Busca por texto (título + descrição)
- Filtro por tag, prioridade, prazo
- Limpar filtros
- Commit: `feat: filtros e busca`

### Fase 6 — Resumo e Indicadores [PENDENTE]
- Contador por coluna (badge no header)
- Tarefas atrasadas (destaque visual)
- Concluídas na semana (contador)
- Mini gráfico de produtividade (Canvas)
- Commit: `feat: resumo e indicadores`

### Fase 7 — Polimento e UX [PENDENTE]
- Animações, toast, modal de confirmação
- Responsividade mobile (colunas horizontais com scroll)
- Keyboard shortcuts (N = nova, / = busca)
- Validação completa
- Commit: `feat: polimento e UX`

### Fase 8 — Deploy no GitHub Pages [PENDENTE]
- Configurar GitHub Pages
- Verificar funcionamento
- Atualizar README
- Commit: `deploy: GitHub Pages`

## Regras do cron
1. Ler este arquivo para saber qual fase executar
2. Implementar a fase completa
3. Testar (sintaxe JS, HTML, localStorage)
4. Commit + push
5. Atualizar status
6. Reportar
