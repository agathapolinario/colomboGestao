# Colombo · Gestão e Equipe (novas áreas)

Protótipo estático (sem servidor). Abra `web/index.html`. Os dados ficam no localStorage do navegador.

## Como entrar
1. `Primeiro acesso` do cargo (links nas telas de login) → cria a conta.
2. Login em **Coordenação** (4 cargos: manhã 1 e 2, tarde 1 e 2), **Direção** (diretor(a) + 3 vice-diretores) ou **Equipe** (agente escolar, segurança, limpeza, secretaria, GOE, cuidadora, AEE). Escolha o cargo na lista.
3. Em *Meu perfil* → **Carregar demonstração** para ver a escola "em movimento" (e **Limpar demonstração** para remover).

## Gestão (coordenação e direção)
Chat (equipe, professores, famílias, alunos) · Ocorrências · **Suspensões** (aparecem para aluno, responsável, professor, coordenação, direção e equipe; aluno e responsável dão "Estou ciente") · Convocações · Comunicados e calendário · Reuniões · Aluno 360 · Busca ativa · Saída antecipada · **Pedidos da escola** (quadro, prazos, aprovação da direção, avaliação) · Chamados · Professores ausentes e substituições · Portaria · Reservas · Prazos · Relatórios (imprimir/CSV) · Tarefas · Aprovações (direção) · Botão **Emergência (SOS)** em todos os painéis.

## Equipe
- **Secretaria**: chamada diária por turma, fila de atendimento com senhas, justificativas/atestados, cadastro e conferência de documentos, pendências, matrículas e transferências, declarações com protocolo e código, pedidos de documentos dos alunos, protocolo/arquivo.
- **GOE**: funcionários, ponto, escala (cada um vê a sua), patrimônio, estoque com alerta de mínimo (gera pedido), merenda/cardápio (aparece para alunos), finanças.
- **Agente escolar**: alunos fora de sala, atrasos, rondas, saídas, relatos. **Segurança**: visitantes com crachá, rondas, incidentes, achados e perdidos. **Limpeza**: checklist do dia, "acabou material" em um toque. **Cuidadora**: registro diário (a família vê). **AEE**: atendimentos e evolução.

## Professor
Novo: *Pedidos e chamados* (à limpeza, agentes, gestão), suspensões e registros da gestão sobre seus alunos.

Arquivos novos: `js/cargos.js, gestao.js, org*.js, painel-org.js, gvis.js`, `css/painel-org.css`, `painel-gestao.html`, `painel-equipe.html`, `direcao.html`.
