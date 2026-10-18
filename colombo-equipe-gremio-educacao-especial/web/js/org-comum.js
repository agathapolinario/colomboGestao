/* Colombo · telas comuns à gestão e à equipe:
   chat, ocorrências, suspensões, convocações, pedidos, chamados, mural, perfil, aluno 360,
   saída antecipada, achados e perdidos, contatos, ausência de professores, reservas, prazos. */
(() => {
  'use strict';
  const O = window.ORG, D = O.D;
  const { V, A, F, C, I, BADGE, esc, ic, ld, sv, id, now, hoje, dt, hm, pill, toast, vazio, optHtml, alunoNome, alunoDe, alunoTurma, alunoRotulo, alunoPicker, norm } = O;
  const me = () => O.me();
  const S = O.S;
  const diaLongo = (ts) => { const d = new Date(ts), h = new Date(), ont = new Date(Date.now() - 864e5); return d.toDateString() === h.toDateString() ? 'Hoje' : d.toDateString() === ont.toDateString() ? 'Ontem' : d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }); };
  const horaCurta = (ts) => { if (!ts) return ''; const d = new Date(ts); return d.toDateString() === new Date().toDateString() ? hm(ts) : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); };

  /* =====================================================================
     CHAT: equipe (canais e conversas diretas), professores, famílias e alunos
     ===================================================================== */
  const CANAIS = [
    { k: 'geral', n: 'Toda a equipe', sub: 'Gestão e equipe', ok: () => true },
    { k: 'gestao', n: 'Gestão', sub: 'Direção e coordenação', ok: (m) => m.ehGestao },
    { k: 'coordm', n: 'Coordenação · Manhã', sub: 'Coordenadores da manhã', ok: (m) => m.ehGestao },
    { k: 'coordt', n: 'Coordenação · Tarde', sub: 'Coordenadores da tarde', ok: (m) => m.ehGestao },
    { k: 'operacao', n: 'Operação do dia', sub: 'Portaria, agentes e limpeza', ok: (m) => m.ehGestao || ['seguranca', 'agente', 'limpeza', 'goe'].includes(m.grupo) },
    { k: 'adm', n: 'Secretaria e GOE', sub: 'Documentos, pessoal e compras', ok: (m) => m.ehGestao || ['secretaria', 'goe'].includes(m.grupo) },
    { k: 'inclusao', n: 'Inclusão', sub: 'AEE, cuidadoras e gestão', ok: (m) => m.ehGestao || ['aee', 'cuidadora'].includes(m.grupo) },
  ];
  const cs = { tab: 'eq', sel: null, open: false, q: '', foco: false };
  const lerKey = () => 'orgread_' + me().uid;
  const lidas = () => ld(lerKey(), {});
  const marcaLida = (k) => { const r = lidas(); r[k] = now(); sv(lerKey(), r); };
  const abas = () => { const m = me(), a = [['eq', 'Equipe']]; if (m.ehGestao) a.push(['prof', 'Professores']); if (m.ehGestao || m.grupo === 'secretaria') a.push(['resp', 'Famílias'], ['al', 'Alunos']); return a; };
  const discAlunos = () => (me().grupo === 'secretaria' ? 'Secretaria' : 'Direção');
  const paraResp = () => (me().grupo === 'secretaria' ? 'secretaria' : 'coord');

  function varrerAlunos(disc) {
    const th = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '', m = /^colombo\.aluno\.(.+)\.chat$/.exec(k); if (!m) continue;
      let c; try { c = JSON.parse(localStorage.getItem(k)) || {}; } catch { continue; }
      const ra = m[1].replace(/\D/g, ''); if (!alunoDe(ra)) continue;
      (c[disc] || []).forEach((x) => { (th[ra] ||= []).push({ ts: x.ts || 0, t: x.t, mine: false, nome: alunoNome(ra) }); });
    }
    ld('resp', []).filter((r) => r.disc === disc && alunoDe(r.ra)).forEach((r) => { (th[r.ra] ||= []).push({ ts: r.ts, t: r.t, mine: true, nome: r.deNome || 'Escola' }); });
    return th;
  }
  function entradas(tab) {
    const m = me(), out = [];
    if (tab === 'eq') {
      const msgs = ld('org_chat', []);
      CANAIS.filter((c) => c.ok(m)).forEach((c) => {
        const key = 'ch:' + c.k, ms = msgs.filter((x) => x.room === key).map((x) => ({ ts: x.ts, t: x.t, mine: x.de === m.uid, nome: x.nome }));
        out.push({ key, nome: c.n, sub: c.sub, cor: '#4f46e5', ic: 'users', ms, envia: (t) => sv('org_chat', [...ld('org_chat', []), { id: id(), room: key, de: m.uid, nome: `${m.nome} · ${m.cargoNome}`, t, ts: now() }]) });
      });
      O.diretorio().filter((p) => p.uid !== m.uid).forEach((p) => {
        const key = 'dm:' + [m.uid, p.uid].sort().join('~'), ms = msgs.filter((x) => x.room === key).map((x) => ({ ts: x.ts, t: x.t, mine: x.de === m.uid, nome: x.nome }));
        out.push({ key, nome: p.nome, sub: O.cargoNome(p.cargo), cor: O.corDe(p.uid), ms, envia: (t) => sv('org_chat', [...ld('org_chat', []), { id: id(), room: key, de: m.uid, nome: m.nome, t, ts: now() }]) });
      });
    } else if (tab === 'prof') {
      const todos = ld('msgs', []);
      out.push({ key: 'pf:todos', nome: 'Todos os professores', sub: 'Aviso geral', cor: '#4f46e5', ic: 'mega', ms: todos.filter((x) => x.para === 'todos' && x.de === 'coord').map((x) => ({ ts: x.ts, t: x.t, mine: true, nome: x.nome })), envia: (t) => sv('msgs', [...ld('msgs', []), { id: id(), de: 'coord', nome: O.quem(), para: 'todos', t, ts: now() }]) });
      O.professores().forEach((p) => {
        out.push({ key: 'pf:' + p.login, nome: p.nome, sub: 'Professor(a) · @' + p.login, cor: O.corDe(p.login),
          ms: todos.filter((x) => (x.de === p.login && x.para === 'coord') || (x.de === 'coord' && x.para === p.login)).map((x) => ({ ts: x.ts, t: x.t, mine: x.de === 'coord', nome: x.de === 'coord' ? x.nome : p.nome })),
          envia: (t) => sv('msgs', [...ld('msgs', []), { id: id(), de: 'coord', nome: O.quem(), para: p.login, t, ts: now() }]) });
      });
    } else if (tab === 'resp') {
      const para = paraResp(), cv = {};
      ld('pchat', []).filter((x) => x.para === para).forEach((x) => { (cv[x.conv] ||= []).push(x); });
      Object.entries(cv).forEach(([conv, ms]) => {
        const f = ms[0];
        out.push({ key: 'rs:' + conv, nome: `${f.nomeResp}`, sub: `Responsável por ${alunoNome(f.ra)}`, cor: '#0f766e',
          ms: ms.map((x) => ({ ts: x.ts, t: x.t, mine: x.de !== 'resp', nome: x.de === 'resp' ? x.nomeResp : (x.quem || 'Escola') })),
          envia: (t) => sv('pchat', [...ld('pchat', []), { id: id(), conv, para, resp: f.resp, nomeResp: f.nomeResp, ra: f.ra, de: 'gestao', quem: me().cargoNome, t, ts: now() }]) });
      });
    } else if (tab === 'al') {
      const disc = discAlunos(), th = varrerAlunos(disc);
      Object.entries(th).forEach(([ra, ms]) => {
        out.push({ key: 'al:' + ra, nome: alunoNome(ra), sub: `Aluno(a) · ${alunoTurma(ra)}`, cor: '#2563eb', ms,
          envia: (t) => sv('resp', [...ld('resp', []), { ra, disc, t, ts: now(), de: me().login, deNome: `${me().nome} · ${me().cargoNome}` }]) });
      });
    }
    out.forEach((e) => { e.ms.sort((a, b) => a.ts - b.ts); e.ult = e.ms.length ? e.ms[e.ms.length - 1].ts : 0; const lr = lidas()[e.key] || 0; e.nao = e.ms.filter((x) => !x.mine && x.ts > lr).length; });
    return out.sort((a, b) => b.ult - a.ult || a.nome.localeCompare(b.nome));
  }
  BADGE.chat = () => abas().reduce((n, [t]) => n + entradas(t).reduce((s, e) => s + e.nao, 0), 0);

  const avCh = (e, cls = '') => `<span class="cav ${cls}" style="background:linear-gradient(135deg,${e.cor},color-mix(in srgb,${e.cor} 55%,#0b1240))">${e.ic ? ic(e.ic) : esc(O.iniciais(e.nome))}</span>`;
  V.chat = {
    t: 'Chat', i: 'chat',
    r() {
      const ab = abas(); if (!ab.some(([t]) => t === cs.tab)) cs.tab = 'eq';
      const lista = entradas(cs.tab), q = norm(cs.q);
      const vis = lista.filter((e) => !q || norm(e.nome + ' ' + e.sub).includes(q));
      if (!cs.sel || !lista.some((e) => e.key === cs.sel)) { cs.sel = null; cs.open = false; }
      const e = cs.sel ? lista.find((x) => x.key === cs.sel) : null;
      if (e) marcaLida(e.key);
      let ult = '';
      const corpo = e ? (e.ms.length ? e.ms.map((x) => { const d = diaLongo(x.ts), sep = d !== ult ? `<div class="dsep">${d}</div>` : ''; ult = d; return `${sep}<div class="msg${x.mine ? ' me' : ''}">${x.mine && x.nome && e.key.startsWith('ch:') || !x.mine && (e.key.startsWith('ch:') || e.key.startsWith('rs:')) ? `<span class="de">${esc(x.nome || '')}</span>` : ''}${esc(x.t)}<time>${hm(x.ts)}</time></div>`; }).join('') : `<div class="empty-chat">${avCh(e)}<b>${esc(e.nome)}</b><p>Nenhuma mensagem ainda. Escreva a primeira.</p></div>`) : '';
      const nova = cs.tab === 'resp' || cs.tab === 'al' ? `<details class="nova-conv"><summary>+ Nova conversa com ${cs.tab === 'resp' ? 'responsável' : 'aluno'}</summary><form class="form" data-f="chNova" style="max-width:none;margin-top:8px">${alunoPicker('aluno')}<input name="t" required maxlength="500" placeholder="Primeira mensagem"><button class="btn sm">Enviar</button></form></details>` : '';
      return `<div class="card chat ${cs.open ? 'show-room' : ''}" id="chatBox"><aside class="contacts">
        <div class="ctabs">${ab.map(([t, n]) => { const nb = entradas(t).reduce((s, x) => s + x.nao, 0); return `<button class="${t === cs.tab ? 'on' : ''}" data-act="chTab" data-tab="${t}">${n}${nb ? `<b class="nbdg">${nb}</b>` : ''}</button>`; }).join('')}</div>
        <div class="csearch">${ic('search')}<input type="search" data-in="chq" placeholder="Buscar" value="${esc(cs.q)}" aria-label="Buscar conversa" autocomplete="off"></div>
        <div class="clist">${vis.map((x) => { const u = x.ms[x.ms.length - 1]; return `<button class="citem ${x.key === cs.sel ? 'on' : ''}" data-act="chSel" data-key="${esc(x.key)}">${avCh(x)}<span class="cbody"><span class="crow"><b>${esc(x.nome)}</b><span class="ctime">${u ? horaCurta(u.ts) : ''}</span></span><span class="cprev">${u ? esc((u.mine ? 'Você: ' : '') + u.t) : esc(x.sub)}</span></span>${x.nao ? `<b class="nbdg">${x.nao}</b>` : ''}</button>`; }).join('') || '<p class="muted" style="padding:12px">Nenhuma conversa ainda.</p>'}</div>${nova}</aside>
        <section class="room">${e ? `<div class="room-head"><button class="rback" data-act="chBack" aria-label="Voltar">${ic('back')}</button>${avCh(e, 'sm')}<div><b>${esc(e.nome)}</b><small>${esc(e.sub)}</small></div></div><div class="msgs">${corpo}</div>
          <form class="composer" data-f="chSend"><input name="t" placeholder="Escreva uma mensagem…" autocomplete="off" maxlength="500" required aria-label="Mensagem"><button class="send" aria-label="Enviar">${ic('send')}</button></form>` : `<div class="empty-chat" style="margin:auto"><b>Escolha uma conversa</b><p>Equipe, professores, famílias e alunos num só lugar.</p></div>`}</section></div>`;
    },
    after() { if (cs.foco) { const i = O.$('.composer input'); if (i) i.focus(); cs.foco = false; } },
  };
  A.chTab = (el) => { cs.tab = el.dataset.tab; cs.sel = null; cs.open = false; };
  A.chSel = (el) => { cs.sel = el.dataset.key; cs.open = true; cs.foco = true; };
  A.chBack = () => { cs.open = false; cs.sel = null; };
  I.chq = (el) => { cs.q = el.value; clearTimeout(I._cq); I._cq = setTimeout(() => S.refresh({ foco: el }), 200); };
  F.chSend = (d) => { const e = entradas(cs.tab).find((x) => x.key === cs.sel); if (!e || !d.t.trim()) return false; e.envia(d.t.trim()); cs.foco = true; };
  F.chNova = (d) => {
    const ra = d.aluno, t = d.t.trim(); if (!ra || !t) return false;
    if (cs.tab === 'al') { sv('resp', [...ld('resp', []), { ra, disc: discAlunos(), t, ts: now(), de: me().login, deNome: `${me().nome} · ${me().cargoNome}` }]); cs.sel = 'al:' + ra; }
    else {
      const rs = O.responsaveisDe(ra); if (!rs.length) { toast('Nenhum responsável vinculou este aluno ainda.'); return false; }
      const n = O.avisarFamilia(ra, t, paraResp()); cs.sel = 'rs:' + `${rs[0].uid}|${ra}|${paraResp()}`; toast(`Enviado a ${n} responsável(is).`);
    }
    cs.open = true; cs.foco = true;
  };

  /* =====================================================================
     OCORRÊNCIAS
     ===================================================================== */
  const oc = { q: '', tipo: '', st: '', turma: '', per: '30' };
  const tomTipo = (t) => O.OC_TOM[t] || '';
  V.ocorrencias = {
    t: 'Ocorrências', i: 'alert',
    r() {
      const m = me(), gest = m.ehGestao, tipos = gest ? O.OC_TIPOS_GESTAO : O.OC_TIPOS_EQUIPE;
      let l = O.ocorr.list().filter((o) => gest || o.uid === m.uid);
      const q = norm(oc.q);
      l = l.filter((o) => (!oc.tipo || o.tipo === oc.tipo) && (!oc.st || (o.st || 'registrada') === oc.st) && (!oc.turma || (alunoDe(o.aluno) && D.turmaKey(alunoDe(o.aluno)) === oc.turma))
        && (oc.per === 'todos' || (o.data || '') >= O.antes(Number(oc.per))) && (!q || norm(alunoNome(o.aluno) + ' ' + (o.obs || '')).includes(q))).sort((a, b) => (b.data || '').localeCompare(a.data || '') || b.ts - a.ts);
      const form = `<details class="card form-card"${S.params.ra ? ' open' : ''}><summary><b>${ic('plus')} ${gest ? 'Lançar ocorrência' : 'Registrar relato'}</b></summary>
        <form class="form" style="max-width:none" data-f="ocNovo"><div class="fields">${alunoPicker('aluno', { ra: S.params.ra })}
        <label>Tipo<select name="tipo">${optHtml(tipos)}</select></label>
        ${gest ? `<label>Gravidade<select name="grav">${optHtml([['leve', 'Leve'], ['media', 'Média'], ['grave', 'Grave']], 'media')}</select></label>` : ''}
        <label>Data<input type="date" name="data" value="${hoje()}" required></label><label>Hora<input type="time" name="hora" value="${O.agora()}"></label>
        <label>Local<input name="local" maxlength="60" placeholder="Ex.: pátio, sala 2º B"></label></div>
        <label>O que aconteceu<textarea name="obs" rows="3" required maxlength="800"></textarea></label>
        ${gest ? `<label>Providência tomada<textarea name="prov" rows="2" maxlength="500" placeholder="Conversa com o aluno, contato com a família…"></textarea></label>
        <label class="switch"><input type="checkbox" name="visivel" value="1" checked><span>Visível para a família e para o aluno<small>Se desmarcar, fica só para a gestão.</small></span></label>` : '<p class="muted">Seu relato vai para a coordenação analisar. A família só vê se a gestão publicar.</p>'}
        <button class="btn" style="justify-self:start">Salvar</button></form></details>`;
      const filtros = `<div class="filtros"><input type="search" data-in="ocq" placeholder="Buscar aluno ou texto" value="${esc(oc.q)}" aria-label="Buscar">
        <select data-ch="oc" data-n="tipo"><option value="">Tipo: todos</option>${optHtml(O.OC_TIPOS_GESTAO.concat(O.OC_TIPOS_EQUIPE), oc.tipo)}</select>
        <select data-ch="oc" data-n="st"><option value="">Status: todos</option>${optHtml(Object.entries(O.OC_ST).map(([k, v]) => [k, v[1]]), oc.st)}</select>
        <select data-ch="oc" data-n="turma"><option value="">Turma: todas</option>${optHtml(O.turmaOpts(), oc.turma)}</select>
        <select data-ch="oc" data-n="per">${optHtml([['7', '7 dias'], ['30', '30 dias'], ['90', '90 dias'], ['todos', 'Tudo']], oc.per)}</select>
        <button class="btn ghost sm" data-act="ocCsv">${ic('download')} Planilha</button></div>`;
      const card = (o) => { const a = alunoDe(o.aluno), st = O.OC_ST[o.st || 'registrada']; const pode = m.ehDirecao || o.uid === m.uid;
        return `<li class="oc-it"><div style="flex:1;min-width:0"><b>${a ? esc(a.nome) : esc(o.aluno)}</b> <small class="muted">${a ? a.serie + ' ' + a.letra : ''}</small><br>
          ${pill(tomTipo(o.tipo), o.tipo)} ${o.grav ? pill(o.grav === 'grave' ? 'bad' : o.grav === 'media' ? 'warn' : '', 'Gravidade ' + { leve: 'leve', media: 'média', grave: 'grave' }[o.grav]) : ''} ${o.interno ? pill('info', 'Interna') : pill('ok', 'Visível à família')} ${gest ? pill(st[0], st[1]) : ''}
          <p style="margin:6px 0">${esc(o.obs)}</p>${o.prov ? `<p class="muted"><b>Providência:</b> ${esc(o.prov)}</p>` : ''}
          <small class="muted">${dt(o.data)}${o.hora ? ' às ' + esc(o.hora) : ''}${o.local ? ' · ' + esc(o.local) : ''} · por ${esc(o.por || o.prof || '')}${o.cargoNome ? ' (' + esc(o.cargoNome) + ')' : ''}</small></div>
          ${gest ? `<div class="acoes-col"><select data-ch="ocSt" data-id="${o.id}" aria-label="Status">${optHtml(Object.entries(O.OC_ST).map(([k, v]) => [k, v[1]]), o.st || 'registrada')}</select>
          ${o.interno ? `<button class="btn sm" data-act="ocPub" data-id="${o.id}">Publicar à família</button>` : ''}<button class="btn ghost sm" data-go="convocacoes" data-ra="${o.aluno}">Convocar</button><button class="btn ghost sm" data-go="aluno360" data-ra="${o.aluno}">Ficha</button>${pode ? `<button class="btn ghost sm" data-act="ocDel" data-id="${o.id}" aria-label="Apagar">${ic('trash')}</button>` : ''}</div>` : ''}</li>`; };
      return `${form}<div class="card">${filtros}<p class="muted">${l.length} registro(s)</p>${l.length ? `<ul class="list oc-list">${l.map(card).join('')}</ul>` : vazio('Nenhuma ocorrência encontrada.')}</div>`;
    },
  };
  C.oc = (el) => { oc[el.dataset.n] = el.value; };
  I.ocq = (el) => { oc.q = el.value; clearTimeout(I._oq); I._oq = setTimeout(() => S.refresh({ foco: el }), 220); };
  C.ocSt = (el) => { sv('ocorr', O.ocorr.list().map((o) => (o.id === el.dataset.id ? { ...o, st: el.value } : o))); toast('Status atualizado.'); };
  A.ocPub = (el) => { sv('ocorr', O.ocorr.list().map((o) => (o.id === el.dataset.id ? { ...o, interno: false } : o))); toast('Agora a família e o aluno podem ver.'); };
  A.ocDel = (el) => { if (!confirm('Apagar esta ocorrência?')) return false; sv('ocorr', O.ocorr.list().filter((o) => o.id !== el.dataset.id)); };
  A.ocCsv = () => { O.csv('ocorrencias', [['Data', 'Aluno', 'Turma', 'Tipo', 'Gravidade', 'Descrição', 'Providência', 'Status', 'Autor']].concat(O.ocorr.list().map((o) => [o.data, alunoNome(o.aluno), alunoTurma(o.aluno), o.tipo, o.grav || '', o.obs, o.prov || '', (O.OC_ST[o.st || 'registrada'] || [])[1], o.por || o.prof || '']))); return false; };
  F.ocNovo = (d) => {
    const m = me(); if (!d.aluno) { toast('Escolha o aluno.'); return false; }
    O.ocorr.add({ aluno: d.aluno, tipo: d.tipo, data: d.data, hora: d.hora, local: d.local, obs: d.obs, prov: d.prov || '', grav: d.grav || '', prof: `${m.nome} (${m.cargoNome})`, por: m.nome, uid: m.uid, cargo: m.cargo, cargoNome: m.cargoNome, st: 'registrada', interno: m.ehGestao ? !d.visivel : true });
    toast(m.ehGestao ? 'Ocorrência lançada.' : 'Relato enviado à coordenação.'); S.params = {};
  };

  /* =====================================================================
     SUSPENSÕES
     ===================================================================== */
  const sp = { tab: 'curso' };
  const termoSusp = (s) => { const a = alunoDe(s.ra) || {}; return `${O.cabecalho()}<h2 style="text-align:center">TERMO DE SUSPENSÃO ESCOLAR</h2>
    <p>Comunicamos que o(a) aluno(a) <b>${esc(a.nome || s.ra)}</b>, RA ${esc(s.ra)}, turma <b>${esc(a.serie || '')} ${esc(a.letra || '')}</b>, foi suspenso(a) das atividades escolares presenciais pelo período de <b>${dt(s.inicio)}</b> a <b>${dt(s.fim)}</b> (${s.dias} dia(s) letivo(s)), com retorno em <b>${dt(O.proxUtil(s.fim))}</b>.</p>
    <div class="cx"><b>Motivo:</b> ${esc(s.motivo)}${s.detalhe ? '<br>' + esc(s.detalhe) : ''}${s.base ? `<br><b>Fundamento:</b> ${esc(s.base)}` : ''}</div>
    ${s.atividades ? `<div class="cx"><b>Atividades pedagógicas durante a suspensão:</b><br>${esc(s.atividades)}</div>` : ''}
    ${s.retorno ? `<p>Reunião de retorno marcada para <b>${dt(s.retorno)}</b>${s.comparecer ? ' (comparecimento do responsável obrigatório)' : ''}.</p>` : ''}
    <p>${dt(hoje())} · Emitido por ${esc(s.por)} (${esc(s.cargoNome)}).</p>
    <div class="ass"><div>Direção / Coordenação</div><div>Responsável (ciente)</div><div>Aluno(a) (ciente)</div></div>
    <div class="rod">Código de autenticação: ${O.codigoAut(s.id + s.ra)} · E.E. Colombo de Almeida</div>`; };
  const cardSusp = (s, gest) => {
    const a = alunoDe(s.ra) || {}, stt = O.susp.status(s);
    const tom = { curso: ['bad', 'Em curso'], agendada: ['warn', 'Agendada'], cumprida: ['ok', 'Cumprida'], cancelada: ['', 'Cancelada'] }[stt];
    return `<li class="oc-it"><div style="flex:1;min-width:0"><b>${esc(a.nome || s.ra)}</b> <small class="muted">${esc(a.serie || '')} ${esc(a.letra || '')}</small><br>${pill(...tom)} ${pill('', `${dt(s.inicio)} a ${dt(s.fim)} · ${s.dias} dia(s)`)}${s.homolog ? ' ' + pill('ok', 'Homologada') : s.cargo && !(O.CARGOS[s.cargo] || {}).grupo?.startsWith('dir') ? ' ' + pill('warn', 'Aguarda homologação') : ''}
      <p style="margin:6px 0"><b>${esc(s.motivo)}</b>${s.detalhe ? ' — ' + esc(s.detalhe) : ''}</p>${s.atividades ? `<p class="muted"><b>Atividades:</b> ${esc(s.atividades)}</p>` : ''}
      <small class="muted">Lançada por ${esc(s.por)} (${esc(s.cargoNome)}) em ${O.fdt(s.ts)}${s.retorno ? ' · reunião de retorno ' + dt(s.retorno) : ''}</small><br>
      <small>${s.cienciaResp ? `✅ Responsável ciente (${esc(s.cienciaResp.nome)}, ${O.fdt(s.cienciaResp.ts)})` : '⏳ Responsável ainda não deu ciência'} · ${s.cienciaAluno ? `✅ Aluno ciente` : '⏳ Aluno ainda não deu ciência'}</small></div>
      ${gest ? `<div class="acoes-col"><button class="btn ghost sm" data-act="spPrint" data-id="${s.id}">${ic('print')} Termo</button>${!s.cancelada && stt !== 'cumprida' ? `<button class="btn ghost sm" data-act="spCanc" data-id="${s.id}">Cancelar</button>` : ''}${!s.homolog && me().ehDirecao && !s.cancelada ? `<button class="btn sm" data-act="spHom" data-id="${s.id}">Homologar</button>` : ''}<button class="btn ghost sm" data-go="aluno360" data-ra="${s.ra}">Ficha</button></div>` : ''}</li>`;
  };
  V.suspensoes = {
    t: 'Suspensões', i: 'flag',
    r() {
      const m = me(), gest = m.ehGestao, h = hoje(), todas = O.susp.list();
      const grupos = { curso: todas.filter((s) => O.susp.status(s) === 'curso'), agendada: todas.filter((s) => O.susp.status(s) === 'agendada'), cumprida: todas.filter((s) => O.susp.status(s) === 'cumprida'), cancelada: todas.filter((s) => s.cancelada) };
      if (!gest) {
        const prox = grupos.curso.concat(grupos.agendada).sort((a, b) => a.inicio.localeCompare(b.inicio));
        return `<p class="muted intro">Alunos suspensos hoje ou nos próximos dias. Quem está suspenso não entra na escola até a data de retorno: avise a gestão se aparecer na portaria.</p>
          <div class="card"><h2>Em curso hoje (${grupos.curso.length})</h2>${grupos.curso.length ? `<ul class="list">${grupos.curso.map((s) => `<li><span><b>${esc(alunoNome(s.ra))}</b> · ${esc(alunoTurma(s.ra))}<br><small class="muted">Retorna em ${dt(O.proxUtil(s.fim))}</small></span>${pill('bad', 'Suspenso')}</li>`).join('')}</ul>` : vazio('Nenhum aluno suspenso hoje.')}</div>
          <div class="card"><h2>Agendadas</h2>${grupos.agendada.length ? `<ul class="list">${grupos.agendada.map((s) => `<li><span><b>${esc(alunoNome(s.ra))}</b> · ${esc(alunoTurma(s.ra))}</span>${pill('warn', dt(s.inicio) + ' a ' + dt(s.fim))}</li>`).join('')}</ul>` : vazio('Nada agendado.')}</div>`;
      }
      const form = `<details class="card form-card"${S.params.ra ? ' open' : ''}><summary><b>${ic('plus')} Lançar suspensão</b></summary>
        <form class="form" style="max-width:none" data-f="spNovo"><div class="fields">${alunoPicker('aluno', { ra: S.params.ra })}
          <label>Primeiro dia<input type="date" name="inicio" value="${ehUtilHoje()}" required></label>
          <label>Quantos dias letivos<select name="dias">${optHtml([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15].map((n) => [n, n + (n === 1 ? ' dia' : ' dias')]), 3)}</select></label>
          <label>Motivo<select name="motivo">${optHtml(O.SUSP_MOTIVOS)}</select></label>
          <label>Reunião de retorno (data)<input type="date" name="retorno"></label></div>
          <label>O que aconteceu<textarea name="detalhe" rows="3" required maxlength="800"></textarea></label>
          <label>Fundamento (regimento, artigo)<input name="base" maxlength="160" placeholder="Ex.: Regimento Escolar, art. …"></label>
          <label>Atividades pedagógicas durante a suspensão<textarea name="atividades" rows="2" maxlength="500" placeholder="O aluno continua tendo direito às atividades: liste o que ele deve fazer em casa"></textarea></label>
          <div class="chk-grid"><label class="switch"><input type="checkbox" name="comparecer" value="1" checked><span>Responsável deve comparecer no retorno</span></label>
          <label class="switch"><input type="checkbox" name="avisar" value="1" checked><span>Avisar a família no chat agora</span></label></div>
          <p class="muted">Assim que você salvar, a suspensão aparece para a família, o aluno, os professores da turma, a coordenação, a direção e a equipe (portaria, agentes, secretaria).</p>
          <button class="btn danger" style="justify-self:start">Lançar suspensão</button></form></details>`;
      const abas2 = [['curso', 'Em curso'], ['agendada', 'Agendadas'], ['cumprida', 'Cumpridas'], ['cancelada', 'Canceladas']];
      const lista = grupos[sp.tab].sort((a, b) => b.inicio.localeCompare(a.inicio));
      return `${form}<div class="card"><div class="ctabs" style="padding:0 0 10px">${abas2.map(([k, n]) => `<button class="${sp.tab === k ? 'on' : ''}" data-act="spTab" data-tab="${k}">${n} (${grupos[k].length})</button>`).join('')}</div>${lista.length ? `<ul class="list oc-list">${lista.map((s) => cardSusp(s, true)).join('')}</ul>` : vazio('Nada nesta lista.')}</div>`;
    },
  };
  const ehUtilHoje = () => (O.ehUtil(hoje()) ? hoje() : O.proxUtil(hoje()));
  BADGE.suspensoes = () => O.susp.ativas().length;
  A.spTab = (el) => { sp.tab = el.dataset.tab; };
  A.spPrint = (el) => { const s = O.susp.list().find((x) => x.id === el.dataset.id); O.imprimir('Termo de suspensão', termoSusp(s)); return false; };
  A.spCanc = (el) => { const r = prompt('Motivo do cancelamento:'); if (!r) return false; sv('susp', O.susp.list().map((s) => (s.id === el.dataset.id ? { ...s, cancelada: true, motivoCanc: r, cancelPor: me().nome } : s))); toast('Suspensão cancelada.'); };
  A.spHom = (el) => { sv('susp', O.susp.list().map((s) => (s.id === el.dataset.id ? { ...s, homolog: { por: O.quem(), ts: now() } } : s))); toast('Suspensão homologada.'); };
  F.spNovo = (d) => {
    const m = me(); if (!d.aluno) { toast('Escolha o aluno.'); return false; }
    const dias = Number(d.dias), fim = O.fimPorDias(d.inicio, dias);
    const s = { id: id(), ra: d.aluno, inicio: d.inicio, fim, dias, motivo: d.motivo, detalhe: d.detalhe, base: d.base || '', atividades: d.atividades || '', retorno: d.retorno || '', comparecer: !!d.comparecer, por: m.nome, uid: m.uid, cargo: m.cargo, cargoNome: m.cargoNome, ts: now(), cancelada: false, cienciaResp: null, cienciaAluno: null, homolog: m.ehDirecao ? { por: O.quem(), ts: now() } : null };
    sv('susp', [...O.susp.list(), s]);
    let msg = '';
    if (d.avisar) { const n = O.avisarFamilia(d.aluno, `Comunicado da escola: ${alunoNome(d.aluno)} está suspenso(a) de ${dt(s.inicio)} a ${dt(s.fim)} (${s.dias} dia(s) letivo(s)). Motivo: ${s.motivo}. Retorno em ${dt(O.proxUtil(s.fim))}.${s.comparecer ? ' Pedimos o comparecimento do responsável no retorno.' : ''} Detalhes na aba Ocorrências.`); msg = n ? ` Família avisada no chat (${n}).` : ' Nenhum responsável vinculado ainda para receber o chat.'; }
    toast('Suspensão lançada para todos verem.' + msg); S.params = {}; sp.tab = O.susp.status(s) === 'agendada' ? 'agendada' : 'curso';
  };

  /* =====================================================================
     CONVOCAÇÕES (aparecem para aluno e responsável)
     ===================================================================== */
  O.crud({
    key: 'convocacoes', t: 'Convocações', i: 'mega', store: 'convoc', edit: true, novo: 'Nova convocação',
    intro: 'Convoque o aluno e/ou o responsável. A convocação aparece na tela inicial deles.',
    campos: [{ n: 'ra', l: 'Aluno', tipo: 'aluno', req: 1 }, { n: 'quem', l: 'Quem deve comparecer', tipo: 'sel', op: ['Aluno e responsável', 'Responsável', 'Aluno'] }, { n: 'data', l: 'Data', tipo: 'date', def: 'hoje', req: 1 }, { n: 'hora', l: 'Hora', tipo: 'time', def: '08:00' }, { n: 'local', l: 'Local', def: 'Sala da direção' }, { n: 'assunto', l: 'Assunto', tipo: 'area', req: 1 }],
    cols: [['data', 'Quando', (v, r) => `${dt(v)}<br><small>${esc(r.hora || '')}</small>`], ['ra', 'Aluno', (v) => `${esc(alunoNome(v))}<br><small>${esc(alunoTurma(v))}</small>`], ['quem', 'Quem'], ['assunto', 'Assunto'], ['st', 'Situação', (v) => pill({ pendente: 'warn', compareceu: 'ok', faltou: 'bad', remarcada: '' }[v] || 'warn', { pendente: 'Pendente', compareceu: 'Compareceu', faltou: 'Não compareceu', remarcada: 'Remarcada' }[v] || 'Pendente')]],
    busca: ['ra', 'assunto'], filtros: [{ n: 'st', l: 'Situação', op: [['pendente', 'Pendente'], ['compareceu', 'Compareceu'], ['faltou', 'Não compareceu'], ['remarcada', 'Remarcada']] }],
    pre: (r, v) => ({ ...r, st: (v && v.st) || 'pendente', por: r.por }),
    ordem: (a, b) => b.data.localeCompare(a.data),
    acoes: [{ k: 'ok', l: 'Compareceu', se: (r) => r.st === 'pendente', fn: (r) => ({ ...r, st: 'compareceu' }) }, { k: 'no', l: 'Faltou', se: (r) => r.st === 'pendente', fn: (r) => ({ ...r, st: 'faltou' }) }],
    depois: (r, novo) => { if (novo) O.avisarFamilia(r.ra, `Convocação da escola: ${r.quem} — ${dt(r.data)} às ${r.hora}, ${r.local}. Assunto: ${r.assunto}`); },
    csv: true,
  });
  BADGE.convocacoes = () => O.convoc.list().filter((c) => c.st === 'pendente' && c.data === hoje()).length;

  /* =====================================================================
     PEDIDOS DA ESCOLA
     ===================================================================== */
  const pd = { tab: 'quadro', sel: null, q: '', cat: '', prio: '', setor: '' };
  const COR_PRIO = { baixa: '#94a3b8', normal: '#2563eb', alta: '#f59e0b', urgente: '#e0364a' };
  const gerencia = (p) => me().ehGestao || me().setor === p.setor;
  const pdLista = () => {
    const m = me(), q = norm(pd.q);
    let l = O.pedidos.list();
    if (pd.tab === 'meus') l = l.filter((p) => p.por === m.uid);
    if (pd.tab === 'setor') l = l.filter((p) => p.setor === m.setor);
    return l.filter((p) => (!pd.cat || p.cat === pd.cat) && (!pd.prio || p.prio === pd.prio) && (!pd.setor || p.setor === pd.setor) && (!q || norm(p.titulo + ' ' + p.num + ' ' + p.desc).includes(q)));
  };
  const kcard = (p) => `<button class="kcard${O.pedidos.atrasado(p) ? ' atras' : ''}" style="--cor:${COR_PRIO[p.prio]}" data-act="pdAbrir" data-id="${p.id}"><b>${esc(p.titulo)}</b><small>${esc(p.num)} · ${esc(O.CATS[p.cat][0])}</small><small>${esc(O.SETOR_NOME[p.setor])}${p.atribNome ? ' · ' + esc(p.atribNome) : ''}${p.prazo ? ' · prazo ' + dt(p.prazo) : ''}</small>${p.aprov && p.aprov.st === 'pendente' ? pill('warn', 'Aguarda aprovação') : ''}</button>`;
  function pdDetalhe(p) {
    const m = me(), ger = gerencia(p), meu = p.por === m.uid, fechado = ['concluido', 'recusado'].includes(p.st);
    const st = O.PED_ST[p.st];
    return `<div class="card"><button class="btn ghost sm" data-act="pdVoltar">${ic('back')} Voltar</button>
      <h2 style="margin-top:12px">${esc(p.titulo)} <small class="muted">${esc(p.num)}</small></h2>
      <p>${pill(st[0], st[1])} ${pill('', 'Prioridade ' + O.PRIO[p.prio][0])} ${pill('', O.CATS[p.cat][0])} ${O.pedidos.atrasado(p) ? pill('bad', 'Atrasado') : ''}</p>
      <div class="grid" style="margin:8px 0"><div><h3>Pedido por</h3>${esc(p.porNome)}<br><small class="muted">${O.fdt(p.ts)}</small></div><div><h3>Setor responsável</h3>${esc(O.SETOR_NOME[p.setor])}<br><small class="muted">${p.atribNome ? 'Atendendo: ' + esc(p.atribNome) : 'Ninguém assumiu ainda'}</small></div><div><h3>Local e prazo</h3>${esc(p.local || '—')}<br><small class="muted">Prazo ${dt(p.prazo)}${p.custo ? ' · custo estimado ' + O.brl(p.custo) : ''}</small></div></div>
      ${p.desc ? `<p>${esc(p.desc)}</p>` : ''}
      ${p.aprov ? `<div class="cx-ap card" style="background:var(--surface-2);box-shadow:none"><b>Aprovação da direção:</b> ${p.aprov.st === 'pendente' ? pill('warn', 'Pendente') : pill(p.aprov.st === 'aprovado' ? 'ok' : 'bad', p.aprov.st === 'aprovado' ? 'Aprovado' : 'Recusado')} ${p.aprov.por ? `<small class="muted">${esc(p.aprov.por)}${p.aprov.nota ? ' — ' + esc(p.aprov.nota) : ''}</small>` : ''}
        ${p.aprov.st === 'pendente' && m.ehDirecao ? `<form class="form" data-f="pdAprov:${p.id}" style="max-width:none;margin-top:8px"><input name="nota" maxlength="140" placeholder="Observação (opcional)"><div class="row-btns"><button class="btn sm" name="r" value="aprovado">Aprovar</button><button class="btn ghost sm" name="r" value="recusado">Recusar</button></div></form>` : ''}</div>` : ''}
      ${ger && !fechado ? `<form class="form" data-f="pdSt:${p.id}" style="max-width:none;margin-top:12px"><div class="fields"><label>Situação<select name="st">${optHtml(Object.entries(O.PED_ST).map(([k, v]) => [k, v[1]]), p.st)}</select></label><label>Prazo<input type="date" name="prazo" value="${p.prazo || ''}"></label><label>Observação<input name="nota" maxlength="200" placeholder="O que foi feito / o que falta"></label></div>
        <div class="row-btns"><button class="btn sm">Atualizar</button>${p.atrib !== m.uid ? `<button type="button" class="btn ghost sm" data-act="pdAssumir" data-id="${p.id}">Assumir este pedido</button>` : ''}</div></form>` : ''}
      ${fechado && (meu || ger) ? `<p><button class="btn ghost sm" data-act="pdReabrir" data-id="${p.id}">Reabrir</button></p>` : ''}
      ${p.st === 'concluido' && meu ? `<div class="stars" aria-label="Avalie o atendimento">Avalie o atendimento: ${[1, 2, 3, 4, 5].map((n) => `<button class="${(p.nota || 0) >= n ? 'on' : ''}" data-act="pdNota" data-id="${p.id}" data-n="${n}" aria-label="${n} estrelas">★</button>`).join('')}</div>` : ''}
      <h3 style="margin-top:16px">Histórico</h3><ul class="tl-line">${p.hist.slice().reverse().map((h) => `<li>${esc(h.t)}<br><small>${esc(h.por)} · ${O.fdt(h.ts)}</small></li>`).join('')}</ul>
      ${!fechado ? `<form class="form" data-f="pdCom:${p.id}" style="max-width:none;margin-top:12px"><div class="row-btns"><input name="t" required maxlength="300" placeholder="Escrever um comentário" style="flex:1"><button class="btn sm">Comentar</button></div></form>` : ''}</div>`;
  }
  V.pedidos = {
    t: 'Pedidos da escola', i: 'clip',
    r() {
      const m = me();
      if (pd.sel) { const p = O.pedidos.list().find((x) => x.id === pd.sel); if (p) return pdDetalhe(p); pd.sel = null; }
      const l = pdLista();
      const tabs = [['quadro', 'Quadro'], ['lista', 'Lista'], ['meus', 'Meus pedidos'], ['setor', 'Do meu setor']];
      const form = `<details class="card form-card"><summary><b>${ic('plus')} Novo pedido</b></summary><form class="form" style="max-width:none" data-f="pdNovo"><div class="fields">
        <label style="grid-column:1/-1">O que você precisa?<input name="titulo" required maxlength="100" placeholder="Ex.: Trocar lâmpadas do corredor do 2º andar"></label>
        <label>Categoria<select name="cat">${optHtml(Object.entries(O.CATS).map(([k, v]) => [k, v[0]]))}</select></label>
        <label>Prioridade<select name="prio">${optHtml(Object.entries(O.PRIO).map(([k, v]) => [k, v[0]]), 'normal')}</select></label>
        <label>Setor que vai atender<select name="setor"><option value="">Automático (pela categoria)</option>${optHtml(Object.entries(O.SETOR_NOME))}</select></label>
        <label>Onde<input name="local" maxlength="60" placeholder="Sala, setor…"></label>
        <label>Custo estimado (R$, se houver)<input name="custo" inputmode="decimal" placeholder="0,00"></label></div>
        <label>Detalhes<textarea name="desc" rows="3" maxlength="800"></textarea></label>
        <label class="switch"><input type="checkbox" name="aprov" value="1"><span>Precisa de aprovação da direção<small>Marque para compras, obras e gastos.</small></span></label>
        <button class="btn" style="justify-self:start">Enviar pedido</button></form></details>`;
      const filtros = `<div class="filtros"><input type="search" data-in="pdq" placeholder="Buscar" value="${esc(pd.q)}" aria-label="Buscar pedido"><select data-ch="pd" data-n="cat"><option value="">Categoria: todas</option>${optHtml(Object.entries(O.CATS).map(([k, v]) => [k, v[0]]), pd.cat)}</select><select data-ch="pd" data-n="prio"><option value="">Prioridade: todas</option>${optHtml(Object.entries(O.PRIO).map(([k, v]) => [k, v[0]]), pd.prio)}</select><select data-ch="pd" data-n="setor"><option value="">Setor: todos</option>${optHtml(Object.entries(O.SETOR_NOME), pd.setor)}</select></div>`;
      let corpo;
      if (pd.tab === 'quadro') {
        const col = (k, t, f) => { const x = l.filter(f); return `<div class="kcol"><h3>${t} <span>${x.length}</span></h3>${x.sort((a, b) => b.ts - a.ts).map(kcard).join('') || '<small class="muted">—</small>'}</div>`; };
        corpo = `<div class="kanban">${col('a', 'Abertos', (p) => p.st === 'aberto')}${col('b', 'Em análise', (p) => p.st === 'analise')}${col('c', 'Em andamento', (p) => p.st === 'andamento')}${col('d', 'Aguardando', (p) => p.st === 'aguardando')}${col('e', 'Concluídos', (p) => ['concluido', 'recusado'].includes(p.st) && p.atualizado > now() - 7 * 864e5)}</div>`;
      } else {
        corpo = l.length ? `<div class="tscroll"><table><thead><tr><th>Nº</th><th>Pedido</th><th>Setor</th><th>Prioridade</th><th>Situação</th><th>Prazo</th></tr></thead><tbody>${l.sort((a, b) => b.ts - a.ts).map((p) => `<tr><td><button class="btn ghost sm" data-act="pdAbrir" data-id="${p.id}">${esc(p.num)}</button></td><td>${esc(p.titulo)}<br><small>${esc(p.porNome)}</small></td><td>${esc(O.SETOR_NOME[p.setor])}</td><td>${pill(p.prio === 'urgente' ? 'bad' : p.prio === 'alta' ? 'warn' : '', O.PRIO[p.prio][0])}</td><td>${pill(...O.PED_ST[p.st])}</td><td>${dt(p.prazo)}${O.pedidos.atrasado(p) ? ' ' + pill('bad', 'atrasado') : ''}</td></tr>`).join('')}</tbody></table></div>` : vazio('Nenhum pedido encontrado.');
      }
      return `${form}<div class="card"><div class="ctabs" style="padding:0 0 10px">${tabs.map(([k, n]) => `<button class="${pd.tab === k ? 'on' : ''}" data-act="pdTab" data-tab="${k}">${n}</button>`).join('')}</div>${filtros}${corpo}</div>`;
    },
  };
  BADGE.pedidos = () => { const m = me(); return O.pedidos.doSetor(m.setor).filter((p) => p.st === 'aberto').length; };
  A.pdTab = (el) => { pd.tab = el.dataset.tab; pd.sel = null; };
  A.pdAbrir = (el) => { pd.sel = el.dataset.id; window.scrollTo(0, 0); };
  A.pdVoltar = () => { pd.sel = null; };
  C.pd = (el) => { pd[el.dataset.n] = el.value; };
  I.pdq = (el) => { pd.q = el.value; clearTimeout(I._pq); I._pq = setTimeout(() => S.refresh({ foco: el }), 220); };
  const pdMut = (i, fn, texto) => { sv('org_ped', O.pedidos.list().map((p) => { if (p.id !== i) return p; const n = fn(p); return { ...n, atualizado: now(), hist: texto ? [...p.hist, { ts: now(), por: O.quem(), t: texto }] : p.hist }; })); };
  A.pdAssumir = (el) => { pdMut(el.dataset.id, (p) => ({ ...p, atrib: me().uid, atribNome: me().nome, st: p.st === 'aberto' ? 'andamento' : p.st }), 'Assumiu o pedido'); toast('Pedido assumido.'); };
  A.pdReabrir = (el) => { pdMut(el.dataset.id, (p) => ({ ...p, st: 'aberto' }), 'Pedido reaberto'); };
  A.pdNota = (el) => { pdMut(el.dataset.id, (p) => ({ ...p, nota: Number(el.dataset.n) }), `Avaliou o atendimento: ${el.dataset.n} de 5`); };
  F.pdNovo = (d) => {
    const p = O.pedidos.novo({ titulo: d.titulo, desc: d.desc, cat: d.cat, prio: d.prio, setor: d.setor, local: d.local, custo: O.num(d.custo), aprov: !!d.aprov || (d.cat === 'material' && O.num(d.custo) > 0) });
    pd.sel = p.id; pd.tab = 'quadro'; toast(`Pedido ${p.num} enviado para ${O.SETOR_NOME[p.setor]}.`);
  };
  F.pdSt = (d, f, i) => {
    const p = O.pedidos.list().find((x) => x.id === i);
    if (p.aprov && p.aprov.st === 'pendente' && ['andamento', 'concluido'].includes(d.st)) { toast('Este pedido ainda aguarda a aprovação da direção.'); return false; }
    if (p.aprov && p.aprov.st === 'recusado' && d.st !== 'recusado') { toast('A direção recusou este pedido.'); return false; }
    pdMut(i, (x) => ({ ...x, st: d.st, prazo: d.prazo || x.prazo }), `Situação: ${O.PED_ST[d.st][1]}${d.nota ? ' — ' + d.nota : ''}`); toast('Pedido atualizado.');
  };
  F.pdCom = (d, f, i) => { pdMut(i, (p) => p, d.t); };
  F.pdAprov = (d, f, i, e) => {
    const r = e.submitter.value;
    pdMut(i, (p) => ({ ...p, aprov: { st: r, por: O.quem(), ts: now(), nota: d.nota || '' }, st: r === 'recusado' ? 'recusado' : p.st === 'aberto' ? 'analise' : p.st }), `Direção ${r === 'aprovado' ? 'aprovou' : 'recusou'} o pedido${d.nota ? ': ' + d.nota : ''}`); toast(r === 'aprovado' ? 'Aprovado.' : 'Recusado.');
  };
  // reservado: usado pela tela de aprovações
  A.pdAbrirV = (el) => { pd.sel = el.dataset.id; S.go('pedidos'); return false; };

  /* =====================================================================
     CHAMADOS RÁPIDOS (um toque, para a equipe da escola)
     ===================================================================== */
  const ST_CH = { aberto: ['warn', 'Aberto'], assumido: ['', 'Assumido'], feito: ['ok', 'Concluído'] };
  const chItem = (c, acao) => `<li class="${c.urg ? 'sos' : ''}"><span>${c.urg ? '🆘 ' : ''}<b>${esc(c.tipo)}</b>${c.sala ? ' · ' + esc(c.sala) : ''}<br><small class="muted">${esc(c.obs || '')}${c.obs ? ' · ' : ''}pedido por ${esc(c.por)} · ${esc(c.at)}${c.quem ? ' · assumido por ' + esc(c.quem) : ''}</small></span><span>${pill(...ST_CH[c.st || 'aberto'])} ${acao || ''}</span></li>`;
  V.chamados = {
    t: 'Chamados rápidos', i: 'bell',
    r() {
      const m = me(), todos = O.chamados.list(), meus = todos.filter((c) => c.por === O.quem() || c.por === m.nome);
      const inbox = O.chamados.doSetor(m.setor);
      const novos = inbox.filter((c) => (c.st || 'aberto') === 'aberto').sort((a, b) => (b.urg || 0) - (a.urg || 0));
      const meusAssum = inbox.filter((c) => c.st === 'assumido' && c.quem === m.nome);
      const form = `<form class="card form" style="max-width:none" data-f="chamNovo"><h2>Chamar alguém</h2><div class="fields"><label>Do que você precisa?<select name="tipo">${optHtml(O.CH_TIPOS.map((t, i) => [i, t[0]]))}</select></label><label>Onde<input name="sala" required maxlength="30" placeholder="Ex.: 2º B, pátio"></label><label>Observação<input name="obs" maxlength="120"></label></div><label class="switch"><input type="checkbox" name="urg" value="1"><span>Urgente</span></label><button class="btn" style="justify-self:start">Chamar</button></form>`;
      const meu = ['gestao'].includes(m.role) ? '' : `<div class="card"><h2>Novos para o meu setor (${novos.length})</h2>${novos.length ? `<ul class="list">${novos.map((c) => chItem(c, `<button class="btn sm" data-act="chamAs" data-id="${c.id}">Assumir</button>`)).join('')}</ul>` : vazio('Nenhum chamado novo. 🎉')}</div>
        <div class="card"><h2>Que eu assumi</h2>${meusAssum.length ? `<ul class="list">${meusAssum.map((c) => chItem(c, `<button class="btn sm" data-act="chamFim" data-id="${c.id}">Concluir</button>`)).join('')}</ul>` : vazio('Nada em andamento.')}</div>`;
      const gest = m.ehGestao ? `<div class="card"><h2>Todos os chamados abertos</h2>${todos.filter((c) => (c.st || 'aberto') !== 'feito').length ? `<ul class="list">${todos.filter((c) => (c.st || 'aberto') !== 'feito').map((c) => chItem(c, '')).join('')}</ul>` : vazio('Nenhum chamado aberto.')}</div>` : '';
      return `${form}${meu}${gest}<div class="card"><h2>Meus chamados</h2>${meus.length ? `<ul class="list">${meus.slice(0, 10).map((c) => chItem(c, '')).join('')}</ul>` : vazio('Você ainda não fez chamados.')}</div>`;
    },
  };
  BADGE.chamados = () => { const m = me(); return m.ehGestao ? 0 : O.chamados.doSetor(m.setor).filter((c) => (c.st || 'aberto') === 'aberto').length; };
  F.chamNovo = (d) => { const [tipo, alvo] = O.CH_TIPOS[Number(d.tipo)]; O.chamados.save([{ id: id(), tipo, alvo, sala: d.sala, obs: d.obs, urg: d.urg ? 1 : 0, por: O.quem(), st: 'aberto', at: O.fdt(now()), ts: now() }, ...O.chamados.list()]); toast('Chamado enviado!'); };
  A.chamAs = (el) => { O.chamados.save(O.chamados.list().map((c) => (c.id === el.dataset.id ? { ...c, st: 'assumido', quem: me().nome } : c))); toast('Chamado assumido!'); };
  A.chamFim = (el) => { O.chamados.save(O.chamados.list().map((c) => (c.id === el.dataset.id ? { ...c, st: 'feito' } : c))); toast('Concluído. Obrigado!'); };

  /* =====================================================================
     MURAL
     ===================================================================== */
  V.mural = {
    t: 'Mural da escola', i: 'mega',
    r() {
      const av = ld('avisos', []), ev = ld('cal', []).filter((e) => e.data >= hoje()).sort((a, b) => a.data.localeCompare(b.data));
      return `<div class="card"><h2>Avisos</h2>${av.length ? `<ul class="list">${av.map((a) => `<li><span><b>${esc(a.t)}</b><br>${esc(a.m)}</span><small>${O.fdt(a.ts)}</small></li>`).join('')}</ul>` : vazio('Nenhum aviso publicado.')}</div>
      <div class="card"><h2>Próximos eventos</h2>${ev.length ? `<ul class="list">${ev.map((e) => `<li><span>${esc(e.titulo)}</span>${pill('', dt(e.data))}</li>`).join('')}</ul>` : vazio('Nada marcado no calendário.')}</div>`;
    },
  };

  /* =====================================================================
     PERFIL
     ===================================================================== */
  V.perfil = {
    t: 'Meu perfil', i: 'id',
    r() {
      const m = me(); let tema = 'claro'; try { tema = localStorage.getItem('colombo.org.tema') || 'claro'; } catch { /* ignora */ }
      return `<div class="card"><div class="profile-pic"><span class="avatar-lg" style="background:linear-gradient(135deg,var(--accent),var(--accent-2))">${esc(O.iniciais(m.nome))}</span><div><h2 style="margin:0">${esc(m.nome)}</h2><p class="muted">${esc(m.cargoNome)} · @${esc(m.login)}</p></div></div></div>
      <form class="card form" data-f="perfil"><h2>Meus dados</h2><label>Como quer ser chamado(a)<input name="nome" required maxlength="80" value="${esc(m.nome)}"></label><label>Contato<input name="tel" maxlength="40" value="${esc(O.perfilLocal(m.uid).tel || m.contato || '')}"></label><button class="btn" style="justify-self:start">Salvar</button></form>
      <div class="card"><h2>Aparência</h2><div class="themes"><button class="${tema === 'claro' ? 'on' : ''}" data-act="tema" data-v="claro"><span class="sw" style="background:#fff"></span>Claro</button><button class="${tema === 'escuro' ? 'on' : ''}" data-act="tema" data-v="escuro"><span class="sw" style="background:#101842"></span>Escuro</button></div></div>
      ${m.ehGestao || m.grupo === 'goe' ? `<div class="card"><h2>Dados de demonstração</h2><p class="muted">Para testar o sistema com a escola “em movimento” (ocorrências, chamadas, pedidos, visitantes, estoque…). Pode limpar depois sem perder o que você cadastrou de verdade.</p><div class="row-btns"><button class="btn" data-act="seedOn">Carregar demonstração</button><button class="btn ghost" data-act="seedOff">Limpar demonstração</button></div></div>` : ''}`;
    },
  };
  F.perfil = (d) => { const m = me(), p = ld('org_perfil', {}); p[m.uid] = { nome: d.nome.trim(), tel: d.tel }; sv('org_perfil', p); toast('Salvo!'); setTimeout(() => location.reload(), 500); return false; };
  A.tema = (el) => { try { localStorage.setItem('colombo.org.tema', el.dataset.v); } catch { /* ignora */ } S.aplicaTema(); };
  A.seedOn = () => { if (O.seed) { O.seed.ligar(); toast('Demonstração carregada.'); } };
  A.seedOff = () => { if (O.seed) { O.seed.limpar(); toast('Demonstração removida.'); } };

  /* =====================================================================
     ALUNO 360
     ===================================================================== */
  let r360 = '';
  V.aluno360 = {
    t: 'Ficha do aluno (360°)', i: 'user', n: 'Ficha do aluno',
    r() {
      if (S.params.ra) { r360 = S.params.ra; S.params = {}; }
      const pick = `<form class="card form" style="max-width:none" data-f="a360"><h2>Procurar aluno</h2>${alunoPicker('aluno', { ra: r360, req: true })}<button class="btn" style="justify-self:start">Abrir ficha</button></form>`;
      const a = r360 ? alunoDe(r360) : null; if (!a) return `<p class="muted intro">Veja tudo do aluno em um só lugar: frequência, notas, ocorrências, suspensões, convocações e documentos.</p>${pick}`;
      const ra = a.ra, tk = D.turmaKey(a), bol = TURMAS.boletim(a), notas = D.notasDe(a, bol.notas), freq = D.freqDe(a, bol.freq);
      let au = 0, fa = 0; Object.values(freq).forEach(([x, y]) => { au += x; fa += y; }); const pct = au ? ((au - fa) / au) * 100 : 100;
      const meds = Object.entries(notas).map(([d, n]) => { const l = n.filter((v) => v !== null); return [d, l.length ? l.reduce((s, v) => s + v, 0) / l.length : null]; });
      const med = meds.filter((x) => x[1] !== null); const mediaGeral = med.length ? med.reduce((s, x) => s + x[1], 0) / med.length : 0;
      const abaixo = meds.filter((x) => x[1] !== null && x[1] < 5).map((x) => x[0]);
      const ocs = O.ocorr.list().filter((o) => o.aluno === ra).sort((x, y) => (y.data || '').localeCompare(x.data || ''));
      const sps = O.susp.deAluno(ra), cvs = O.convoc.list().filter((c) => c.ra === ra), chs = O.cham.list().filter((c) => c.turma === tk);
      const diasReg = chs.length, faltasCham = chs.filter((c) => c.ausentes.includes(ra)).length;
      const ficha = ld('sec_ficha', {})[ra] || { docs: {} }, pend = Object.values(ficha.docs || {}).filter((x) => x.st === 'Pendente').length;
      const busca = ld('org_busca', []).filter((b) => b.ra === ra).sort((x, y) => y.data.localeCompare(x.data));
      const atrasos = ld('agt_atrasos', []).filter((x) => x.ra === ra), saidas = ld('saidas', []).filter((x) => x.ra === ra), just = O.justif.list().filter((x) => x.ra === ra);
      const eventos = [].concat(ocs.map((o) => [o.data, 'alert', `${o.tipo}: ${o.obs}`, tomTipo(o.tipo)]), sps.map((s) => [s.inicio, 'flag', `Suspensão (${s.dias} dia(s)): ${s.motivo}`, 'bad']), cvs.map((c) => [c.data, 'mega', `Convocação (${c.quem}): ${c.assunto}`, 'warn']),
        atrasos.map((x) => [x.data, 'clock', `Atraso às ${x.hora}: ${x.acao || ''}`, '']), saidas.map((x) => [x.data, 'door', `Saída antecipada: ${x.motivo}`, '']), just.map((x) => [x.de, 'file', `Justificativa de faltas (${x.tipo})`, 'ok']), busca.map((b) => [b.data, 'phone', `Busca ativa (${b.via}): ${b.res}`, ''])).sort((x, y) => y[0].localeCompare(x[0])).slice(0, 25);
      const resp = O.responsaveisDe(ra);
      return `${pick}<div class="card"><div class="aluno-head"><span class="cav" style="background:linear-gradient(135deg,${O.corDe(a.nome)},#0b1240)">${esc(O.iniciais(a.nome))}</span><div style="flex:1"><h2 style="margin:0">${esc(a.nome)}</h2><p class="muted" style="margin:2px 0">RA ${a.ra} · matrícula ${a.matricula} · ${esc(TURMAS.rotulo(a))}${TURMAS.cursoDe(a) ? ' · ' + esc(TURMAS.cursoDe(a).nome) : ''}${a.gremio ? ' · Grêmio: ' + esc(a.gremio) : ''}</p><p class="muted" style="margin:2px 0">Responsável no app: ${resp.length ? resp.map((r) => esc(r.nome)).join(', ') : 'ainda não vinculado'}</p></div>
        <div class="row-btns">${me().ehGestao ? `<button class="btn sm" data-go="ocorrencias" data-ra="${ra}">Lançar ocorrência</button><button class="btn danger sm" data-go="suspensoes" data-ra="${ra}">Suspender</button><button class="btn ghost sm" data-go="convocacoes" data-ra="${ra}">Convocar</button>` : ''}</div></div></div>
        <div class="kpis">${O.kpi('Frequência (boletim)', pct.toFixed(1).replace('.', ',') + '%', `${fa} faltas em ${au} aulas`, pct < 75 ? 'bad' : 'ok')}${O.kpi('Média geral', mediaGeral ? mediaGeral.toFixed(1).replace('.', ',') : '—', abaixo.length ? 'Abaixo da média: ' + abaixo.join(', ') : 'Sem disciplina abaixo de 5', abaixo.length ? 'warn' : 'ok')}${O.kpi('Faltas na chamada', diasReg ? `${faltasCham}/${diasReg}` : '—', diasReg ? 'dias de chamada registrados' : 'chamada ainda não feita', '')}${O.kpi('Ocorrências', ocs.length, `${ocs.filter((o) => o.tipo === 'Advertência').length} advertência(s)`, ocs.length > 3 ? 'warn' : '')}${O.kpi('Suspensões', sps.length, sps.some((s) => O.susp.status(s) === 'curso') ? 'Suspenso hoje' : 'Nenhuma em curso', sps.some((s) => O.susp.status(s) === 'curso') ? 'bad' : '')}${O.kpi('Documentos pendentes', pend, pend ? 'Ver na secretaria' : 'Em dia', pend ? 'warn' : 'ok')}</div>
        <div class="card"><h2>Linha do tempo</h2>${eventos.length ? `<ul class="tl-line">${eventos.map((e) => `<li>${pill(e[3], dt(e[0]))} ${esc(e[2])}</li>`).join('')}</ul>` : vazio('Nada registrado para este aluno.')}</div>`;
    },
  };
  F.a360 = (d) => { r360 = d.aluno; };

  /* =====================================================================
     SAÍDA ANTECIPADA
     ===================================================================== */
  V.saidas = {
    t: 'Saída antecipada de alunos', i: 'door', n: 'Saídas antecipadas',
    r() {
      const m = me(), l = ld('saidas', []).filter((s) => s.data >= O.antes(7)).sort((a, b) => b.ts - a.ts), pode = !['seguranca'].includes(m.grupo) || true;
      const ST = { autorizada: ['warn', 'Autorizada'], saiu: ['ok', 'Já saiu'], cancelada: ['', 'Cancelada'] };
      const form = `<details class="card form-card"><summary><b>${ic('plus')} Autorizar saída</b></summary><form class="form" style="max-width:none" data-f="saiNova"><div class="fields">${alunoPicker('aluno')}<label>Motivo<select name="motivo">${optHtml(['Consulta médica', 'Mal-estar / doença', 'Família veio buscar', 'Compromisso familiar', 'Outro'])}</select></label><label>Quem vai buscar<input name="quem" required maxlength="60" placeholder="Nome de quem busca"></label><label>Parentesco / documento<input name="doc" maxlength="60" placeholder="Ex.: mãe, RG 00.000.000-0"></label><label>Horário previsto<input type="time" name="hora" value="${O.agora()}"></label></div>
        <label class="switch"><input type="checkbox" name="conf" value="1"><span>Responsável já confirmou por telefone/WhatsApp</span></label><button class="btn" style="justify-self:start">Autorizar</button></form></details>`;
      return `<p class="muted intro">A gestão ou a secretaria autoriza; a segurança e os agentes conferem o documento de quem busca e registram a saída.</p>${form}
      <div class="card"><h2>Hoje e últimos 7 dias</h2>${l.length ? `<ul class="list">${l.map((s) => `<li><span><b>${esc(alunoNome(s.ra))}</b> · ${esc(alunoTurma(s.ra))} ${pill(...ST[s.st])}<br><small class="muted">${dt(s.data)} ${esc(s.hora || '')} · ${esc(s.motivo)} · busca: ${esc(s.quem)}${s.doc ? ' (' + esc(s.doc) + ')' : ''} · ${s.conf ? 'família confirmou' : 'sem confirmação da família'}<br>Autorizada por ${esc(s.por)}${s.saiuTs ? ' · saiu às ' + hm(s.saiuTs) + ' (' + esc(s.saiuPor) + ')' : ''}</small></span>
        <span>${s.st === 'autorizada' && ['seguranca', 'agente'].includes(m.grupo) || (s.st === 'autorizada' && m.ehGestao) ? `<button class="btn sm" data-act="saiOk" data-id="${s.id}">Registrar saída</button>` : ''} ${s.st === 'autorizada' ? `<button class="btn ghost sm" data-act="saiCanc" data-id="${s.id}">Cancelar</button>` : ''}</span></li>`).join('')}</ul>` : vazio('Nenhuma saída registrada.')}</div>`;
    },
  };
  BADGE.saidas = () => ld('saidas', []).filter((s) => s.data === hoje() && s.st === 'autorizada').length;
  F.saiNova = (d) => { if (!d.aluno) { toast('Escolha o aluno.'); return false; } const m = me(); sv('saidas', [...ld('saidas', []), { id: id(), ra: d.aluno, motivo: d.motivo, quem: d.quem, doc: d.doc, hora: d.hora, conf: !!d.conf, data: hoje(), st: 'autorizada', por: `${m.nome} (${m.cargoNome})`, ts: now() }]); toast('Saída autorizada. A portaria já vê.'); };
  A.saiOk = (el) => { sv('saidas', ld('saidas', []).map((s) => (s.id === el.dataset.id ? { ...s, st: 'saiu', saiuTs: now(), saiuPor: me().nome } : s))); toast('Saída registrada.'); };
  A.saiCanc = (el) => { sv('saidas', ld('saidas', []).map((s) => (s.id === el.dataset.id ? { ...s, st: 'cancelada' } : s))); };

  /* =====================================================================
     PROFESSORES AUSENTES HOJE (aulas sem professor)
     ===================================================================== */
  const gradeDe = (login) => { try { return JSON.parse(localStorage.getItem(`colombo.professor.${login}.grade`)) || []; } catch { return []; } };
  const aulasSemProf = (dia = hoje()) => {
    const nomeDia = O.diaSem(dia), out = [];
    ld('falta_prof', []).filter((f) => f.data === dia).forEach((f) => {
      if (!f.prof) return;
      gradeDe(f.prof).filter((g) => g.dia === nomeDia).forEach((g) => { const sub = ld('subs', []).find((s) => s.data === dia && s.turma === g.turma && s.disc === g.disc && s.hora === g.hora && s.escolhido); out.push({ ...g, prof: f.nome, login: f.prof, motivo: f.motivo, sub }); });
    });
    return out.sort((a, b) => a.hora.localeCompare(b.hora));
  };
  O.aulasSemProf = aulasSemProf;
  V.profausentes = {
    t: 'Professores ausentes e aulas sem professor', i: 'swap', n: 'Professores ausentes',
    r() {
      const m = me(), edita = m.ehGestao || m.grupo === 'goe', fp = ld('falta_prof', []).filter((f) => f.data >= O.antes(14)).sort((a, b) => b.data.localeCompare(a.data));
      const aulas = aulasSemProf(), subs = ld('subs', []);
      const form = edita ? `<details class="card form-card"><summary><b>${ic('plus')} Registrar ausência de professor</b></summary><form class="form" style="max-width:none" data-f="faltaProf"><div class="fields"><label>Professor(a) cadastrado(a)<select name="prof"><option value="">Outro (digitar o nome)</option>${optHtml(O.professores().map((p) => [p.login, p.nome]))}</select></label><label>Nome (se não estiver na lista)<input name="nome" maxlength="80"></label><label>Data<input type="date" name="data" value="${hoje()}" required></label><label>Motivo<select name="motivo">${optHtml(['Atestado médico', 'Licença', 'Falta', 'Compromisso / abono', 'Outro'])}</select></label></div><label>Observação<input name="obs" maxlength="160"></label><button class="btn" style="justify-self:start">Registrar</button></form></details>` : '';
      return `<p class="muted intro">Quando um professor falta, a escola precisa saber quais aulas ficam sem professor para organizar substituição e para os agentes acompanharem as turmas.</p>${form}
      <div class="card"><h2>Aulas sem professor hoje</h2>${aulas.length ? `<div class="tscroll"><table><thead><tr><th>Horário</th><th>Turma</th><th>Disciplina</th><th>Professor ausente</th><th>Substituto</th></tr></thead><tbody>${aulas.map((a) => `<tr><td>${esc(a.hora)}</td><td>${esc(D.turmaNome(a.turma))}</td><td>${esc(a.disc)}</td><td>${esc(a.prof)}</td><td>${a.sub ? pill('ok', O.professores().find((p) => p.login === a.sub.escolhido)?.nome || a.sub.escolhido) : edita ? `<button class="btn sm" data-act="subPub" data-turma="${esc(a.turma)}" data-disc="${esc(a.disc)}" data-hora="${esc(a.hora)}">Publicar para substituição</button>` : pill('warn', 'Sem substituto')}</td></tr>`).join('')}</tbody></table></div>` : vazio(fp.some((f) => f.data === hoje()) ? 'Há ausência registrada hoje, mas o professor não tem aulas cadastradas na agenda dele.' : 'Nenhuma aula descoberta hoje.')}</div>
      <div class="card"><h2>Ausências registradas (14 dias)</h2>${fp.length ? `<ul class="list">${fp.map((f) => `<li><span><b>${esc(f.nome)}</b> · ${dt(f.data)}<br><small class="muted">${esc(f.motivo)}${f.obs ? ' — ' + esc(f.obs) : ''} · registrado por ${esc(f.por)}</small></span>${edita ? `<button class="btn ghost sm" data-act="faltaDel" data-id="${f.id}" aria-label="Apagar">${ic('trash')}</button>` : ''}</li>`).join('')}</ul>` : vazio('Nenhuma ausência registrada.')}</div>
      <div class="card"><h2>Aulas publicadas para substituição</h2>${subs.length ? `<ul class="list">${subs.slice(-8).reverse().map((s) => `<li><span><b>${esc(s.disc)}</b> · ${esc(D.turmaNome(s.turma))} · ${dt(s.data)} ${esc(s.hora)}</span>${s.escolhido ? pill('ok', 'Confirmada') : pill('warn', (s.interessados || []).length + ' interessado(s)')}</li>`).join('')}</ul>` : vazio('Nenhuma aula publicada.')}</div>`;
    },
  };
  BADGE.profausentes = () => aulasSemProf().filter((a) => !a.sub).length;
  F.faltaProf = (d) => { const pr = O.professores().find((p) => p.login === d.prof); const nome = pr ? pr.nome : d.nome.trim(); if (!nome) { toast('Escolha ou digite o professor.'); return false; } sv('falta_prof', [...ld('falta_prof', []), { id: id(), prof: d.prof || '', nome, data: d.data, motivo: d.motivo, obs: d.obs, por: me().nome, ts: now() }]); toast('Ausência registrada.'); };
  A.faltaDel = (el) => { sv('falta_prof', ld('falta_prof', []).filter((f) => f.id !== el.dataset.id)); };
  A.subPub = (el) => { sv('subs', [...ld('subs', []), { id: id(), turma: el.dataset.turma, disc: el.dataset.disc, data: hoje(), hora: el.dataset.hora, interessados: [], escolhido: '' }]); toast('Publicada. Os professores já veem.'); };

  /* =====================================================================
     MINHA ESCALA
     ===================================================================== */
  const DIAS5 = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const minhaLinha = () => { const m = me(), pes = ld('goe_func', []).find((f) => (f.login && f.login === m.login) || O.norm(f.nome) === O.norm(m.nome)); return pes ? { pes, esc: (ld('goe_escala', {})[pes.id] || {}) } : null; };
  V.escalaver = {
    t: 'Minha escala', i: 'cal',
    r() {
      const x = minhaLinha(); const hojeNome = O.diaSem(hoje());
      if (!x) return `<div class="card"><h2>Minha escala</h2>${vazio('Sua escala ainda não foi cadastrada. O GOE cadastra em Pessoal → Escala (informe seu login no cadastro).')}</div>`;
      const L = { M: 'Manhã', T: 'Tarde', I: 'Integral', F: 'Folga' };
      return `<div class="card"><h2>Minha escala semanal</h2><p class="muted">${esc(x.pes.funcao || '')} · ${esc(x.pes.turno || '')}${x.esc.area ? ' · área: ' + esc(x.esc.area) : ''}</p><div class="week">${DIAS5.map((d) => `<div class="day${d === hojeNome ? ' today' : ''}"><header><h3>${d}</h3>${d === hojeNome ? pill('info', 'Hoje') : ''}</header><b>${L[x.esc[d]] || '—'}</b></div>`).join('')}</div></div>`;
    },
  };

  /* =====================================================================
     CADASTROS SIMPLES (achados e perdidos, contatos, reservas, prazos, incidentes)
     ===================================================================== */
  O.crud({
    key: 'achados', t: 'Achados e perdidos', i: 'search', store: 'achados', edit: true, csv: true, novo: 'Registrar objeto achado',
    campos: [{ n: 'item', l: 'Objeto', req: 1, ph: 'Ex.: casaco azul, garrafa, fone' }, { n: 'local', l: 'Onde foi achado', ph: 'Pátio, sala 1º A…' }, { n: 'data', l: 'Data', tipo: 'date', def: 'hoje' }, { n: 'obs', l: 'Detalhes (cor, marca, nome na etiqueta)', larg: 1 }, { n: 'st', l: 'Situação', tipo: 'sel', op: ['Guardado', 'Devolvido'] }, { n: 'dono', l: 'Devolvido a (se já devolveu)' }],
    cols: [['data', 'Data', (v) => dt(v)], ['item', 'Objeto'], ['local', 'Local'], ['obs', 'Detalhes'], ['st', 'Situação', (v) => pill(v === 'Devolvido' ? 'ok' : 'warn', v)], ['dono', 'Devolvido a']],
    busca: ['item', 'obs', 'local'], filtros: [{ n: 'st', l: 'Situação', op: ['Guardado', 'Devolvido'] }], ordem: (a, b) => b.data.localeCompare(a.data),
    acoes: [{ k: 'dev', l: 'Marcar devolvido', se: (r) => r.st !== 'Devolvido', fn: (r) => { const q = prompt('Devolvido a quem?'); return q ? { ...r, st: 'Devolvido', dono: q } : false; } }],
  });
  O.crud({
    key: 'incidentes', t: 'Livro de ocorrências da segurança', n: 'Incidentes', i: 'siren', store: 'seg_incid', edit: true, csv: true, periodo: 'data', periodoDef: '30', novo: 'Registrar incidente',
    intro: 'Fatos que não são sobre um aluno específico: pessoa estranha, dano ao patrimônio, veículo, queda de energia, furto etc. A gestão acompanha.',
    campos: [{ n: 'tipo', l: 'Tipo', tipo: 'sel', op: ['Pessoa estranha / invasão', 'Dano ao patrimônio', 'Furto ou perda', 'Briga / tumulto', 'Veículo / trânsito', 'Problema elétrico / hidráulico', 'Outro'] }, { n: 'local', l: 'Local', req: 1 }, { n: 'data', l: 'Data', tipo: 'date', def: 'hoje' }, { n: 'hora', l: 'Hora', tipo: 'time', def: 'agora' }, { n: 'desc', l: 'O que aconteceu', tipo: 'area', req: 1 }, { n: 'prov', l: 'Providências', tipo: 'area' }, { n: 'st', l: 'Situação', tipo: 'sel', op: ['Aberto', 'Resolvido'] }],
    cols: [['data', 'Quando', (v, r) => `${dt(v)} ${esc(r.hora || '')}`], ['tipo', 'Tipo'], ['local', 'Local'], ['desc', 'O que aconteceu'], ['prov', 'Providências'], ['por', 'Registrado por'], ['st', 'Situação', (v) => pill(v === 'Resolvido' ? 'ok' : 'warn', v)]],
    busca: ['tipo', 'local', 'desc'], filtros: [{ n: 'st', l: 'Situação', op: ['Aberto', 'Resolvido'] }, { n: 'tipo', l: 'Tipo', op: ['Pessoa estranha / invasão', 'Dano ao patrimônio', 'Furto ou perda', 'Briga / tumulto', 'Veículo / trânsito', 'Problema elétrico / hidráulico', 'Outro'] }],
    acoes: [{ k: 'res', l: 'Resolver', se: (r) => r.st !== 'Resolvido', fn: (r) => ({ ...r, st: 'Resolvido' }) }], ordem: (a, b) => (b.data + (b.hora || '')).localeCompare(a.data + (a.hora || '')),
  });
  const EMERG = [['SAMU', '192'], ['Bombeiros', '193'], ['Polícia Militar', '190'], ['Defesa Civil', '199'], ['Disque Denúncia / Direitos Humanos', '100']];
  O.crud({
    key: 'contatos', t: 'Contatos úteis', i: 'phone', store: 'contatos', edit: true, novo: 'Novo contato',
    campos: [{ n: 'nome', l: 'Nome / órgão', req: 1 }, { n: 'tipo', l: 'Tipo', tipo: 'sel', op: ['Emergência', 'Saúde (UBS, hospital)', 'Conselho Tutelar', 'Diretoria de Ensino', 'Prefeitura / serviços', 'Fornecedor', 'Outro'] }, { n: 'tel', l: 'Telefone', req: 1 }, { n: 'obs', l: 'Observação' }],
    cols: [['nome', 'Nome'], ['tipo', 'Tipo'], ['tel', 'Telefone', (v) => `<a href="tel:${esc(String(v).replace(/\D/g, ''))}">${esc(v)}</a>`], ['obs', 'Obs.']], busca: ['nome', 'tipo', 'obs'], ordem: (a, b) => a.nome.localeCompare(b.nome),
    resumo: () => `<div class="card"><h2>Emergência</h2><div class="chip-grid">${EMERG.map(([n, t]) => `<a class="chip-btn bad" href="tel:${t}">${ic('phone')} ${n} · <b>${t}</b></a>`).join('')}</div></div>`,
  });
  const ESPACOS = ['Quadra', 'Laboratório de informática', 'Sala de leitura / biblioteca', 'Auditório / pátio coberto', 'Sala de vídeo', 'Refeitório', 'Outro espaço'];
  O.crud({
    key: 'reservas', t: 'Reserva de espaços', i: 'building', store: 'goe_reserva', edit: true, csv: true, novo: 'Reservar espaço',
    intro: 'Quadra, laboratório, biblioteca e outros espaços. O sistema avisa se o horário já estiver ocupado.',
    campos: [{ n: 'espaco', l: 'Espaço', tipo: 'sel', op: ESPACOS }, { n: 'data', l: 'Data', tipo: 'date', def: 'hoje', req: 1 }, { n: 'ini', l: 'Início', tipo: 'time', def: '08:00', req: 1 }, { n: 'fim', l: 'Fim', tipo: 'time', def: '09:00', req: 1 }, { n: 'resp', l: 'Responsável / turma', req: 1 }, { n: 'fin', l: 'Finalidade', larg: 1 }],
    cols: [['data', 'Quando', (v, r) => `${dt(v)}<br><small>${esc(r.ini)}–${esc(r.fim)}</small>`], ['espaco', 'Espaço'], ['resp', 'Responsável'], ['fin', 'Finalidade'], ['st', 'Situação', (v) => pill(v === 'Recusada' ? 'bad' : v === 'Aprovada' ? 'ok' : 'warn', v || 'Pendente')]],
    busca: ['espaco', 'resp', 'fin'], filtros: [{ n: 'espaco', l: 'Espaço', op: ESPACOS }, { n: 'st', l: 'Situação', op: ['Pendente', 'Aprovada', 'Recusada'] }], periodo: 'data', periodoDef: 'todos', ordem: (a, b) => (a.data + a.ini).localeCompare(b.data + b.ini),
    valida: (r, outras) => { if (O.minDe(r.fim) <= O.minDe(r.ini)) return 'O fim precisa ser depois do início.'; const c = outras.find((x) => x.espaco === r.espaco && x.data === r.data && x.st !== 'Recusada' && O.minDe(r.ini) < O.minDe(x.fim) && O.minDe(x.ini) < O.minDe(r.fim)); return c ? `Conflito: ${r.espaco} já está reservado ${c.ini}–${c.fim} (${c.resp}).` : null; },
    pre: (r, v) => ({ ...r, st: (v && v.st) || (me().ehGestao || me().grupo === 'goe' ? 'Aprovada' : 'Pendente') }),
    acoes: [{ k: 'ap', l: 'Aprovar', se: (r) => r.st === 'Pendente' && (me().ehGestao || me().grupo === 'goe'), fn: (r) => ({ ...r, st: 'Aprovada' }) }, { k: 'rec', l: 'Recusar', se: (r) => r.st === 'Pendente' && (me().ehGestao || me().grupo === 'goe'), fn: (r) => ({ ...r, st: 'Recusada' }) }],
  });
  O.crud({
    key: 'prazos', t: 'Prazos e calendário administrativo', n: 'Prazos', i: 'clock', store: 'prazos', edit: true, novo: 'Novo prazo',
    intro: 'Fechamento de bimestre, prazos da Diretoria de Ensino/SED, prestação de contas, censo escolar… tudo com contagem de dias.',
    campos: [{ n: 'titulo', l: 'O que precisa ser feito', req: 1 }, { n: 'data', l: 'Data limite', tipo: 'date', req: 1 }, { n: 'tipo', l: 'Origem', tipo: 'sel', op: ['SED / Secretaria da Educação', 'Diretoria de Ensino', 'Prefeitura / outro órgão', 'Interno da escola'] }, { n: 'resp', l: 'Responsável' }, { n: 'st', l: 'Situação', tipo: 'sel', op: ['Pendente', 'Feito'] }],
    cols: [['data', 'Data', (v, r) => { const d = Math.round((new Date(v + 'T12:00') - new Date(hoje() + 'T12:00')) / 864e5); return `${dt(v)}<br>${r.st === 'Feito' ? pill('ok', 'Feito') : pill(d < 0 ? 'bad' : d <= 3 ? 'warn' : '', d < 0 ? `${-d} dia(s) atrasado` : d === 0 ? 'é hoje' : `faltam ${d} dia(s)`)}`; }], ['titulo', 'Prazo'], ['tipo', 'Origem'], ['resp', 'Responsável']],
    busca: ['titulo', 'tipo', 'resp'], filtros: [{ n: 'st', l: 'Situação', op: ['Pendente', 'Feito'] }], ordem: (a, b) => (a.st === 'Feito') - (b.st === 'Feito') || a.data.localeCompare(b.data),
    acoes: [{ k: 'f', l: 'Feito', se: (r) => r.st !== 'Feito', fn: (r) => ({ ...r, st: 'Feito' }) }],
  });
})();
