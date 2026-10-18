/* Colombo · telas da gestão (coordenação e direção):
   comunicados, reuniões, professores, acompanhamento, busca ativa, portaria, relatórios, tarefas, aprovações. */
(() => {
  'use strict';
  const O = window.ORG, D = O.D;
  const { V, A, F, C, I, BADGE, esc, ic, ld, sv, id, now, hoje, dt, hm, pill, toast, vazio, optHtml, alunoNome, alunoDe, alunoTurma, alunoPicker, norm } = O;
  const me = () => O.me();
  const S = O.S;
  const gradeDe = (login) => { try { return JSON.parse(localStorage.getItem(`colombo.professor.${login}.grade`)) || []; } catch { return []; } };

  /* ---------- comunicados e calendário ---------- */
  V.comunicados = {
    t: 'Comunicados e calendário', i: 'mega', n: 'Comunicados',
    r() {
      const av = ld('avisos', []), cal = ld('cal', []).map((e, i) => ({ ...e, i })).sort((a, b) => a.data.localeCompare(b.data));
      return `<div class="grid"><form class="card form" data-f="aviso"><h2>Publicar aviso</h2><p class="muted">Aparece para professores, famílias, alunos e equipe.</p><input name="t" required maxlength="80" placeholder="Título"><textarea name="m" rows="3" required maxlength="400" placeholder="Mensagem"></textarea><button class="btn">Publicar aviso</button></form>
      <form class="card form" data-f="evento"><h2>Evento no calendário escolar</h2><input name="titulo" required maxlength="80" placeholder="Evento (ex.: Conselho de classe)"><input type="date" name="data" required><button class="btn">Adicionar ao calendário</button></form></div>
      <div class="card"><h2>Avisos publicados</h2>${av.length ? `<ul class="list">${av.map((a, i) => `<li><span><b>${esc(a.t)}</b><br>${esc(a.m)}<br><small class="muted">${O.fdt(a.ts)}${a.por ? ' · ' + esc(a.por) : ''}</small></span><button class="btn ghost sm" data-act="avDel" data-i="${i}" aria-label="Apagar">${ic('trash')}</button></li>`).join('')}</ul>` : vazio('Nenhum aviso.')}</div>
      <div class="card"><h2>Calendário</h2>${cal.length ? `<ul class="list">${cal.map((e) => `<li><span>${esc(e.titulo)}</span><span>${pill(e.data < hoje() ? '' : 'info', dt(e.data))} <button class="btn ghost sm" data-act="calDel" data-i="${e.i}" aria-label="Apagar">${ic('trash')}</button></span></li>`).join('')}</ul>` : vazio('Nada no calendário.')}</div>`;
    },
  };
  F.aviso = (d) => { sv('avisos', [{ t: d.t, m: d.m, ts: now(), por: O.quem() }, ...ld('avisos', [])]); toast('Aviso publicado.'); };
  F.evento = (d) => { sv('cal', [...ld('cal', []), { titulo: d.titulo, data: d.data }]); toast('Evento adicionado.'); };
  A.avDel = (el) => { sv('avisos', ld('avisos', []).filter((_, i) => i !== Number(el.dataset.i))); };
  A.calDel = (el) => { sv('cal', ld('cal', []).filter((_, i) => i !== Number(el.dataset.i))); };

  /* ---------- reuniões pedidas pelos responsáveis ---------- */
  V.reunioes = {
    t: 'Reuniões com responsáveis', i: 'cal', n: 'Reuniões',
    r() {
      const l = ld('reunioes', []).sort((a, b) => b.ts - a.ts);
      return `<p class="muted intro">Os responsáveis pedem reunião pelo app. Confirme ou recuse, com um recado.</p><div class="card"><h2>Pedidos</h2>${l.length ? l.map((r) => `<form class="req form" data-f="reunResp:${r.id}" style="max-width:none;margin-bottom:10px"><span><b>${esc(r.nomeResp)}</b> · aluno(a) ${esc(alunoNome(r.ra))} <small class="muted">${esc(alunoTurma(r.ra))}</small><br>${dt(r.data)} · ${esc(r.periodo)} — ${esc(r.assunto)}<br>${r.st === 'pedida' ? pill('warn', 'Aguardando') : pill(r.st === 'confirmada' ? 'ok' : 'bad', r.st === 'confirmada' ? 'Confirmada' : 'Recusada')}${r.obs ? ` <small class="muted">${esc(r.obs)}</small>` : ''}</span>
        ${r.st === 'pedida' ? '<input name="obs" maxlength="200" placeholder="Recado (ex.: horário exato)"><div class="row-btns"><button class="btn sm" name="r" value="confirmada">Confirmar</button><button class="btn ghost sm" name="r" value="recusada">Recusar</button></div>' : ''}</form>`).join('') : vazio('Nenhum pedido de reunião.')}</div>`;
    },
  };
  BADGE.reunioes = () => ld('reunioes', []).filter((r) => r.st === 'pedida').length;
  F.reunResp = (d, f, i, e) => { sv('reunioes', ld('reunioes', []).map((r) => (r.id === i ? { ...r, st: e.submitter.value, obs: d.obs, por: O.quem() } : r))); toast('Resposta enviada ao responsável.'); };

  /* ---------- professores: funções especiais, substituições, alunos acompanhados ---------- */
  const DISCS = [...new Set(TURMAS.turmas.flatMap((t) => TURMAS.disciplinas(TURMAS.lista.find((a) => D.turmaKey(a) === D.turmaKey(t)) || t)))];
  const nmProf = (l) => (D.reg()[l] || {}).nome || '@' + l;
  V.professores = {
    t: 'Professores: funções e substituições', i: 'users', n: 'Professores',
    r() {
      const profs = Object.values(D.reg()).filter((p) => p.nome), subs = ld('subs', []), acomp = ld('acomp', {}), esps = profs.filter((p) => p.aut && p.aut.esp);
      return `<div class="card"><h2>Funções especiais dos professores</h2><p class="muted">Cada curso técnico pode ter só um PAET autorizado.</p>
      ${profs.length ? `<div class="tscroll"><table><thead><tr><th>Professor</th><th>Curso</th><th>PAET</th><th>Substituto</th><th>Educação especial</th></tr></thead><tbody>${profs.map((p) => `<tr><td>${esc(p.nome)}<br><small>@${esc(p.login)}</small></td><td>${esc(D.CURSOS[p.curso] || '—')}</td>${Object.keys(D.ESPECIAIS).map((k) => `<td>${(p.aut || {})[k] ? `${pill('ok', 'Autorizado')} <button class="btn ghost sm" data-act="prRev" data-l="${p.login}" data-k="${k}">Revogar</button>` : (p.pedido || {})[k] ? `${pill('warn', 'Pediu')} <button class="btn sm" data-act="prAut" data-l="${p.login}" data-k="${k}">Autorizar</button>` : '—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : vazio('Nenhum professor concluiu o primeiro acesso ainda.')}</div>
      <form class="card form" style="max-width:none" data-f="aula"><h2>Publicar aula para substituição</h2><div class="fields"><label>Turma<select name="turma">${optHtml(D.turmasTodas().map((k) => [k, D.turmaNome(k)]))}</select></label><label>Disciplina<select name="disc">${optHtml(DISCS)}</select></label><label>Data<input type="date" name="data" required value="${hoje()}"></label><label>Horário<input name="hora" required placeholder="13:00" maxlength="20"></label></div><button class="btn" style="justify-self:start">Publicar</button></form>
      <div class="card"><h2>Substituições</h2>${subs.length ? `<ul class="list">${subs.map((x) => `<li><span><b>${esc(x.disc)}</b> · ${esc(D.turmaNome(x.turma))} · ${dt(x.data)} ${esc(x.hora)}<br>${x.escolhido ? pill('ok', 'Confirmada: ' + nmProf(x.escolhido)) : (x.interessados || []).length ? (x.interessados || []).map((l) => `${esc(nmProf(l))} <button class="btn sm" data-act="subConf" data-i="${x.id}" data-l="${l}">Aprovar</button>`).join(' · ') : '<small class="muted">Sem interessados ainda</small>'}</span><button class="btn ghost sm" data-act="subDel" data-i="${x.id}" aria-label="Apagar">${ic('trash')}</button></li>`).join('')}</ul>` : vazio('Nenhuma aula publicada.')}</div>
      <div class="card"><h2>Alunos acompanhados (educação especial)</h2>${esps.length ? `<form class="form" data-f="acomp" style="max-width:none"><div class="fields"><label>Professor(a)<select name="p">${optHtml(esps.map((p) => [p.login, p.nome]))}</select></label></div>${alunoPicker('aluno')}<button class="btn" style="justify-self:start">Autorizar aluno</button></form>
        ${esps.map((p) => `<p><b>${esc(p.nome)}</b>: ${(acomp[p.login] || []).map((ra) => `${esc(alunoNome(ra))} <button class="btn ghost sm" data-act="acRm" data-l="${p.login}" data-ra="${ra}">remover</button>`).join(', ') || '<small class="muted">nenhum</small>'}</p>`).join('')}` : vazio('Autorize primeiro um professor de educação especial.')}</div>`;
    },
  };
  BADGE.professores = () => Object.values(D.reg()).filter((p) => p.pedido && Object.keys(p.pedido).some((k) => p.pedido[k] && !(p.aut || {})[k])).length;
  A.prAut = (el) => {
    const l = el.dataset.l, k = el.dataset.k, p = D.reg()[l];
    if (k === 'paet') { if (p.curso === 'base') { toast('PAET precisa de curso técnico.'); return false; } const o = D.paetDe(p.curso); if (o && o.login !== l) { toast(`${D.CURSOS[p.curso]} já tem PAET: ${o.nome}. Revogue antes.`); return false; } }
    D.setReg(l, (r) => ({ ...r, aut: { ...r.aut, [k]: true } })); toast('Autorizado.');
  };
  A.prRev = (el) => { D.setReg(el.dataset.l, (r) => { const a = { ...r.aut }; delete a[el.dataset.k]; return { ...r, aut: a }; }); toast('Revogado.'); };
  A.subConf = (el) => { sv('subs', ld('subs', []).map((x) => (x.id === el.dataset.i ? { ...x, escolhido: el.dataset.l } : x))); toast('Substituição confirmada. Já está na agenda do professor.'); };
  A.subDel = (el) => { sv('subs', ld('subs', []).filter((x) => x.id !== el.dataset.i)); };
  A.acRm = (el) => { const a = ld('acomp', {}); a[el.dataset.l] = (a[el.dataset.l] || []).filter((x) => x !== el.dataset.ra); sv('acomp', a); };
  F.aula = (d) => { sv('subs', [...ld('subs', []), { id: id(), turma: d.turma, disc: d.disc, data: d.data, hora: d.hora, interessados: [], escolhido: '' }]); toast('Aula publicada.'); };
  F.acomp = (d) => { if (!d.aluno) { toast('Escolha o aluno.'); return false; } const a = ld('acomp', {}); a[d.p] = [...new Set([...(a[d.p] || []), d.aluno])]; sv('acomp', a); toast('Aluno autorizado.'); };

  /* ---------- acompanhamento dos diários de hoje ---------- */
  V.acompanhamento = {
    t: 'Acompanhamento docente de hoje', i: 'book', n: 'Diários de hoje',
    r() {
      const dia = O.diaSem(hoje()), pres = ld('pres', []), ausentes = ld('falta_prof', []).filter((f) => f.data === hoje()).map((f) => f.prof), linhas = [];
      O.professores().forEach((p) => gradeDe(p.login).filter((g) => g.dia === dia).forEach((g) => {
        const ok = pres.some((x) => x.prof === p.login && x.turma === g.turma && x.data === hoje() && x.disc === g.disc);
        linhas.push({ p, g, ok, falta: ausentes.includes(p.login), agora: O.minDe(g.hora) <= O.minDe(O.agora()) });
      }));
      linhas.sort((a, b) => a.g.hora.localeCompare(b.g.hora));
      const pend = linhas.filter((x) => !x.ok && !x.falta && x.agora);
      return `<p class="muted intro">Aulas de hoje (${dia}) de cada professor, conforme a agenda que ele cadastrou, e se o diário/chamada já foi lançado.</p>
      <div class="kpis">${O.kpi('Aulas hoje', linhas.length, 'na agenda dos professores', '')}${O.kpi('Diários lançados', linhas.filter((x) => x.ok).length, '', 'ok')}${O.kpi('Pendentes (já passou do horário)', pend.length, pend.length ? 'cobrar o lançamento' : 'tudo em dia', pend.length ? 'warn' : 'ok')}${O.kpi('Professores ausentes', ausentes.length, 'registrados hoje', ausentes.length ? 'bad' : '')}</div>
      <div class="card"><h2>Aulas de hoje</h2>${linhas.length ? `<div class="tscroll"><table><thead><tr><th>Horário</th><th>Professor</th><th>Turma</th><th>Disciplina</th><th>Diário</th><th></th></tr></thead><tbody>${linhas.map((x) => `<tr><td>${esc(x.g.hora)}</td><td>${esc(x.p.nome)}</td><td>${esc(D.turmaNome(x.g.turma))}</td><td>${esc(x.g.disc)}</td><td>${x.falta ? pill('bad', 'Professor ausente') : x.ok ? pill('ok', 'Lançado') : x.agora ? pill('warn', 'Pendente') : pill('', 'Ainda não começou')}</td><td>${!x.ok && !x.falta && x.agora ? `<button class="btn ghost sm" data-act="cobrar" data-l="${x.p.login}" data-t="${esc(D.turmaNome(x.g.turma))}" data-d="${esc(x.g.disc)}">Cobrar</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : vazio('Nenhum professor cadastrou aulas para hoje na agenda.')}</div>`;
    },
  };
  A.cobrar = (el) => { sv('msgs', [...ld('msgs', []), { id: id(), de: 'coord', nome: O.quem(), para: el.dataset.l, t: `Lembrete: o diário de classe de hoje (${el.dataset.d}, ${el.dataset.t}) ainda não foi lançado. Pode lançar, por favor?`, ts: now() }]); toast('Lembrete enviado ao professor.'); };

  /* ---------- frequência e busca ativa ---------- */
  const bs = { turma: '', crit: 'risco' };
  function analiseFreq() {
    const por = {}; O.cham.list().forEach((c) => { (por[c.turma] ||= []).push(c); });
    const rows = [];
    Object.entries(por).forEach(([tk, cl]) => {
      cl.sort((a, b) => a.data.localeCompare(b.data));
      D.alunosDa(tk).forEach((a) => {
        let falt = 0, seq = 0, tot = 0, just = 0;
        cl.forEach((c) => { tot++; if (c.ausentes.includes(a.ra)) { if (O.justif.cobre(a.ra, c.data) || O.susp.suspensoNo(a.ra, c.data)) { just++; } else { falt++; seq++; } } else seq = 0; });
        const pct = tot ? ((tot - falt) / tot) * 100 : 100;
        if (falt) rows.push({ a, falt, seq, tot, just, pct, risco: seq >= 3 || (tot >= 5 && pct < 75) });
      });
    });
    return rows.sort((x, y) => y.seq - x.seq || x.pct - y.pct);
  }
  V.busca = {
    t: 'Frequência e busca ativa', i: 'search', n: 'Busca ativa',
    r() {
      let rows = analiseFreq(); const todos = rows.length;
      if (bs.turma) rows = rows.filter((r) => D.turmaKey(r.a) === bs.turma);
      if (bs.crit === 'risco') rows = rows.filter((r) => r.risco);
      const cont = ld('org_busca', []);
      return `<p class="muted intro">Alunos que faltam muito, calculados pela chamada diária feita pela secretaria. Faltas justificadas e suspensões não contam. Risco = 3 ou mais faltas seguidas, ou frequência abaixo de 75%.</p>
      <div class="card"><div class="filtros"><select data-ch="bs" data-n="turma"><option value="">Todas as turmas</option>${optHtml(O.turmaOpts(), bs.turma)}</select><select data-ch="bs" data-n="crit">${optHtml([['risco', 'Só alunos em risco'], ['todos', 'Todos com faltas']], bs.crit)}</select><button class="btn ghost sm" data-act="bsCsv">${ic('download')} Planilha</button></div>
      <p class="muted">${rows.length} aluno(s) ${bs.crit === 'risco' ? 'em risco' : 'com faltas'}${todos ? ` (de ${todos} com alguma falta)` : ''}</p>
      ${rows.length ? rows.slice(0, 80).map((r) => { const cs = cont.filter((c) => c.ra === r.a.ra).sort((x, y) => y.data.localeCompare(x.data)); return `<details class="req" style="margin-bottom:10px"><summary style="cursor:pointer"><b>${esc(r.a.nome)}</b> · ${esc(r.a.serie)} ${esc(r.a.letra)} ${r.risco ? pill('bad', 'Risco') : ''} ${pill('', r.falt + ' falta(s) · ' + r.pct.toFixed(0) + '%')} ${r.seq >= 2 ? pill('warn', r.seq + ' seguidas') : ''} ${cs.length ? pill('ok', 'Contato em ' + dt(cs[0].data)) : pill('warn', 'Sem contato')}</summary>
        <div style="margin-top:10px">${cs.length ? `<ul class="list">${cs.map((c) => `<li><span><b>${esc(c.via)}</b> · ${esc(c.res)}${c.obs ? ' — ' + esc(c.obs) : ''}<br><small class="muted">${esc(c.por)}</small></span>${pill('', dt(c.data))}</li>`).join('')}</ul>` : ''}
        <form class="form" data-f="buscaReg:${r.a.ra}" style="max-width:none;margin-top:10px"><div class="fields"><label>Como foi o contato<select name="via">${optHtml(['Telefone', 'WhatsApp', 'Chat do app', 'Visita domiciliar', 'Carta / aviso escrito', 'Encaminhado ao Conselho Tutelar'])}</select></label><label>Resultado<select name="res">${optHtml(['Não atendeu', 'Família informada', 'Justificou as faltas', 'Aluno voltará às aulas', 'Aluno transferido / evadido', 'Acompanhamento necessário'])}</select></label><label>Data<input type="date" name="data" value="${hoje()}"></label><label>Observação<input name="obs" maxlength="200"></label></div>
        <div class="row-btns"><button class="btn sm">Registrar contato</button><button type="button" class="btn ghost sm" data-act="bsChat" data-ra="${r.a.ra}">Avisar a família no chat</button><button type="button" class="btn ghost sm" data-go="aluno360" data-ra="${r.a.ra}">Ficha</button></div></form></div></details>`; }).join('') : vazio(todos ? 'Nenhum aluno nesse critério.' : 'Ainda não há chamada registrada. A secretaria faz a chamada em Alunos → Chamada.')}</div>`;
    },
  };
  C.bs = (el) => { bs[el.dataset.n] = el.value; };
  F.buscaReg = (d, f, ra) => { sv('org_busca', [...ld('org_busca', []), { id: id(), ra, data: d.data, via: d.via, res: d.res, obs: d.obs, por: O.quem(), ts: now() }]); toast('Contato registrado.'); };
  A.bsChat = (el) => { const ra = el.dataset.ra, n = O.avisarFamilia(ra, `Olá! Percebemos que ${alunoNome(ra)} tem faltado às aulas. Está tudo bem? Pedimos que entre em contato com a escola para combinarmos como ajudar. Se houver atestado, a secretaria pode registrar a justificativa.`); toast(n ? 'Mensagem enviada à família.' : 'Nenhum responsável vinculado no app. Ligue ou faça visita.'); return false; };
  A.bsCsv = () => { O.csv('busca-ativa', [['Aluno', 'Turma', 'Faltas', 'Dias de chamada', 'Frequência %', 'Faltas seguidas', 'Em risco']].concat(analiseFreq().map((r) => [r.a.nome, r.a.serie + ' ' + r.a.letra, r.falt, r.tot, r.pct.toFixed(1), r.seq, r.risco ? 'sim' : 'não']))); return false; };

  /* ---------- portaria e segurança (visão da gestão) ---------- */
  V.portaria = {
    t: 'Portaria e segurança', i: 'shield',
    r() {
      const vis = ld('seg_visit', []).filter((v) => v.data === hoje()), dentro = vis.filter((v) => !v.sai), inc = ld('seg_incid', []).sort((a, b) => b.ts - a.ts).slice(0, 6), al = O.alertas.list().slice(0, 5);
      const pontos = O.PONTOS || [], rd = ld('ronda', []).filter((r) => r.data === hoje());
      const feitos = pontos.filter((p) => rd.some((r) => r.ponto === p)).length;
      return `<div class="kpis">${O.kpi('Visitantes hoje', vis.length, `${dentro.length} ainda dentro`, '')}${O.kpi('Rondas de hoje', `${feitos}/${pontos.length}`, 'pontos verificados', feitos < pontos.length ? 'warn' : 'ok')}${O.kpi('Incidentes abertos', ld('seg_incid', []).filter((i) => i.st !== 'Resolvido').length, '', 'warn')}${O.kpi('Saídas autorizadas', ld('saidas', []).filter((s) => s.data === hoje() && s.st === 'autorizada').length, 'aguardando saída', '')}</div>
      <div class="grid"><div class="card"><h2>Dentro da escola agora</h2>${dentro.length ? `<ul class="list">${dentro.map((v) => `<li><span><b>${esc(v.nome)}</b><br><small class="muted">${esc(v.destino)}${v.quem ? ' · ' + esc(v.quem) : ''} · entrou ${hm(v.ent)}</small></span>${pill('', 'Crachá ' + (v.cracha || '—'))}</li>`).join('')}</ul>` : vazio('Nenhum visitante dentro.')}</div>
      <div class="card"><h2>Incidentes recentes</h2>${inc.length ? `<ul class="list">${inc.map((i) => `<li><span><b>${esc(i.tipo)}</b> · ${esc(i.local)}<br><small class="muted">${dt(i.data)} ${esc(i.hora || '')} · ${esc(i.por)}</small></span>${pill(i.st === 'Resolvido' ? 'ok' : 'warn', i.st)}</li>`).join('')}</ul>` : vazio('Nenhum incidente.')}</div></div>
      <div class="card"><h2>Alertas de emergência recentes</h2>${al.length ? `<ul class="list">${al.map((a) => `<li><span><b>${esc(a.tipo)}</b> · ${esc(a.local)}<br><small class="muted">${esc(a.por)} · ${O.fdt(a.ts)}${a.resPor ? ' · resolvido por ' + esc(a.resPor) : ''}</small></span>${pill(a.st === 'ativo' ? 'bad' : 'ok', a.st === 'ativo' ? 'Ativo' : 'Resolvido')}</li>`).join('')}</ul>` : vazio('Nenhum alerta.')}</div>`;
    },
  };

  /* ---------- relatórios ---------- */
  const rp = { per: '30' };
  function dadosRel() {
    const de = rp.per === 'ano' ? new Date().getFullYear() + '-01-01' : O.antes(Number(rp.per)), ocs = O.ocorr.list().filter((o) => (o.data || '') >= de), sps = O.susp.list().filter((s) => s.inicio >= de && !s.cancelada);
    const cont = (l, f) => { const m = {}; l.forEach((x) => { const k = f(x); m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
    const peds = O.pedidos.list().filter((p) => new Date(p.ts).toISOString().slice(0, 10) >= de), conc = peds.filter((p) => p.st === 'concluido');
    const dias = conc.length ? conc.reduce((s, p) => s + (p.atualizado - p.ts) / 864e5, 0) / conc.length : 0;
    const chs = O.cham.list().filter((c) => c.data >= de), pt = {}; chs.forEach((c) => { const t = pt[c.turma] ||= { a: 0, n: 0 }; t.a += c.ausentes.length; t.n += D.alunosDa(c.turma).length; });
    return { ocs, sps, ocTipo: cont(ocs, (o) => o.tipo), ocTurma: cont(ocs, (o) => (alunoDe(o.aluno) ? alunoTurma(o.aluno) : '—')).slice(0, 8), spDias: sps.reduce((s, x) => s + x.dias, 0),
      pedCat: cont(peds, (p) => O.CATS[p.cat][0]), peds, conc, dias, atras: cont(ld('agt_atrasos', []).filter((x) => x.data >= de), (x) => alunoTurma(x.ra)).slice(0, 6),
      freq: Object.entries(pt).map(([t, v]) => [D.turmaNome(t), v.n ? 100 - (v.a / v.n) * 100 : 100]).sort((a, b) => a[1] - b[1]).slice(0, 8), vis: ld('seg_visit', []).filter((v) => v.data >= de).length };
  }
  const bars = (l, cor) => { const mx = Math.max(1, ...l.map((x) => x[1])); return l.length ? l.map(([n, v]) => `<div class="rowbar"><span>${esc(n)}</span>${O.bar(v, mx, cor)}<b>${Number.isInteger(v) ? v : v.toFixed(0)}</b></div>`).join('') : vazio('Sem dados no período.'); };
  V.relatorios = {
    t: 'Relatórios', i: 'chart',
    r() {
      const r = dadosRel();
      return `<div class="card"><div class="filtros"><select data-ch="rp" data-n="per">${optHtml([['7', 'Últimos 7 dias'], ['30', 'Últimos 30 dias'], ['90', 'Últimos 90 dias'], ['ano', 'Ano inteiro']], rp.per)}</select><button class="btn ghost sm" data-act="relPrint">${ic('print')} Imprimir resumo</button></div></div>
      <div class="kpis">${O.kpi('Ocorrências', r.ocs.length, `${r.ocs.filter((o) => o.tipo === 'Advertência').length} advertências`, '')}${O.kpi('Suspensões', r.sps.length, `${r.spDias} dia(s) letivos`, r.sps.length ? 'warn' : '')}${O.kpi('Pedidos', r.peds.length, `${r.conc.length} concluídos`, '')}${O.kpi('Tempo médio de atendimento', r.dias ? r.dias.toFixed(1).replace('.', ',') + ' d' : '—', 'dos pedidos concluídos', '')}${O.kpi('Visitantes', r.vis, 'na portaria', '')}</div>
      <div class="grid"><div class="card"><h2>Ocorrências por tipo</h2>${bars(r.ocTipo)}</div><div class="card"><h2>Ocorrências por turma</h2>${bars(r.ocTurma, '#e0364a')}</div></div>
      <div class="grid"><div class="card"><h2>Pedidos por categoria</h2>${bars(r.pedCat, '#0891b2')}</div><div class="card"><h2>Atrasos por turma</h2>${bars(r.atras, '#f59e0b')}</div></div>
      <div class="card"><h2>Turmas com mais faltas na chamada (menor presença %)</h2>${bars(r.freq, '#16a34a')}</div>
      <div class="card"><button class="btn ghost" data-act="ocCsv">${ic('download')} Baixar todas as ocorrências (planilha)</button></div>`;
    },
  };
  C.rp = (el) => { rp[el.dataset.n] = el.value; };
  A.relPrint = () => { const r = dadosRel(), li = (l) => l.map(([n, v]) => `<tr><td>${esc(n)}</td><td>${Math.round(v)}</td></tr>`).join('');
    O.imprimir('Relatório da gestão', `${O.cabecalho()}<h2>Relatório da gestão — ${rp.per === 'ano' ? 'ano de ' + new Date().getFullYear() : 'últimos ' + rp.per + ' dias'}</h2><p>Emitido em ${dt(hoje())} por ${esc(O.quem())}.</p>
    <p><b>Ocorrências:</b> ${r.ocs.length} · <b>Suspensões:</b> ${r.sps.length} (${r.spDias} dias letivos) · <b>Pedidos:</b> ${r.peds.length} (${r.conc.length} concluídos) · <b>Visitantes:</b> ${r.vis}</p>
    <h3>Ocorrências por tipo</h3><table>${li(r.ocTipo)}</table><h3>Ocorrências por turma</h3><table>${li(r.ocTurma)}</table><h3>Pedidos por categoria</h3><table>${li(r.pedCat)}</table>`); return false; };

  /* ---------- tarefas e lembretes pessoais ---------- */
  O.crud({
    key: 'tarefas', t: 'Minha agenda e tarefas', n: 'Minhas tarefas', i: 'checkc', store: 'org_tarefas', edit: true, novo: 'Nova tarefa ou lembrete',
    onde: (r) => r.uid === O.me().uid,
    campos: [{ n: 'titulo', l: 'O que fazer', req: 1, larg: 1 }, { n: 'data', l: 'Data', tipo: 'date', def: 'hoje' }, { n: 'prio', l: 'Importância', tipo: 'sel', op: ['Normal', 'Alta', 'Baixa'] }, { n: 'st', l: 'Situação', tipo: 'sel', op: ['Pendente', 'Feita'] }],
    cols: [['data', 'Quando', (v, r) => `${dt(v)}${r.st !== 'Feita' && v < hoje() ? ' ' + pill('bad', 'atrasada') : ''}`], ['titulo', 'Tarefa'], ['prio', 'Importância', (v) => pill(v === 'Alta' ? 'warn' : '', v)], ['st', 'Situação', (v) => pill(v === 'Feita' ? 'ok' : 'warn', v)]],
    busca: ['titulo'], filtros: [{ n: 'st', l: 'Situação', op: ['Pendente', 'Feita'] }], ordem: (a, b) => (a.st === 'Feita') - (b.st === 'Feita') || (a.data || '').localeCompare(b.data || ''),
    acoes: [{ k: 'f', l: 'Feita', se: (r) => r.st !== 'Feita', fn: (r) => ({ ...r, st: 'Feita' }) }],
  });
  BADGE.tarefas = () => ld('org_tarefas', []).filter((t) => t.uid === me().uid && t.st !== 'Feita' && t.data <= hoje()).length;

  /* ---------- aprovações da direção ---------- */
  V.aprovacoes = {
    t: 'Aprovações da direção', i: 'checkc', n: 'Aprovações',
    r() {
      const peds = O.pedidos.list().filter((p) => p.aprov && p.aprov.st === 'pendente'), sps = O.susp.list().filter((s) => !s.homolog && !s.cancelada);
      return `<p class="muted intro">Tudo que depende de uma decisão da direção: compras e gastos pedidos pela escola e suspensões lançadas pela coordenação (que já valem, mas pedem homologação).</p>
      <div class="card"><h2>Pedidos aguardando aprovação (${peds.length})</h2>${peds.length ? peds.map((p) => `<form class="req form" data-f="pdAprov:${p.id}" style="max-width:none;margin-bottom:10px"><span><b>${esc(p.titulo)}</b> <small class="muted">${esc(p.num)}</small><br>${esc(p.porNome)} · ${esc(O.CATS[p.cat][0])}${p.custo ? ' · ' + O.brl(p.custo) : ''}<br>${esc(p.desc || '')}</span><input name="nota" maxlength="140" placeholder="Observação (opcional)"><div class="row-btns"><button class="btn sm" name="r" value="aprovado">Aprovar</button><button class="btn ghost sm" name="r" value="recusado">Recusar</button><button type="button" class="btn ghost sm" data-act="pdAbrirV" data-id="${p.id}">Abrir</button></div></form>`).join('') : vazio('Nada aguardando aprovação.')}</div>
      <div class="card"><h2>Suspensões para homologar (${sps.length})</h2>${sps.length ? `<ul class="list">${sps.map((s) => `<li><span><b>${esc(alunoNome(s.ra))}</b> · ${esc(alunoTurma(s.ra))} · ${dt(s.inicio)} a ${dt(s.fim)}<br><small class="muted">${esc(s.motivo)} · por ${esc(s.por)} (${esc(s.cargoNome)})</small></span><button class="btn sm" data-act="spHom" data-id="${s.id}">Homologar</button></li>`).join('')}</ul>` : vazio('Nenhuma suspensão pendente.')}</div>`;
    },
  };
  BADGE.aprovacoes = () => O.pedidos.list().filter((p) => p.aprov && p.aprov.st === 'pendente').length + O.susp.list().filter((s) => !s.homolog && !s.cancelada).length;
})();
