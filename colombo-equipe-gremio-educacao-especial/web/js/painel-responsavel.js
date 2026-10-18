/* Painel do responsável · protótipo (sessão do core.js + localStorage, mesmo padrão dos outros painéis).
   Dados do responsável: colombo.responsavel.<id>.*  |  compartilhados com professores e gestão: colombo.doc.*.v1 */
(() => {
  'use strict';
  const sess = Colombo.session.get();
  if (!sess || sess.role !== 'responsavel') { location.replace('responsavel.html'); return; }
  const { ld, sv, esc, fdt, id, turmaKey, turmaNome, now } = DOC;
  const UID = String(sess.who);
  const K = (n) => `colombo.responsavel.${UID}.${n}`;
  const load = (n, f) => { try { return JSON.parse(localStorage.getItem(K(n))) ?? f; } catch { return f; } };
  const save = (n, v) => { try { localStorage.setItem(K(n), JSON.stringify(v)); return true; } catch { return false; } };
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const hoje = () => new Date().toISOString().slice(0, 10);
  const dt = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR');
  const fmt = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',');
  const pill = (st, t) => `<span class="pill ${st}">${esc(t)}</span>`;
  const toast = (m) => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 2600); };
  const IC = { home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', cal: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>', alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v5M12 18h.01"/>', chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/>', heart: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>', id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M14 10h4M14 14h4"/>', chart: '<path d="M4 20V10M10 20V4M16 20v-8M21 20H3"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>', send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>' };
  const ic = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;

  const ALUNO = () => { const ra = load('filho', ''); return ra ? TURMAS.porRA(ra) : null; };
  const nomeResp = () => load('perfil', {}).nome || 'Responsável';
  const foto = () => load('foto', '') || DOC.avatarPadrao(nomeResp());
  const pintar = () => { $('#avatarTop').src = foto(); const b = $('#avatarBig'); if (b) b.src = foto(); $('#whoName').textContent = nomeResp(); };
  const fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.hidden = true; document.body.append(fi);
  fi.onchange = () => { DOC.fotoRedim(fi.files[0], (u) => { save('foto', u) ? (pintar(), toast('Foto atualizada!')) : toast('Não foi possível guardar a foto.'); }, toast); fi.value = ''; };

  const V = {}, TIT = { inicio: 'Início', faltas: 'Faltas', ocorrencias: 'Ocorrências', agenda: 'Agenda da escola', chat: 'Chat', reuniao: 'Reunião com a gestão', feedback: 'Feedback dos professores', perfil: 'Meu perfil' };

  /* ---------- vincular o aluno (primeiro acesso) e perfil ---------- */
  V.perfil = () => {
    const a = ALUNO(), p = load('perfil', {});
    return `<div class="card"><h2>Foto de perfil</h2><div class="profile-pic"><img class="avatar" id="avatarBig" src="${esc(foto())}" alt="Sua foto"><div class="row-btns"><button class="btn" data-foto>Alterar foto</button>${load('foto', '') ? '<button class="btn ghost" data-foto-rm>Remover</button>' : ''}</div></div></div>
    <form class="card form" style="max-width:none" data-form="perfil"><h2>${a ? 'Meus dados' : 'Primeiro acesso: vincule o aluno'}</h2>
      <label>Seu nome completo<input name="nome" required maxlength="80" value="${esc(p.nome || '')}"></label>
      <div class="fields"><label>RA do aluno<input name="ra" required inputmode="numeric" maxlength="13" value="${esc(a ? a.ra : '')}" ${a ? 'readonly' : ''}></label><label>Matrícula do aluno<input name="mat" required inputmode="numeric" maxlength="12" ${a ? 'placeholder="já confirmada"' : ''} ${a ? '' : ''}></label></div>
      <p class="muted">${a ? `Aluno vinculado: ${esc(a.nome)} · ${esc(TURMAS.rotulo(a))}.` : 'O RA e a matrícula estão no boletim ou com a secretaria. Você só vê os dados do aluno vinculado.'}</p>
      <button class="btn" style="justify-self:start">Salvar</button></form>`;
  };

  V.inicio = () => {
    const a = ALUNO(), fr = freq(), ocs = GVIS.ocorr(a.ra), fb = ld('fb', []).filter((f) => f.ra === a.ra);
    const tile = (v, i, t, s) => `<button class="tile" data-go="${v}"><span class="ti">${ic(i)}</span><span>${t}<small>${s}</small></span></button>`;
    return `<section class="card hero"><div><span class="eyebrow">Responsável por</span><h2>${esc(a.nome)}</h2><p>${esc(TURMAS.rotulo(a))} · E.E. Colombo de Almeida</p></div></section>
    ${GVIS.faixa(a.ra, 'resp')}<div class="tiles">${tile('faltas', 'chart', 'Faltas', 'Frequência')}${tile('ocorrencias', 'alert', 'Ocorrências', 'Registros')}${tile('agenda', 'cal', 'Agenda', 'Escola e turma')}${tile('chat', 'chat', 'Chat', 'Professores e gestão')}${tile('reuniao', 'clock', 'Reunião', 'Marcar com a gestão')}${tile('feedback', 'heart', 'Feedback', 'Dos professores')}</div>
    <div class="grid"><div class="card"><h3>Frequência</h3><div class="big">${fmt(fr.pct)}%</div><p class="muted">${fr.faltas} faltas em ${fr.aulas} aulas</p></div><div class="card"><h3>Ocorrências</h3><div class="big">${ocs.length}</div></div><div class="card"><h3>Feedbacks</h3><div class="big">${fb.length}</div></div></div>`;
  };

  function freq() {
    const a = ALUNO(), f = DOC.freqDe(a, TURMAS.boletim(a).freq); let au = 0, fa = 0;
    Object.values(f).forEach(([x, y]) => { au += x; fa += y; });
    return { f, aulas: au, faltas: fa, pct: au ? ((au - fa) / au) * 100 : 100 };
  }
  V.faltas = () => { const x = freq(); const cd = ld('cham', []).filter((c) => c.turma === turmaKey(ALUNO())).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 10).map((c) => [c.data, c.ausentes.includes(ALUNO().ra), (c.atrasos || []).includes(ALUNO().ra)]).filter((r) => r[1] || r[2]); const chd = `<div class="card"><h2>Faltas e atrasos registrados pela escola</h2>${cd.length ? `<ul class="list">${cd.map(([d, f, a]) => `<li><span>${dt(d)}</span>${f ? pill(ld('justif', []).some((j) => j.ra === ALUNO().ra && j.st !== 'Indeferida' && j.de <= d && d <= j.ate) ? 'ok' : 'bad', ld('justif', []).some((j) => j.ra === ALUNO().ra && j.st !== 'Indeferida' && j.de <= d && d <= j.ate) ? 'Falta justificada' : 'Falta') : pill('warn', 'Atraso')}</li>`).join('')}</ul>` : '<p class="muted">Nenhuma falta ou atraso nos últimos registros.</p>'}</div>`; return chd + `<div class="card"><h2>Frequência geral</h2><div class="big">${fmt(x.pct)}%</div><p>${pill(x.pct >= 75 ? 'ok' : 'bad', x.pct >= 75 ? 'Frequência suficiente' : 'Abaixo de 75%')} <span class="muted">${x.faltas} faltas em ${x.aulas} aulas. O mínimo é 75%.</span></p></div>
    <div class="card tscroll"><table><thead><tr><th>Disciplina</th><th>Aulas</th><th>Faltas</th><th>Frequência</th></tr></thead><tbody>${Object.entries(x.f).map(([d, [au, fa]]) => { const p = au ? ((au - fa) / au) * 100 : 100; return `<tr><td>${esc(d)}</td><td>${au}</td><td>${fa}</td><td>${pill(p >= 75 ? 'ok' : 'bad', fmt(p) + '%')}</td></tr>`; }).join('')}</tbody></table></div>`; };

  V.ocorrencias = () => { const a = ALUNO(), g = GVIS.lista(a.ra, 'resp'), l = g.ocorr;
    return `${g.html}<div class="card"><h2>Ocorrências e registros</h2>${l.length ? `<ul class="list">${l.map((o) => `<li><span><b>${esc(o.tipo)}</b> — ${esc(o.obs)}<br><small class="muted">${esc(o.prof || '')}</small></span><span class="pill">${dt(o.data)}</span></li>`).join('')}</ul>` : '<p class="muted">Nada registrado. 👏</p>'}</div>`; };
  V.agenda = () => { const a = ALUNO(), ev = ld('cal', []).map((e) => ({ t: e.titulo, d: e.data, o: 'Escola' })).concat(ld('ativ', []).filter((x) => x.turma === turmaKey(a)).map((x) => ({ t: `${x.tipo}: ${x.titulo}`, d: x.data, o: x.prof || 'Professor' }))).filter((e) => e.d >= hoje()).sort((x, y) => x.d.localeCompare(y.d)), av = ld('avisos', []);
    return `<div class="card"><h2>Próximos eventos</h2>${ev.length ? `<ul class="list">${ev.map((e) => `<li><span>${esc(e.t)}<br><small class="muted">${esc(e.o)}</small></span><span class="pill">${dt(e.d)}</span></li>`).join('')}</ul>` : '<p class="muted">Nada marcado.</p>'}</div>
    <div class="card"><h2>Avisos da escola</h2>${av.length ? `<ul class="list">${av.map((x) => `<li><span><b>${esc(x.t)}</b><br>${esc(x.m)}</span><small>${fdt(x.ts)}</small></li>`).join('')}</ul>` : '<p class="muted">Nenhum aviso.</p>'}</div>`; };

  /* ---------- chat com professores e gestão ---------- */
  let cSel = 'coord';
  function contatos() { // professores que dão aula na turma do aluno (lidos das grades salvas) + gestão
    const t = turmaKey(ALUNO()), out = [['coord', 'Gestão da escola', 'Direção e coordenação'], ['secretaria', 'Secretaria', 'Documentos, declarações e matrícula']];
    for (let i = 0; i < localStorage.length; i++) {
      const m = /^colombo\.professor\.(.+)\.grade$/.exec(localStorage.key(i) || ''); if (!m) continue;
      let g; try { g = JSON.parse(localStorage.getItem(localStorage.key(i))) || []; } catch { continue; }
      const ds = [...new Set(g.filter((x) => x.turma === t).map((x) => x.disc))]; if (ds.length) out.push(['prof:' + m[1], (DOC.reg()[m[1]] || {}).nome || '@' + m[1], ds.join(', ')]);
    }
    return out;
  }
  V.chat = () => { const cs = contatos(); if (!cs.some((c) => c[0] === cSel)) cSel = 'coord';
    const a = ALUNO(), conv = `${UID}|${a.ra}|${cSel}`, ms = ld('pchat', []).filter((m) => m.conv === conv).sort((x, y) => x.ts - y.ts), c = cs.find((x) => x[0] === cSel);
    return `<div class="row2"><div class="card"><h2>Contatos</h2><div class="pg">${cs.map((x) => `<button class="btn ghost${x[0] === cSel ? ' on' : ''}" data-contato="${esc(x[0])}"><b>${esc(x[1])}</b><br><small>${esc(x[2])}</small></button>`).join('')}</div></div>
    <div class="card"><h2>${esc(c[1])}</h2><div class="msgs" style="max-height:340px">${ms.map((m) => `<div class="msg${m.de === 'resp' ? ' me' : ''}">${esc(m.t)}<time>${fdt(m.ts)}</time></div>`).join('') || '<p class="muted">Nenhuma mensagem ainda. Escreva abaixo.</p>'}</div>
    <form class="composer" data-form="chat"><input name="t" required maxlength="500" placeholder="Escreva uma mensagem…" aria-label="Mensagem" autocomplete="off"><button class="send" aria-label="Enviar">${ic('send')}</button></form></div></div>`; };

  /* ---------- reunião com a gestão ---------- */
  V.reuniao = () => { const l = ld('reunioes', []).filter((r) => r.uid === UID).sort((a, b) => b.ts - a.ts); const st = { pedida: ['warn', 'Aguardando a gestão'], confirmada: ['ok', 'Confirmada'], recusada: ['bad', 'Não pôde ser neste horário'] };
    return `<form class="card form" style="max-width:none" data-form="reuniao"><h2>Marcar reunião com a gestão</h2><div class="fields"><label>Data preferida<input type="date" name="data" required min="${hoje()}"></label><label>Período<select name="periodo"><option>Manhã</option><option>Tarde</option></select></label></div><label>Assunto<textarea name="assunto" rows="3" required maxlength="500"></textarea></label><button class="btn" style="justify-self:start">Solicitar reunião</button></form>
    <div class="card"><h2>Minhas solicitações</h2>${l.length ? `<ul class="list">${l.map((r) => `<li><span><b>${dt(r.data)} · ${esc(r.periodo)}</b><br>${esc(r.assunto)}${r.obs ? `<br><small class="muted">Gestão: ${esc(r.obs)}</small>` : ''}</span>${pill(...st[r.st])}</li>`).join('')}</ul>` : '<p class="muted">Nenhuma solicitação.</p>'}</div>`; };

  V.feedback = () => { const cu = ld('cui_reg', []).filter((r) => r.ra === ALUNO().ra && r.share !== false).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5); const cuH = cu.length ? `<div class="card"><h2>Recados do acompanhamento diário</h2><ul class="list">${cu.map((r) => `<li><span><b>${dt(r.data)}</b> · ${esc(r.humor || '')} · ${esc(r.lanche || '')}<br><small class="muted">${esc(r.obs || '')}</small></span></li>`).join('')}</ul></div>` : ''; const l = ld('fb', []).filter((f) => f.ra === ALUNO().ra).sort((a, b) => b.ts - a.ts);
    return cuH + `<div class="card"><h2>Feedback dos professores</h2>${l.length ? `<ul class="list">${l.map((f) => `<li><span><b>${esc(f.tipo)}</b> · ${esc(f.disc)} · ${esc(f.profNome || '')}<br>${esc(f.t)}</span><small>${fdt(f.ts)}</small></li>`).join('')}</ul>` : '<p class="muted">Ainda não há feedback.</p>'}</div>`; };

  /* ---------- núcleo ---------- */
  const NAV = [['inicio', 'home', 'Início'], ['faltas', 'chart', 'Faltas'], ['ocorrencias', 'alert', 'Ocorrências'], ['agenda', 'cal', 'Agenda da escola'], ['chat', 'chat', 'Chat'], ['reuniao', 'clock', 'Reunião com a gestão'], ['feedback', 'heart', 'Feedback dos professores'], ['perfil', 'id', 'Meu perfil']];
  const montar = () => { $('#nav').innerHTML = ALUNO() ? NAV.map(([v, i, l]) => `<button data-view="${v}">${ic(i)}<span>${l}</span></button>`).join('') : ''; pintar(); };
  let cur = 'inicio';
  function go(v) { if (!ALUNO()) v = 'perfil'; cur = v; $('#title').textContent = TIT[v]; $$('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.view === v)); $('#content').innerHTML = V[v](); $('#side').classList.remove('open'); window.scrollTo(0, 0); const m = $('.msgs'); if (m) m.scrollTop = m.scrollHeight; $('#title').focus({ preventScroll: true }); }
  document.addEventListener('click', (e) => { const t = e.target.closest('button'); if (!t) return; const D = t.dataset;
    if (D.foto !== undefined) return fi.click();
    if (D.fotoRm !== undefined) { try { localStorage.removeItem(K('foto')); } catch { /* ignora */ } pintar(); toast('Foto removida.'); return go('perfil'); }
    if (D.contato) { cSel = D.contato; return go('chat'); }
    if (D.view || D.go) return go(D.view || D.go); });
  document.addEventListener('submit', (e) => { const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault(); const d = Object.fromEntries(new FormData(f)), ts = now();
    switch (f.dataset.form) {
      case 'perfil': { const nome = d.nome.replace(/\s+/g, ' ').trim(); if (nome.split(' ').length < 2) return toast('Digite nome e sobrenome.');
        if (!ALUNO()) { const ra = d.ra.replace(/\D/g, ''), erro = TURMAS.validaRA(ra) || TURMAS.validaPar(ra, d.mat); if (erro) return toast(erro); save('filho', ra); }
        save('perfil', { nome }); montar(); toast('Dados salvos!'); return go('inicio'); }
      case 'chat': { const a = ALUNO(); sv('pchat', [...ld('pchat', []), { id: id(), conv: `${UID}|${a.ra}|${cSel}`, para: cSel, resp: UID, nomeResp: nomeResp(), ra: a.ra, de: 'resp', t: d.t, ts }]); return go('chat'); }
      case 'reuniao': sv('reunioes', [...ld('reunioes', []), { id: id(), uid: UID, nomeResp: nomeResp(), ra: ALUNO().ra, ...d, st: 'pedida', ts }]); toast('Reunião solicitada. A gestão vai responder aqui.'); return go('reuniao'); } });
  window.addEventListener('storage', () => { if (cur !== 'perfil' && !document.activeElement.closest('form')) go(cur); });
  $('#burger').innerHTML = '<svg class="ic" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'; $('#burger').onclick = () => $('#side').classList.toggle('open'); $('#scrim').onclick = () => $('#side').classList.remove('open');
  $('#logout').innerHTML = `${ic('logout')} Sair da conta`; $('#logout').onclick = () => { Colombo.session.end(); location.href = 'responsavel.html'; };
  montar(); go('inicio');
})();
