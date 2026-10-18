/* Colombo · GOE (gestão de pessoal, patrimônio, materiais, merenda e finanças) */
(() => {
  'use strict';
  const O = window.ORG, { V, A, F, C, BADGE, esc, ic, ld, sv, id, now, hoje, dt, pill, toast, vazio, optHtml } = O;
  const FUNCOES = ['Agente escolar', 'Segurança', 'Limpeza', 'Secretaria', 'GOE', 'Cuidadora', 'AEE', 'Cozinha / merenda', 'Vigia noturno', 'Outro'];

  /* ---------- pessoal ---------- */
  O.crud({
    key: 'pessoal', t: 'Quadro de pessoal', n: 'Funcionários', i: 'users', store: 'goe_func', edit: true, csv: true, novo: 'Cadastrar funcionário',
    intro: 'Cadastro da equipe de apoio. Informe o login do app para que a pessoa veja a própria escala.',
    campos: [{ n: 'nome', l: 'Nome', req: 1 }, { n: 'funcao', l: 'Função', tipo: 'sel', op: FUNCOES }, { n: 'turno', l: 'Turno', tipo: 'sel', op: ['Manhã', 'Tarde', 'Integral', 'Noite'] }, { n: 'tel', l: 'Telefone' }, { n: 'login', l: 'Login no app (opcional)' }, { n: 'vinculo', l: 'Vínculo', tipo: 'sel', op: ['Efetivo', 'Terceirizado', 'Contrato', 'Readaptado'] }, { n: 'adm', l: 'Admissão', tipo: 'date' }, { n: 'st', l: 'Situação', tipo: 'sel', op: ['Ativo', 'Afastado', 'Férias', 'Desligado'] }],
    cols: [['nome', 'Nome'], ['funcao', 'Função'], ['turno', 'Turno'], ['tel', 'Telefone'], ['vinculo', 'Vínculo'], ['st', 'Situação', (v) => pill(v === 'Ativo' ? 'ok' : v === 'Desligado' ? 'bad' : 'warn', v)]],
    busca: ['nome', 'funcao'], filtros: [{ n: 'funcao', l: 'Função', op: FUNCOES }, { n: 'st', l: 'Situação', op: ['Ativo', 'Afastado', 'Férias', 'Desligado'] }], ordem: (a, b) => a.nome.localeCompare(b.nome),
    resumo: (l) => `<div class="kpis">${O.kpi('Ativos', l.filter((r) => r.st === 'Ativo').length, '', 'ok')}${O.kpi('Afastados / férias', l.filter((r) => ['Afastado', 'Férias'].includes(r.st)).length, '', 'warn')}${O.kpi('Cadastrados', l.length, '', '')}</div>`,
  });

  /* ---------- ponto / presença ---------- */
  const pt = { data: hoje() };
  V.ponto = {
    t: 'Presença da equipe', i: 'checkc', n: 'Ponto da equipe',
    r() {
      const f = ld('goe_func', []).filter((x) => x.st === 'Ativo'), reg = ld('goe_ponto', {})[pt.data] || {};
      const tot = (s) => f.filter((x) => (reg[x.id] || {}).st === s).length;
      return `<div class="kpis">${O.kpi('Presentes', tot('P'), '', 'ok')}${O.kpi('Faltas', tot('F'), '', tot('F') ? 'bad' : '')}${O.kpi('Atrasos', tot('A'), '', tot('A') ? 'warn' : '')}</div>
      <form class="card form" style="max-width:none" data-f="pontoSalva"><div class="filtros"><input type="date" data-ch="pt" data-n="data" value="${pt.data}" aria-label="Data" style="max-width:190px"></div>
      ${f.length ? `<div class="tscroll"><table><thead><tr><th>Funcionário</th><th>Função</th><th>Situação</th><th>Observação</th></tr></thead><tbody>${f.map((x) => `<tr><td>${esc(x.nome)}</td><td>${esc(x.funcao)} · ${esc(x.turno)}</td><td><select name="s_${x.id}">${optHtml([['', 'Não lançado'], ['P', 'Presente'], ['A', 'Atraso'], ['F', 'Falta'], ['J', 'Falta justificada'], ['FE', 'Folga / escala']], (reg[x.id] || {}).st || '')}</select></td><td><input name="o_${x.id}" value="${esc((reg[x.id] || {}).obs || '')}" maxlength="80"></td></tr>`).join('')}</tbody></table></div><button class="btn" style="justify-self:start">Salvar presença</button>` : vazio('Cadastre os funcionários em Funcionários.')}</form>`;
    },
  };
  C.pt = (el) => { pt[el.dataset.n] = el.value; };
  F.pontoSalva = (d) => { const all = ld('goe_ponto', {}), r = {}; ld('goe_func', []).forEach((x) => { if (d['s_' + x.id]) r[x.id] = { st: d['s_' + x.id], obs: d['o_' + x.id] || '' }; }); all[pt.data] = r; sv('goe_ponto', all); toast('Presença salva.'); };

  /* ---------- escala semanal ---------- */
  const DIAS5 = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  V.escala = {
    t: 'Escala semanal da equipe', i: 'cal', n: 'Escala',
    r() {
      const f = ld('goe_func', []).filter((x) => x.st === 'Ativo'), es = ld('goe_escala', {});
      return `<form class="card form" style="max-width:none" data-f="escalaSalva"><p class="muted">M = manhã · T = tarde · I = integral · F = folga</p>${f.length ? `<div class="tscroll"><table class="grade-esc"><thead><tr><th>Funcionário</th><th>Área / posto</th>${DIAS5.map((d) => `<th>${d.slice(0, 3)}</th>`).join('')}</tr></thead><tbody>${f.map((x) => `<tr><td>${esc(x.nome)}<br><small>${esc(x.funcao)}</small></td><td><input name="a_${x.id}" value="${esc((es[x.id] || {}).area || '')}" maxlength="40" placeholder="Pátio, bloco B…"></td>${DIAS5.map((d) => `<td><select name="${d}_${x.id}">${optHtml([['', '—'], ['M', 'M'], ['T', 'T'], ['I', 'I'], ['F', 'F']], (es[x.id] || {})[d] || '')}</select></td>`).join('')}</tr>`).join('')}</tbody></table></div><button class="btn" style="justify-self:start">Salvar escala</button>` : vazio('Cadastre os funcionários primeiro.')}</form>`;
    },
  };
  F.escalaSalva = (d) => { const es = {}; ld('goe_func', []).forEach((x) => { es[x.id] = { area: d['a_' + x.id] || '' }; DIAS5.forEach((di) => { es[x.id][di] = d[di + '_' + x.id] || ''; }); }); sv('goe_escala', es); toast('Escala salva. Cada funcionário vê a sua no app.'); };

  /* ---------- patrimônio ---------- */
  O.crud({
    key: 'patrimonio', t: 'Patrimônio e equipamentos', n: 'Patrimônio', i: 'box', store: 'goe_patr', edit: true, csv: true, novo: 'Cadastrar bem',
    campos: [{ n: 'tomb', l: 'Nº de tombamento', req: 1 }, { n: 'item', l: 'Descrição', req: 1 }, { n: 'local', l: 'Local / sala' }, { n: 'cat', l: 'Categoria', tipo: 'sel', op: ['Informática', 'Mobiliário', 'Áudio e vídeo', 'Esporte', 'Cozinha', 'Laboratório', 'Outro'] }, { n: 'estado', l: 'Estado', tipo: 'sel', op: ['Bom', 'Regular', 'Em manutenção', 'Inservível', 'Baixado'] }, { n: 'valor', l: 'Valor (R$)', tipo: 'num' }, { n: 'obs', l: 'Observação', larg: 1 }],
    cols: [['tomb', 'Tombo'], ['item', 'Item'], ['local', 'Local'], ['cat', 'Categoria'], ['estado', 'Estado', (v) => pill(v === 'Bom' ? 'ok' : v === 'Regular' ? '' : 'warn', v)], ['valor', 'Valor', (v) => O.brl(v), (v) => v]],
    busca: ['tomb', 'item', 'local'], filtros: [{ n: 'cat', l: 'Categoria', op: ['Informática', 'Mobiliário', 'Áudio e vídeo', 'Esporte', 'Cozinha', 'Laboratório', 'Outro'] }, { n: 'estado', l: 'Estado', op: ['Bom', 'Regular', 'Em manutenção', 'Inservível', 'Baixado'] }],
    valida: (r, outros) => (outros.some((x) => x.tomb === r.tomb) ? 'Esse número de tombamento já existe.' : null),
    resumo: (l) => `<div class="kpis">${O.kpi('Bens', l.length, '', '')}${O.kpi('Em manutenção', l.filter((r) => r.estado === 'Em manutenção').length, '', 'warn')}${O.kpi('Valor total', O.brl(l.filter((r) => r.estado !== 'Baixado').reduce((s, r) => s + (r.valor || 0), 0)), '', '')}</div>`,
  });

  /* ---------- estoque (com alerta de mínimo) ---------- */
  const baixo = (r) => Number(r.qtd) <= Number(r.min);
  O.crud({
    key: 'estoque', t: 'Estoque de materiais', n: 'Estoque', i: 'box', store: 'goe_estoque', edit: true, csv: true, novo: 'Novo item de estoque',
    intro: 'Quando a quantidade chega no mínimo, o item aparece em vermelho e você gera o pedido de compra com um clique.',
    campos: [{ n: 'item', l: 'Item', req: 1 }, { n: 'cat', l: 'Categoria', tipo: 'sel', op: ['Limpeza', 'Papelaria', 'Cozinha / merenda', 'Manutenção', 'Esporte', 'Outro'] }, { n: 'un', l: 'Unidade', ph: 'un, cx, kg, L' }, { n: 'qtd', l: 'Quantidade em estoque', tipo: 'num', req: 1 }, { n: 'min', l: 'Quantidade mínima', tipo: 'num' }],
    cols: [['item', 'Item'], ['cat', 'Categoria'], ['qtd', 'Em estoque', (v, r) => `${pill(baixo(r) ? 'bad' : 'ok', v + ' ' + (r.un || ''))}`, (v, r) => v], ['min', 'Mínimo']],
    busca: ['item'], filtros: [{ n: 'cat', l: 'Categoria', op: ['Limpeza', 'Papelaria', 'Cozinha / merenda', 'Manutenção', 'Esporte', 'Outro'] }],
    acoes: [{ k: 'baixa', l: '−1', fn: (r) => ({ ...r, qtd: Math.max(0, r.qtd - 1) }), ok: 'Saída registrada.' }, { k: 'mais', l: '+ Entrada', fn: (r) => { const q = O.num(prompt('Quantas unidades entraram?')); return q > 0 ? { ...r, qtd: r.qtd + q } : false; }, ok: 'Entrada registrada.' },
      { k: 'ped', l: 'Pedir compra', se: baixo, fn: (r) => { O.pedidos.novo({ titulo: `Reposição de estoque: ${r.item}`, desc: `Estoque em ${r.qtd} ${r.un || ''} (mínimo ${r.min}).`, cat: 'outros', prio: 'alta', setor: 'goe' }); return r; }, ok: 'Pedido de compra aberto.' }],
    resumo: (l) => `<div class="kpis">${O.kpi('Itens', l.length, '', '')}${O.kpi('Abaixo do mínimo', l.filter(baixo).length, 'precisam de reposição', l.some(baixo) ? 'bad' : 'ok')}</div>`,
  });
  BADGE.estoque = () => ld('goe_estoque', []).filter(baixo).length;

  /* ---------- merenda ---------- */
  const SEM = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  V.merenda = {
    t: 'Merenda escolar', i: 'cup',
    r() {
      const c = ld('cardapio', {}), reg = ld('merenda_dia', []).filter((x) => x.data === hoje()), dia = O.diaSem(hoje());
      return `<div class="grid"><form class="card form" data-f="cardSalva"><h2>Cardápio da semana</h2><p class="muted">Aparece para alunos e responsáveis.</p>${SEM.map((d) => `<label>${d}<input name="${d}" value="${esc(c[d] || '')}" maxlength="120" placeholder="Ex.: arroz, feijão, frango assado, salada"></label>`).join('')}<button class="btn">Publicar cardápio</button></form>
      <form class="card form" data-f="merendaDia"><h2>Registro de hoje ${dia ? '(' + dia + ')' : ''}</h2><label>Refeições servidas<input name="serv" inputmode="numeric" required></label><label>Sobra / desperdício (kg)<input name="sobra" inputmode="decimal"></label><label>Observação<input name="obs" maxlength="120" placeholder="Algum aluno com restrição, falta de item…"></label><button class="btn">Registrar</button>
      ${reg.length ? `<ul class="list">${reg.map((x) => `<li><span>${esc(x.serv)} refeições · sobra ${esc(x.sobra || 0)} kg<br><small class="muted">${esc(x.obs || '')} · ${esc(x.por)}</small></span></li>`).join('')}</ul>` : ''}</form></div>`;
    },
  };
  F.cardSalva = (d) => { sv('cardapio', SEM.reduce((o, k) => ({ ...o, [k]: d[k] || '' }), {})); toast('Cardápio publicado.'); };
  F.merendaDia = (d) => { sv('merenda_dia', [...ld('merenda_dia', []), { id: id(), data: hoje(), serv: d.serv, sobra: d.sobra, obs: d.obs, ts: now(), por: O.me().nome }]); toast('Registro salvo.'); };

  /* ---------- finanças ---------- */
  O.crud({
    key: 'financas', t: 'Controle financeiro (caixa escolar)', n: 'Finanças', i: 'wallet', store: 'goe_fin', edit: true, csv: true, periodo: 'data', periodoDef: '30', novo: 'Novo lançamento',
    intro: 'Entradas e saídas da escola, com categoria e nota. Útil para a prestação de contas.',
    campos: [{ n: 'data', l: 'Data', tipo: 'date', def: 'hoje', req: 1 }, { n: 'tipo', l: 'Tipo', tipo: 'sel', op: ['Saída', 'Entrada'] }, { n: 'cat', l: 'Categoria', tipo: 'sel', op: ['Material de consumo', 'Manutenção', 'Limpeza', 'Merenda', 'Eventos', 'Serviços', 'Repasse / verba', 'Outro'] }, { n: 'desc', l: 'Descrição', req: 1, larg: 1 }, { n: 'valor', l: 'Valor (R$)', tipo: 'num', req: 1 }, { n: 'nf', l: 'Nota / recibo nº' }, { n: 'forn', l: 'Fornecedor' }],
    cols: [['data', 'Data', (v) => dt(v)], ['tipo', 'Tipo', (v) => pill(v === 'Entrada' ? 'ok' : 'warn', v)], ['cat', 'Categoria'], ['desc', 'Descrição', (v, r) => `${esc(v)}<br><small>${esc(r.forn || '')} ${r.nf ? '· NF ' + esc(r.nf) : ''}</small>`], ['valor', 'Valor', (v, r) => `<b style="color:var(--${r.tipo === 'Entrada' ? 'ok' : 'danger'})">${r.tipo === 'Entrada' ? '+' : '−'} ${O.brl(v)}</b>`, (v) => v]],
    busca: ['desc', 'forn', 'nf'], filtros: [{ n: 'tipo', l: 'Tipo', op: ['Entrada', 'Saída'] }, { n: 'cat', l: 'Categoria', op: ['Material de consumo', 'Manutenção', 'Limpeza', 'Merenda', 'Eventos', 'Serviços', 'Repasse / verba', 'Outro'] }],
    ordem: (a, b) => b.data.localeCompare(a.data),
    resumo: (l) => { const e = l.filter((r) => r.tipo === 'Entrada').reduce((s, r) => s + r.valor, 0), s = l.filter((r) => r.tipo === 'Saída').reduce((t, r) => t + r.valor, 0); return `<div class="kpis">${O.kpi('Entradas', O.brl(e), 'total geral', 'ok')}${O.kpi('Saídas', O.brl(s), 'total geral', 'warn')}${O.kpi('Saldo', O.brl(e - s), '', e - s < 0 ? 'bad' : 'ok')}</div>`; },
  });
})();
