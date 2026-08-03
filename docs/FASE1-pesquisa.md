# Fase 1 — Pesquisa de Mercado

## Objetivo
Estudar as principais ferramentas de Kanban pessoal (Trello, Asana, Notion, Linear, Monday) e extrair aprendizados aplicáveis ao Task Board — um quadro Kanban 100% client-side, HTML+CSS+JS vanilla, sem backend.

## Análise por ferramenta

### Trello
- **Pontos fortes:** Drag & drop fluido entre listas; cards com labels coloridas, checklist, data de vencimento, membros; visual minimalista; poderoso no foreground da simplicidade.
- **UX de destaque:** Card flip (clica card → abre painel lateral); placeholder visual durante o drag (sombra/card fantasma); indicação clara de zona de drop; contador de cards na lista.
- **Learnings para Task Board:** Placeholder fantasma no drag; abrir card em modal/painel ao clicar; labels viram tags com cores; prazo com indicador de atraso visual.

### Asana
- **Pontos fortes:** Múltiplas visualizações (lista, quadro, timeline, calendário); prioridade com cores distintas; subtarefas inline; follow Tags; data de vencimento com warning gradual (azul → amarelo → vermelho).
- **UX de destaque:** Prioridade marcada por cor de faixa lateral do card; subtasks com checkbox; indicador "due soon" dois dias antes; avatar do responsável no card.
- **Learnings:** Faixa lateral colorida por prioridade; badge de responsável; warning de prazo com gradiente (verde→amarelo→vermelho conforme aproxima).

### Notion
- **Pontos fortes:** Flexibilidade extrema; boards com campos customizados; drag & drop funciona mas com menor fluidez que Trello; tags como select/multi-select.
- **UX de destaque:** Database views com filtros e sorts persistentes; agrupamento por field (tag, prioridade, responsável); inline update sem abrir card.
- **Learnings:** Filtros persistentes salvos em localStorage (`tb_settings`); múltiplas formas de visualizar (se quisermos pós-MVP); tags como multi-select.

### Linear
- **Pontos fortes:** Performance extremamente rápida; atalhos de teclado (N para nova issue, / para search); prioridade: Urgente/Alta/Média/Baixa/Nenhuma; status: Backlog/Todo/In Progress/Done/Cancelled; estimativas em story points.
- **UX de destaque:** Cmd+K ou / para comando global; prioridade mostrada como ícone colorido; não usa drag em mobile (usa menu de ação); avatares; workflow states customizáveis.
- **Learnings:** Keyboard shortcuts (N = nova tarefa, / = buscar); prioridade com ícone visual compacto; foco em performance (renderização rápida).

### Monday.com
- **Pontos fortes:** Cores vibrantes como COLUNAS de propriedades; timeline/Gantt; automações (quando card move → notifica); pulse (item) visualmente rico.
- **UX de destaque:** Status column colorida (todo/working done → cada um com cor); team workload: ver quantas tarefas estão em "doing" por pessoa.
- **Learnings:** WIP limit (Work In Progress) com destaque visual se ultrapassado; cores vibrantes para status/prioridade; automação de notificação ao mover.

## Síntese: o que faz um bom drag & drop UX

1. **Placeholder/fantasma visual** durante o drag — mostra onde o card vai pousar.
2. **Zona de drop destacada** — coluna "acendida" ao passar o card por cima.
3. **Feedback imediato** — status da tarefa atualizado logo ao soltar, card com animação.
4. **Cursor grab/grabbing** — muda o cursor para indicar que é arrastável.
5. **Mobile fallback** — HTML5 Drag API não funciona em touch; usar Touch Events com pointer events ou polyfill.
6. **Reordenação dentro da mesma coluna** — não só mover entre colunas, mas reordenar.

## Validação do schema de dados

O schema atual da skill `task-board-kanban-builder` cobre:
- ✅ Campos essenciais (id, title, description, status, priority, tags, dueDate, assignee, order)
- ✅ Timestamps (createdAt, updatedAt, completedAt)
- ✅ Status simplificado (todo|doing|done) — adequado para Kanban pessoal
- ✅ Prioridade (baixa|media|alta|urgente) — match com Linear/Trello
- ✅ order numérico — necessário para reordenação por drag
- ✅ completedAt — útil para resumo semanal (concluídas na semana)

### Melhorias identificadas (pós-MVP):
- **subtasks** — Linear e Trello têm; implementável como array附within task
- **storyPoints / estimate** — Linear tem; bom para planning
- **customFields** — Monday/Notion têm; mas adiciona complexidade acima do escopo
- **color/label color** — para tags com cor visual (Trello labels)

### Nenhuma mudança no schema base necessária
O schema definido na skill é suficiente para todo o MVP. As melhorias são features pós-MVP documentadas.

## Atualizações aplicadas na skill

Apêndice "Insights de Pesquisa (Fase 1)" adicionado à skill com:
- Princípios de drag & drop UX
- Cores e prioridades
- Keyboard shortcuts priorizados
- WIP limit como feature pós-MVP validada
- Mobile fallback com Touch Events

## Conclusão

A pesquisa validou o schema e as features definidas na skill. Nenhuma mudança estrutural é necessária. Os aprendizados sobre UX de drag & drop e keyboard shortcuts foram incorporados para guiar as próximas fases.
