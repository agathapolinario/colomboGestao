/* Colombo · Equipe de apoio: agentes, segurança, limpeza, cuidadoras e AEE */
(() => {
  'use strict';
  const O = window.ORG, { V, A, F, C, BADGE, esc, ic, ld, sv, id, now, hoje, dt, hm, pill, toast, vazio, optHtml, alunoNome, alunoTurma } = O;
  const hora = () => { const d = new Date(); return `${O.p2(d.getHours())}:${O.p2(d.getMinutes())}`; };

  /* ---------- alunos fora de sala ---------- */
  O.crud({
    key: 'foraSala', t: 'Alunos fora de sala', i: 'door', store: 'agt_fora', edit: true, csv: true, periodo: 'data', periodoDef: 'hoje', novo: 'Registrar aluno fora de sala',
    campos: [{ n: 'ra', l: 'Aluno', tipo: 'aluno', req: 1 }, { n: 'data', l: 'Data', tipo: 'date', def: 'hoje' }, { n: 'hora', l: 'Hora', tipo: 'time', def: hora }, { n: 'local', l: 'Onde estava', ph: 'Corredor, pátio, banheiro…' }, { n: 'acao', l: 'O que foi feito', tipo: 'sel', op: ['Reconduzido à sala', 'Encaminhado à coordenação', 'Encaminhado à enfermaria / cuidado', 'Família avisada', 'Outro'] }, { n: 'obs', l: 'Observação', larg: 1 }],
    cols: [['data', 'Quando', (v, r) => `${dt(v)} ${esc(r.hora || '')}`], ['ra', 'Aluno', (v) => `${esc(alunoNome(v))}<br><small>${esc(alunoTurma(v))}</small>`], ['local', 'Local'], ['acao', 'Ação'], ['obs', 'Obs.'], ['por', 'Por']],
    busca: ['ra', 'local', 'obs'], ordem: (a, b) => (b.data + b.hora).localeCompare(a.data + a.hora),
  });

  /* ---------- atrasos na entrada ---------- */
  O.crud({
    key: 'atrasos', t: 'Atrasos na entrada', i: 'clock', store: 'agt_atrasos', edit: true, csv: true, periodo: 'data', periodoDef: 'hoje', novo: 'Registrar atraso',
    intro: 'Os atrasos aparecem no Aluno 360 e nos relatórios da gestão.',
    campos: [{ n: 'ra', l: 'Aluno', tipo: 'aluno', req: 1 }, { n: 'data', l: 'Data', tipo: 'date', def: 'hoje' }, { n: 'hora', l: 'Chegou às', tipo: 'time', def: hora }, { n: 'motivo', l: 'Motivo informado', ph: 'Transporte, consulta…' }, { n: 'acao', l: 'Encaminhamento', tipo: 'sel', op: ['Entrou na sala', 'Aguardou o 2º horário', 'Encaminhado à coordenação', 'Responsável avisado'] }],
    cols: [['data', 'Quando', (v, r) => `${dt(v)} ${esc(r.hora || '')}`], ['ra', 'Aluno', (v) => `${esc(alunoNome(v))}<br><small>${esc(alunoTurma(v))}</small>`], ['motivo', 'Motivo'], ['acao', 'Encaminhamento']],
    busca: ['ra', 'motivo'], ordem: (a, b) => (b.data + b.hora).localeCompare(a.data + a.hora),
    resumo: (l) => { const h = l.filter((x) => x.data === hoje()); return `<div class="kpis">${O.kpi('Atrasos hoje', h.length, '', h.length > 10 ? 'warn' : '')}${O.kpi('Reincidentes (3+ em 30 dias)', Object.values(l.filter((x) => x.data >= O.antes(30)).reduce((m, x) => ({ ...m, [x.ra]: (m[x.ra] || 0) + 1 }), {})).filter((n) => n >= 3).length, 'alunos', '')}</div>`; },
  });

  /* ---------- rondas ---------- */
  O.PONTOS = ['Portão principal', 'Pátio', 'Quadra', 'Banheiros do térreo', 'Banheiros do 1º andar', 'Corredor do 1º andar', 'Corredor do 2º andar', 'Estacionamento', 'Refeitório', 'Fundos / muros'];
  const rn = { turno: 'Manhã' };
  V.rondas = {
    t: 'Rondas', i: 'shield',
    r() {
      const rd = ld('ronda', []).filter((r) => r.data === hoje()), feitos = O.PONTOS.filter((p) => rd.some((r) => r.ponto === p));
      return `<div class="kpis">${O.kpi('Pontos verificados hoje', `${feitos.length}/${O.PONTOS.length}`, '', feitos.length === O.PONTOS.length ? 'ok' : 'warn')}${O.kpi('Com ocorrência', rd.filter((r) => r.alt).length, '', rd.some((r) => r.alt) ? 'bad' : '')}</div>
      <div class="card"><h2>Checklist de hoje</h2><p class="muted">Toque no ponto para registrar que passou por lá.</p><div class="chip-grid">${O.PONTOS.map((p) => { const r = rd.filter((x) => x.ponto === p).sort((a, b) => b.ts - a.ts)[0]; return `<button class="chip-btn${r ? (r.alt ? ' bad' : ' on') : ''}" data-act="rondaOk" data-p="${esc(p)}">${r ? ic('check') : ''} ${esc(p)}${r ? ' · ' + hm(r.ts) : ''}</button>`; }).join('')}</div></div>
      <form class="card form" data-f="rondaAlt"><h2>Anotar alteração</h2><label>Ponto<select name="ponto">${optHtml(O.PONTOS)}</select></label><label>O que encontrou<input name="obs" required maxlength="160"></label><button class="btn" style="justify-self:start">Registrar alteração</button></form>
      <div class="card"><h2>Histórico de hoje</h2>${rd.length ? `<ul class="list">${rd.sort((a, b) => b.ts - a.ts).map((r) => `<li><span><b>${esc(r.ponto)}</b>${r.obs ? ' · ' + esc(r.obs) : ''}<br><small class="muted">${hm(r.ts)} · ${esc(r.por)}</small></span>${r.alt ? pill('bad', 'Alteração') : pill('ok', 'OK')}</li>`).join('')}</ul>` : vazio('Nenhuma ronda registrada hoje.')}</div>`;
    },
  };
  A.rondaOk = (el) => { sv('ronda', [...ld('ronda', []), { id: id(), data: hoje(), ponto: el.dataset.p, ts: now(), por: O.me().nome }]); toast('Ponto registrado.'); };
  F.rondaAlt = (d) => { sv('ronda', [...ld('ronda', []), { id: id(), data: hoje(), ponto: d.ponto, obs: d.obs, alt: true, ts: now(), por: O.me().nome }]); toast('Alteração registrada.'); };

  /* ---------- visitantes ---------- */
  V.visitantes = {
    t: 'Controle de visitantes', i: 'users', n: 'Visitantes',
    r() {
      const l = ld('seg_visit', []).filter((v) => v.data === hoje()).sort((a, b) => b.ent - a.ent), dentro = l.filter((v) => !v.sai);
      return `<div class="kpis">${O.kpi('Dentro agora', dentro.length, '', dentro.length ? 'warn' : 'ok')}${O.kpi('Hoje', l.length, 'visitantes', '')}</div>
      <form class="card form" style="max-width:none" data-f="visEntra"><h2>Registrar entrada</h2><div class="fields"><label>Nome<input name="nome" required maxlength="80"></label><label>Documento (RG/CPF)<input name="doc" maxlength="20"></label><label>Destino<select name="destino">${optHtml(['Secretaria', 'Direção', 'Coordenação', 'Sala de professores', 'Entrega / fornecedor', 'Manutenção', 'Reunião com responsáveis', 'Outro'])}</select></label><label>Quem vai atender<input name="quem" maxlength="60"></label><label>Nº do crachá<input name="cracha" maxlength="6"></label><label>Observação<input name="obs" maxlength="100"></label></div><button class="btn" style="justify-self:start">Registrar entrada</button></form>
      <div class="card"><h2>Hoje</h2>${l.length ? `<div class="tscroll"><table><thead><tr><th>Nome</th><th>Destino</th><th>Entrada</th><th>Saída</th><th></th></tr></thead><tbody>${l.map((v) => `<tr><td>${esc(v.nome)}<br><small>${esc(v.doc || '')}</small></td><td>${esc(v.destino)}${v.quem ? '<br><small>' + esc(v.quem) + '</small>' : ''}</td><td>${hm(v.ent)}</td><td>${v.sai ? hm(v.sai) : pill('warn', 'Dentro · crachá ' + esc(v.cracha || '—'))}</td><td class="acoes">${v.sai ? '' : `<button class="btn ghost sm" data-act="visSai" data-id="${v.id}">Registrar saída</button>`}</td></tr>`).join('')}</tbody></table></div>` : vazio('Nenhum visitante hoje.')}</div>`;
    },
  };
  BADGE.visitantes = () => ld('seg_visit', []).filter((v) => v.data === hoje() && !v.sai).length;
  F.visEntra = (d) => { sv('seg_visit', [...ld('seg_visit', []), { id: id(), nome: d.nome, doc: d.doc, destino: d.destino, quem: d.quem, cracha: d.cracha, obs: d.obs, data: hoje(), ent: now(), sai: 0, por: O.me().nome }]); toast('Entrada registrada.'); };
  A.visSai = (el) => { sv('seg_visit', ld('seg_visit', []).map((v) => (v.id === el.dataset.id ? { ...v, sai: now() } : v))); toast('Saída registrada.'); };

  /* ---------- limpeza ---------- */
  const AREAS = ['Salas do térreo', 'Salas do 1º andar', 'Salas do 2º andar', 'Banheiros masculinos', 'Banheiros femininos', 'Banheiros acessíveis', 'Pátio', 'Quadra', 'Refeitório e cozinha', 'Secretaria e direção', 'Sala dos professores', 'Corredores e escadas'];
  const TAREFAS = ['Varrer e passar pano', 'Esvaziar lixeiras', 'Repor papel e sabonete', 'Limpar vidros e carteiras', 'Desinfetar banheiros'];
  V.limpezaDia = {
    t: 'Limpeza de hoje', i: 'broom', n: 'Checklist de limpeza',
    r() {
      const all = ld('limpeza_dia', {}), h = all[hoje()] || {}, total = AREAS.length * 2, feitos = Object.keys(h).filter((k) => h[k]).length;
      return `<div class="card"><div class="prog"><b>${feitos}/${total}</b><div class="bar"><i style="width:${Math.round((feitos / total) * 100)}%"></i></div></div><p class="muted">Marque cada área quando terminar: 1ª limpeza (antes das aulas) e 2ª (durante/depois).</p></div>
      <div class="card"><div class="tscroll"><table><thead><tr><th>Área</th><th>1ª limpeza</th><th>2ª limpeza</th></tr></thead><tbody>${AREAS.map((a) => `<tr><td>${esc(a)}</td>${[1, 2].map((n) => `<td><button class="chip-btn${h[a + n] ? ' on' : ''}" data-act="limpTog" data-k="${esc(a + n)}">${h[a + n] ? ic('check') + ' ' + hm(h[a + n]) : 'Marcar'}</button></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
      <p class="muted">Algo acabou ou quebrou? Use <a href="#" data-go="material">Material que acabou</a> ou <a href="#" data-go="chamados">Chamados</a>.</p>`;
    },
  };
  A.limpTog = (el) => { const all = ld('limpeza_dia', {}), h = all[hoje()] || {}; h[el.dataset.k] = h[el.dataset.k] ? 0 : now(); all[hoje()] = h; sv('limpeza_dia', all); };
  const MATERIAIS = ['Papel higiênico', 'Papel toalha', 'Sabonete líquido', 'Detergente', 'Desinfetante', 'Água sanitária', 'Saco de lixo', 'Pano / rodo / vassoura', 'Álcool', 'Luva / EPI'];
  V.material = {
    t: 'Material que acabou', i: 'box',
    r() {
      const meus = O.pedidos.list().filter((p) => p.por === O.me().uid && p.cat === 'limpeza').slice(0, 8);
      return `<div class="card"><h2>Avisar que acabou</h2><p class="muted">Um toque cria o pedido para o GOE repor.</p><div class="quick">${MATERIAIS.map((m) => `<button data-act="matAcabou" data-m="${esc(m)}">${ic('alert')} ${esc(m)}</button>`).join('')}</div></div>
      <div class="card"><h2>Meus avisos recentes</h2>${meus.length ? `<ul class="list">${meus.map((p) => `<li><span><b>${esc(p.titulo)}</b><br><small class="muted">${O.fdt(p.ts)}</small></span>${pill(p.st === 'concluido' ? 'ok' : 'warn', (O.PED_ST[p.st] || [p.st])[0] || p.st)}</li>`).join('')}</ul>` : vazio('Nenhum aviso ainda.')}</div>`;
    },
  };
  A.matAcabou = (el) => { const p = O.pedidos.novo({ titulo: `Acabou: ${el.dataset.m}`, desc: 'Aviso rápido da limpeza.', cat: 'limpeza', prio: 'alta', setor: 'goe' }); toast('Aviso enviado: ' + p.num); };

  /* ---------- cuidadora: registro diário ---------- */
  const cu = { ra: '' };
  V.cuidado = {
    t: 'Registro diário do cuidado', i: 'heart', n: 'Acompanhamento do aluno',
    r() {
      if (O.S.params.ra) { cu.ra = O.S.params.ra; O.S.params = {}; }
      const hojeL = ld('cui_reg', []).filter((r) => r.data === hoje());
      const reg = cu.ra ? hojeL.find((r) => r.ra === cu.ra) || {} : {}, hist = cu.ra ? ld('cui_reg', []).filter((r) => r.ra === cu.ra).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 8) : [];
      return `<form class="card form" style="max-width:none" data-f="cuSel"><h2>Aluno acompanhado</h2>${O.alunoPicker('aluno', { ra: cu.ra })}<button class="btn" style="justify-self:start">Abrir registro</button></form>
      ${cu.ra ? `<form class="card form" style="max-width:none" data-f="cuSalva"><h2>${esc(alunoNome(cu.ra))} · hoje</h2><div class="fields"><label>Humor<select name="humor">${optHtml(['😀 Ótimo', '🙂 Bem', '😐 Quieto', '😟 Ansioso', '😢 Choroso', '😠 Irritado'], reg.humor)}</select></label><label>Lanche / alimentação<select name="lanche">${optHtml(['Comeu tudo', 'Comeu pouco', 'Não quis comer', 'Dieta especial seguida'], reg.lanche)}</select></label><label>Higiene / banheiro<select name="higiene">${optHtml(['Sem intercorrência', 'Precisou de troca', 'Precisou de apoio'], reg.higiene)}</select></label><label>Medicação dada<input name="med" maxlength="80" value="${esc(reg.med || '')}" placeholder="Nome e horário, se houve"></label></div>
        <label>Como foi o dia<textarea name="obs" rows="3" maxlength="600">${esc(reg.obs || '')}</textarea></label><label class="switch"><input type="checkbox" name="share" value="1"${reg.share !== false ? ' checked' : ''}><span>Mostrar para a família no app</span></label><button class="btn" style="justify-self:start">Salvar registro</button></form>
      <div class="card"><h2>Últimos dias</h2>${hist.length ? `<ul class="list">${hist.map((r) => `<li><span><b>${dt(r.data)}</b> · ${esc(r.humor || '')} · ${esc(r.lanche || '')}<br><small class="muted">${esc(r.obs || '')}</small></span></li>`).join('')}</ul>` : vazio('Sem registros.')}</div>` : ''}`;
    },
  };
  F.cuSel = (d) => { cu.ra = d.aluno; };
  F.cuSalva = (d) => { const l = ld('cui_reg', []).filter((r) => !(r.ra === cu.ra && r.data === hoje())); l.push({ id: id(), ra: cu.ra, data: hoje(), humor: d.humor, lanche: d.lanche, higiene: d.higiene, med: d.med, obs: d.obs, share: !!d.share, ts: now(), por: O.me().nome }); sv('cui_reg', l); if (d.share) O.avisarFamilia && O.avisarFamilia(cu.ra, `Registro do dia de ${alunoNome(cu.ra)}: ${d.humor}, ${d.lanche}. ${d.obs || ''}`, 'cuidadora'); toast('Registro salvo.'); };

  /* ---------- AEE: atendimentos ---------- */
  O.crud({
    key: 'aeeAlunos', t: 'Atendimento Educacional Especializado', n: 'Atendimentos AEE', i: 'heart', store: 'aee_reg', edit: true, csv: true, novo: 'Registrar atendimento',
    campos: [{ n: 'ra', l: 'Aluno', tipo: 'aluno', req: 1 }, { n: 'data', l: 'Data', tipo: 'date', def: 'hoje' }, { n: 'tipo', l: 'Tipo', tipo: 'sel', op: ['Atendimento individual', 'Atendimento em grupo', 'Apoio em sala', 'Reunião com professor', 'Reunião com família', 'Elaboração de PEI / PAEE'] }, { n: 'meta', l: 'Objetivo trabalhado', larg: 1 }, { n: 'evol', l: 'Evolução / observações', tipo: 'area' }, { n: 'prox', l: 'Próximos passos', larg: 1 }],
    cols: [['data', 'Data', (v) => dt(v)], ['ra', 'Aluno', (v) => `${esc(alunoNome(v))}<br><small>${esc(alunoTurma(v))}</small>`], ['tipo', 'Tipo'], ['meta', 'Objetivo'], ['evol', 'Evolução'], ['prox', 'Próximos passos']],
    busca: ['ra', 'meta', 'evol'], filtros: [{ n: 'tipo', l: 'Tipo', op: ['Atendimento individual', 'Atendimento em grupo', 'Apoio em sala', 'Reunião com professor', 'Reunião com família', 'Elaboração de PEI / PAEE'] }], ordem: (a, b) => b.data.localeCompare(a.data),
  });
})();
