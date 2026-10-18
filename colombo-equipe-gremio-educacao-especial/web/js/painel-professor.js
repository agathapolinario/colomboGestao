/* Painel do professor · protótipo (mesmo padrão do painel do aluno: sessão do core.js + localStorage).
   Dados pessoais do professor: colombo.professor.<login>.*  |  dados compartilhados: colombo.doc.*.v1 (docencia.js) */
(() => {
  'use strict';
  const sess = Colombo.session.get();
  if (!sess || sess.role !== 'professor') { location.replace('professor.html'); return; }
  const { ld, sv, esc, fdt, id, CURSOS, ESPECIAIS, RECURSOS, reg, setReg, paetDe, turmaKey, turmaNome, alunosDa, turmasTodas, DIAS, now } = DOC;
  const LOGIN = String(sess.who).replace(/^@/, '');
  const K = (n) => `colombo.professor.${LOGIN}.${n}`;
  const load = (n, f) => { try { return JSON.parse(localStorage.getItem(K(n))) ?? f; } catch { return f; } };
  const save = (n, v) => { try { localStorage.setItem(K(n), JSON.stringify(v)); return true; } catch { return false; } };
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const me = () => reg()[LOGIN] || null;
  const aut = (k) => !!(me() && me().aut && me().aut[k]);
  const pedido = (k) => !!(me() && me().pedido && me().pedido[k]);
  const foto = () => load('foto', '') || DOC.avatarPadrao((me() || {}).nome);
  const pintarFoto = () => { $('#avatarTop').src = foto(); const b = $('#avatarBig'); if (b) b.src = foto(); };
  const fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.hidden = true; fi.id = 'fotoInput'; document.body.append(fi);
  fi.onchange = () => { DOC.fotoRedim(fi.files[0], (u) => { save('foto', u) ? (pintarFoto(), toast('Foto atualizada!')) : toast('Não foi possível guardar a foto.'); }, toast); fi.value = ''; };
  const hoje = () => new Date().toISOString().slice(0, 10);
  const dt = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR');
  const diaDe = (iso) => ['Domingo', ...DIAS, 'Sábado'][new Date(iso + 'T12:00:00').getDay()];
  const CORES = ['#2563eb', '#7c3aed', '#059669', '#db2777', '#ea580c', '#0891b2', '#4f46e5', '#16a34a', '#d97706', '#0d9488'];
  const corDe = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return CORES[h % CORES.length]; };
  const pill = (st, t) => `<span class="pill ${st}">${esc(t)}</span>`;
  const toast = (m) => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 2600); speak(m, true); };
  function speak(t, soAviso) { // leitor de tela opcional: anuncia avisos (região aria-live) e fala em voz alta
    $('#live').textContent = ''; setTimeout(() => { $('#live').textContent = t; }, 50);
    if (soAviso && ACESS.includes('leitor')) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'pt-BR'; speechSynthesis.speak(u); } catch { /* ignora */ } }
  }
  const IC = { home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', cal: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>', book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>', pen: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>', alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v5M12 18h.01"/>', chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/>', bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4"/>', folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', school: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>', swap: '<path d="M7 7h13l-3-3M17 17H4l3 3"/>', shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>', heart: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>', id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M14 10h4M14 14h4"/>', cog: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>', logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>', send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', check: '<path d="m5 12 5 5 9-10"/>' };
  const ic = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;

  /* ---------- acessibilidade (opcional, escolhida pelo professor) ---------- */
  let ACESS = load('acess', []);
  function aplicarAcess() {
    RECURSOS.forEach(([k]) => document.body.classList.toggle('a-' + k, ACESS.includes(k)));
    if (ACESS.includes('libras') && !$('#vlibras')) { // widget oficial do governo; só carrega se o professor optar
      const w = document.createElement('div'); w.id = 'vlibras'; w.setAttribute('vw', ''); w.className = 'enabled';
      w.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
      document.body.append(w);
      const s = document.createElement('script'); s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
      s.onload = () => { try { new window.VLibras.Widget('https://vlibras.gov.br/app'); } catch { /* sem internet */ } }; s.onerror = () => toast('Libras precisa de internet para carregar.');
      document.body.append(s);
    }
    if (!ACESS.includes('libras') && $('#vlibras')) $('#vlibras').style.display = 'none'; else if ($('#vlibras')) $('#vlibras').style.display = '';
  }

  /* ---------- peças de formulário ---------- */
  const fld = (n, l, t = 'txt', o = [], v = '') => {
    if (t === 'sel') return `<label>${l}<select name="${n}">${o.map((x) => { const [a, b] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(a)}"${a === v ? ' selected' : ''}>${esc(b)}</option>`; }).join('')}</select></label>`;
    if (t === 'area') return `<label>${l}<textarea name="${n}" rows="3" maxlength="800">${esc(v)}</textarea></label>`;
    return `<label>${l}<input name="${n}" type="${t === 'date' ? 'date' : 'text'}" value="${esc(v)}" maxlength="120"${t === 'req' || t === 'date' ? ' required' : ''}></label>`;
  };
  const minhasTurmas = () => [...new Set(load('grade', []).map((g) => g.turma).concat(subsMinhas().map((s) => s.turma)))];
  const optTurmas = (ks) => ks.map((k) => [k, turmaNome(k)]);
  const DISCS = [...new Set(window.TURMAS.turmas.flatMap((t) => window.TURMAS.disciplinas(alunosDa(turmaKey(t))[0] || t)))];
  const subs = () => ld('subs', []);
  const subsMinhas = () => subs().filter((s) => s.escolhido === LOGIN);

  /* ---------- listas genéricas (salvas por professor) ---------- */
  const G = {
    atividades: { t: 'Atividades, revisões e avaliações', f: () => [['tipo', 'Tipo', 'sel', ['Atividade', 'Revisão', 'Avaliação', 'Entrega']], ['turma', 'Turma', 'sel', optTurmas(minhasTurmas())], ['titulo', 'Título', 'req'], ['data', 'Data', 'date'], ['obs', 'Observações', 'area']], linha: (x) => `<b>${esc(x.tipo)}</b> · ${esc(turmaNome(x.turma))} — ${esc(x.titulo)}`, data: 'data', precisaTurma: true },
    ocorrencias: { t: 'Ocorrências dos alunos', f: () => [['aluno', 'Aluno', 'sel', minhasTurmas().flatMap((k) => alunosDa(k).map((a) => [a.ra, `${a.nome} · ${turmaNome(k)}`]))], ['tipo', 'Tipo', 'sel', ['Ocorrência', 'Advertência', 'Elogio', 'Comunicado à família']], ['data', 'Data', 'date', [], hoje()], ['obs', 'O que aconteceu', 'area']], linha: (x) => { const a = window.TURMAS.porRA(x.aluno); return `<b>${esc(x.tipo)}</b> · ${esc(a ? a.nome : x.aluno)} — ${esc(x.obs)}`; }, data: 'data', precisaTurma: true, sigilo: true },
    tarefas: { t: 'Documentos e tarefas pendentes', f: () => [['tipo', 'Tipo', 'sel', ['Tarefa', 'Documento', 'Prazo da coordenação']], ['titulo', 'Descrição', 'req'], ['data', 'Prazo', 'date']], linha: (x) => `<b>${esc(x.tipo)}</b> — ${esc(x.titulo)}`, data: 'data' },
    eventos: { t: 'Meus eventos', f: () => [['titulo', 'Evento', 'req'], ['data', 'Data', 'date']], linha: (x) => esc(x.titulo), data: 'data' },
  };
  function lista(k, so) {
    const g = G[k], items = load(k, []).sort((a, b) => (a.data || '').localeCompare(b.data || ''));
    if (g.precisaTurma && !minhasTurmas().length) return `<div class="card"><h2>${g.t}</h2><p class="muted">Cadastre suas aulas em <b>Agenda e horários</b> para liberar suas turmas.</p><button class="btn" data-go="agenda">Abrir agenda</button></div>`;
    return `${so ? '' : `<form class="card form" style="max-width:none" data-form="g:${k}"><h2>${g.t}</h2>${g.sigilo ? '<p class="muted">Registro sigiloso: só você e a coordenação devem ter acesso.</p>' : ''}<div class="fields">${g.f().map((f) => fld(...f)).join('')}</div><button class="btn" style="justify-self:start">Salvar</button></form>`}
      <div class="card"><h2>Registrados</h2>${items.length ? `<ul class="list">${items.map((x) => `<li class="${x.feito ? 'done' : ''}"><span>${g.linha(x)}${x.obs ? `<br><small class="muted">${esc(x.obs)}</small>` : ''}</span><span>${x.data ? `<span class="pill">${dt(x.data)}</span> ` : ''}<button class="btn ghost sm" data-fe="${k}|${x.id}">${x.feito ? 'Reabrir' : 'Concluir'}</button> <button class="btn ghost sm" data-del="${k}|${x.id}" aria-label="Apagar">${ic('check').replace('m5 12 5 5 9-10', 'M5 5l14 14M19 5 5 19')}</button></span></li>`).join('')}</ul>` : '<p class="muted">Nada registrado ainda.</p>'}</div>`;
  }

  const V = {}, TIT = {};
  const nome1 = () => ((me() || {}).nome || '').split(' ')[0] || 'professor(a)';

  /* ---------- perfil / primeiro acesso ---------- */
  V.perfil = () => {
    const r = me() || {}, first = !r.nome, p = Colombo.auth.profile('professor', [LOGIN]) || {}, ac = r.acess || {};
    const fn = (k) => (r.pedido || {})[k], cur = r.curso || 'base';
    return `<div class="card"><h2>Foto de perfil</h2><div class="profile-pic"><img class="avatar" id="avatarBig" src="${esc(foto())}" alt="Sua foto"><div class="row-btns"><button class="btn" data-foto>Alterar foto</button>${load('foto', '') ? '<button class="btn ghost" data-foto-rm>Remover</button>' : ''}</div></div></div>
    <form class="card form" style="max-width:none" data-form="perfil"><h2>${first ? 'Primeiro acesso: conte um pouco sobre você' : 'Meu perfil'}</h2>
      <p class="muted">${first ? 'Preencha uma vez. Você pode editar depois em Meu perfil.' : 'Atualize quando precisar.'}</p>
      ${fld('nome', 'Nome completo', 'req', [], r.nome || p.nome || '')}
      <fieldset class="card"><legend><b>Função</b></legend><label class="chk"><input type="checkbox" checked disabled> Professor(a): estas funções todos os professores têm</label>
      ${Object.entries(ESPECIAIS).map(([k, l]) => `<label class="chk"><input type="checkbox" name="fn_${k}" ${fn(k) ? 'checked' : ''}> ${l} ${(r.aut || {})[k] ? pill('ok', 'autorizado') : fn(k) ? pill('warn', 'aguardando a coordenação') : ''}</label>`).join('')}
      <p class="muted">As funções especiais só valem depois que a coordenação autorizar. Até lá você usa as funções comuns.</p></fieldset>
      ${fld('curso', 'Curso ao qual pertence', 'sel', Object.entries(CURSOS), cur)}
      <fieldset class="card"><legend><b>Acessibilidade (opcional)</b></legend><label class="chk"><input type="checkbox" name="usa" ${ac.usa ? 'checked' : ''}> Quero informar uma necessidade de acessibilidade</label>
      ${fld('necessidade', 'Se quiser, descreva (não precisa de diagnóstico)', 'area', [], ac.necessidade || '')}
      <p class="muted">Recursos que prefiro usar:</p>${RECURSOS.map(([k, l]) => `<label class="chk"><input type="checkbox" name="rc_${k}" ${ACESS.includes(k) ? 'checked' : ''}> ${l}</label>`).join('')}</fieldset>
      <button class="btn" style="justify-self:start">${first ? 'Salvar e entrar' : 'Salvar perfil'}</button></form>`;
  };
  TIT.perfil = 'Meu perfil';
  function salvarPerfil(d) {
    const nome = String(d.nome || '').replace(/\s+/g, ' ').trim();
    if (nome.split(' ').length < 2) return toast('Digite nome e sobrenome.');
    const pedido = {}; Object.keys(ESPECIAIS).forEach((k) => { if (d['fn_' + k]) pedido[k] = true; });
    if (pedido.paet && d.curso === 'base') return toast('PAET precisa de um curso técnico.');
    ACESS = RECURSOS.map(([k]) => k).filter((k) => d['rc_' + k]); save('acess', ACESS);
    setReg(LOGIN, (r) => { const a = { ...(r.aut || {}) }; Object.keys(ESPECIAIS).forEach((k) => { if (!pedido[k]) delete a[k]; });
      if (a.paet && r.curso !== d.curso) delete a.paet; // mudou de curso: a coordenação precisa autorizar de novo
      return { ...r, login: LOGIN, nome, curso: d.curso, pedido, aut: a, acess: { usa: !!d.usa, necessidade: d.necessidade || '', recursos: ACESS }, atualizado: now() }; });
    aplicarAcess(); montarMenu(); toast('Perfil salvo!'); go('inicio');
  }

  /* ---------- agenda e horários ---------- */
  V.agenda = () => {
    const grade = load('grade', []), sb = subsMinhas();
    const col = DIAS.map((d) => ({ d, a: grade.filter((g) => g.dia === d).map((g) => ({ ...g, sub: false })).concat(sb.filter((s) => diaDe(s.data) === d).map((s) => ({ id: s.id, hora: s.hora, turma: s.turma, disc: s.disc, sub: true, data: s.data }))).sort((x, y) => x.hora.localeCompare(y.hora)) }));
    return `<div class="week5">${col.map((c) => `<div class="card"><h3>${c.d}</h3>${c.a.map((g) => `<div class="aula" style="--c:${corDe(g.disc)}"><b>${esc(g.hora)}</b> · ${esc(g.disc)}<small>${esc(turmaNome(g.turma))}${g.sub ? ` · substituição ${dt(g.data)}` : ''}${g.sub ? '' : ` · <button class="btn ghost sm" data-del="grade|${g.id}">remover</button>`}</small></div>`).join('') || '<p class="muted">Sem aulas.</p>'}</div>`).join('')}</div>
    <form class="card form" style="max-width:none" data-form="grade"><h2>Adicionar aula ao meu horário</h2><div class="fields">${fld('dia', 'Dia', 'sel', DIAS)}${fld('hora', 'Horário (ex.: 13:00)', 'req')}${fld('turma', 'Turma', 'sel', optTurmas(turmasTodas()))}${fld('disc', 'Disciplina', 'sel', DISCS)}</div><button class="btn" style="justify-self:start">Adicionar</button></form>`;
  };
  TIT.agenda = 'Agenda e horários das aulas';

  /* ---------- diário de classe ---------- */
  let dTurma = '', dData = hoje(), dDisc = '';
  V.diario = () => {
    const ts = minhasTurmas(), grade = load('grade', []);
    if (!ts.length) return `<div class="card"><h2>Diário de classe</h2><p class="muted">Cadastre suas aulas em Agenda e horários para ver suas turmas.</p><button class="btn" data-go="agenda">Abrir agenda</button></div>`;
    if (!ts.includes(dTurma)) dTurma = ts[0];
    const ds = [...new Set(grade.filter((g) => g.turma === dTurma).map((g) => g.disc).concat(subsMinhas().filter((x) => x.turma === dTurma).map((x) => x.disc)))];
    if (!ds.includes(dDisc)) dDisc = ds[0];
    const di = load('diario', {}), reg1 = di[`${dTurma}|${dData}|${dDisc}`] || { conteudo: '', ausentes: [] }, al = alunosDa(dTurma);
    const mine = Object.entries(di).filter(([k]) => k.startsWith(dTurma + '|') && k.endsWith('|' + dDisc));
    const faltas = (ra) => mine.reduce((n, [, v]) => n + (v.ausentes.includes(ra) ? 1 : 0), 0);
    return `<div class="card"><h2>Turmas</h2><div class="row-btns">${ts.map((k) => `<button class="btn${k === dTurma ? '' : ' ghost'}" data-turma="${esc(k)}">${esc(turmaNome(k))}</button>`).join(' ')}</div></div>
    <form class="card form" style="max-width:none" data-form="diario"><h2>Aula de ${esc(turmaNome(dTurma))} · ${dt(dData)}</h2><div class="fields"><label>Data<input type="date" name="data" value="${dData}" data-datadiario></label><label>Disciplina<select data-discdiario>${ds.map((d) => `<option${d === dDisc ? ' selected' : ''}>${esc(d)}</option>`).join('')}</select></label></div>
      <label>Conteúdo da aula<textarea name="conteudo" rows="3" maxlength="600">${esc(reg1.conteudo)}</textarea></label>
      <div class="tscroll"><table><thead><tr><th>Aluno</th><th>Presente hoje</th><th>Faltas (${mine.length} aulas)</th></tr></thead><tbody>${al.map((a) => `<tr><td>${esc(a.nome)}${GVIS.ativa(a.ra) ? ' <span class="pill bad">suspenso</span>' : ''}</td><td><input type="checkbox" name="p_${a.ra}" ${reg1.ausentes.includes(a.ra) ? '' : 'checked'} aria-label="Presença de ${esc(a.nome)}"></td><td>${faltas(a.ra)}</td></tr>`).join('')}</tbody></table></div>
      <p class="muted">As faltas aparecem para o aluno e para os responsáveis.</p><button class="btn" style="justify-self:start">Salvar diário</button></form>`;
  };
  TIT.diario = 'Diário de classe, turmas e presença';

  /* ---------- pedidos e chamados à escola ---------- */
  const PCAT = [['manut', 'Manutenção e reparos', 'goe'], ['limpeza', 'Limpeza e higiene', 'limpeza'], ['material', 'Material e compras', 'goe'], ['ti', 'Tecnologia e informática', 'goe'], ['ped', 'Pedagógico', 'coordenacao'], ['eventos', 'Eventos e espaços', 'goe'], ['aee', 'Educação especial (AEE)', 'aee'], ['outros', 'Outros assuntos', 'direcao']];
  const PDIAS = { baixa: 15, normal: 7, alta: 3, urgente: 1 };
  const CHT = [['Sala suja / precisa de limpeza', 'limpeza'], ['Falta papel, sabonete ou material', 'limpeza'], ['Derramou algo / piso molhado', 'limpeza'], ['Carteira, porta ou janela quebrada', 'agente'], ['Preciso de chave ou equipamento', 'agente'], ['Aluno fora de sala / no corredor', 'agente'], ['Aluno precisa de acompanhamento', 'cuidadora'], ['Atendimento na sala de recursos', 'aee'], ['Pessoa estranha / segurança', 'seguranca'], ['Preciso de documento / secretaria', 'secretaria'], ['Precisa de ajuda da gestão', 'coordenacao']];
  const meuNome = () => `${(me() || {}).nome || LOGIN} (Professor(a))`;
  V.pedidos = () => {
    const meus = ld('org_ped', []).filter((p) => p.por === 'professor:' + LOGIN), chs = (() => { try { return JSON.parse(localStorage.getItem('colombo.chamados.v1')) || []; } catch { return []; } })().filter((c) => c.por === meuNome()).slice(0, 6);
    const ST = { aberto: ['warn', 'Aberto'], andamento: ['', 'Em andamento'], concluido: ['ok', 'Concluído'], recusado: ['bad', 'Recusado'], assumido: ['', 'Assumido'], feito: ['ok', 'Concluído'] };
    return `<form class="card form" style="max-width:none" data-form="chamesc"><h2>Chamado rápido (agora)</h2><p class="muted">Limpeza, agentes, segurança ou gestão recebem na hora.</p><div class="fields"><label>O que você precisa<select name="tipo">${CHT.map((t, i) => `<option value="${i}">${esc(t[0])}</option>`).join('')}</select></label><label>Sala<input name="sala" required maxlength="30" placeholder="Ex.: 2º B"></label></div><label>Detalhe (opcional)<input name="obs" maxlength="140"></label><label class="switch"><input type="checkbox" name="urg" value="1"><span>Urgente</span></label><button class="btn" style="justify-self:start">Enviar chamado</button></form>
    <form class="card form" style="max-width:none" data-form="pedesc"><h2>Pedido à escola</h2><p class="muted">Para o que não é urgente: manutenção, material, projetor, espaço… Você acompanha o andamento aqui.</p><div class="fields"><label>Assunto<input name="titulo" required maxlength="100"></label><label>Categoria<select name="cat">${PCAT.map((c) => `<option value="${c[0]}">${esc(c[1])}</option>`).join('')}</select></label><label>Prioridade<select name="prio"><option value="baixa">Baixa</option><option value="normal" selected>Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></label><label>Local<input name="local" maxlength="60"></label></div><label>Detalhes<textarea name="desc" rows="3" maxlength="600"></textarea></label><button class="btn" style="justify-self:start">Enviar pedido</button></form>
    <div class="card"><h2>Meus pedidos</h2>${meus.length ? `<ul class="list">${meus.map((p) => `<li><span><b>${esc(p.titulo)}</b><br><small class="muted">${esc(p.num)} · ${fdt(p.ts)}${p.atribNome ? ' · com ' + esc(p.atribNome) : ''}</small></span>${pill(...(ST[p.st] || ['', p.st]))}</li>`).join('')}</ul>` : '<p class="muted">Você ainda não fez pedidos.</p>'}</div>
    <div class="card"><h2>Meus chamados recentes</h2>${chs.length ? `<ul class="list">${chs.map((c) => `<li><span><b>${esc(c.tipo)}</b>${c.sala ? ' · ' + esc(c.sala) : ''}<br><small class="muted">${esc(c.at || '')}</small></span>${pill(...(ST[c.st || 'aberto'] || ['', c.st]))}</li>`).join('')}</ul>` : '<p class="muted">Nenhum chamado.</p>'}</div>`; };
  TIT.pedidos = 'Pedidos e chamados à escola';
  V.atividades = () => lista('atividades'); TIT.atividades = G.atividades.t;
  const gestaoSusp = () => { const ras = new Set(minhasTurmas().flatMap((k) => alunosDa(k).map((a) => a.ra))); return ld('susp', []).filter((x) => ras.has(x.ra) && !x.cancelada && ['curso', 'agendada'].includes(GVIS.status(x))); };
  const gestaoOc = () => { const ras = new Set(minhasTurmas().flatMap((k) => alunosDa(k).map((a) => a.ra))); return ld('ocorr', []).filter((o) => ras.has(o.aluno) && o.cargo && !o.interno).sort((a, b) => (b.data || '').localeCompare(a.data || '')).slice(0, 15); };
  V.ocorrencias = () => { const sp = gestaoSusp(), oc = gestaoOc(), nome = (ra) => (window.TURMAS.porRA(ra) || {}).nome || ra;
    const bloco = `${sp.length ? `<div class="card" style="border-color:var(--danger)"><h2>⚠️ Suspensões dos seus alunos</h2><ul class="list">${sp.map((x) => `<li><span><b>${esc(nome(x.ra))}</b> · ${esc(turmaNome(turmaKey(window.TURMAS.porRA(x.ra))))}<br><small class="muted">${dt(x.inicio)} a ${dt(x.fim)} · ${esc(x.motivo)}${x.atividades ? ' · atividades: ' + esc(x.atividades) : ''}</small></span>${pill(GVIS.status(x) === 'curso' ? 'bad' : 'warn', GVIS.status(x) === 'curso' ? 'Suspenso' : 'Agendada')}</li>`).join('')}</ul></div>` : ''}${oc.length ? `<div class="card"><h2>Registros da coordenação e direção</h2><ul class="list">${oc.map((o) => `<li><span><b>${esc(o.tipo)}</b> · ${esc(nome(o.aluno))}<br><small class="muted">${esc(o.obs || '')} · ${esc(o.cargoNome || '')}</small></span><span class="pill">${dt(o.data)}</span></li>`).join('')}</ul></div>` : ''}`;
    return bloco + lista('ocorrencias'); }; TIT.ocorrencias = G.ocorrencias.t;
  V.tarefas = () => lista('tarefas'); TIT.tarefas = G.tarefas.t;

  /* ---------- chat com alunos (lê as conversas que os alunos mandam à disciplina; respostas vão para colombo.doc.resp) ---------- */
  let cSel = '';
  function conversas() {
    const grade = load('grade', []), out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const m = /^colombo\.aluno\.(.+)\.chat$/.exec(localStorage.key(i) || ''); if (!m) continue;
      const a = window.TURMAS.porRA(m[1].replace(/\D/g, '')); if (!a) continue;
      let c; try { c = JSON.parse(localStorage.getItem(localStorage.key(i))) || {}; } catch { continue; }
      Object.entries(c).forEach(([disc, ms]) => { if (ms.length && grade.some((g) => g.turma === turmaKey(a) && g.disc === disc)) out[`${a.ra}|${disc}`] = { a, disc, ms: ms.map((x) => ({ t: x.t, ts: x.ts || 0, aluno: true })) }; });
    }
    ld('resp', []).filter((r) => r.de === LOGIN).forEach((r) => { const a = window.TURMAS.porRA(r.ra); if (!a) return; (out[`${r.ra}|${r.disc}`] ||= { a, disc: r.disc, ms: [] }).ms.push({ t: r.t, ts: r.ts }); });
    Object.values(out).forEach((c) => c.ms.sort((x, y) => x.ts - y.ts));
    return out;
  }
  V.chat = () => {
    const cv = conversas(), keys = Object.keys(cv).sort((a, b) => cv[b].ms.at(-1).ts - cv[a].ms.at(-1).ts);
    if (!cv[cSel]) cSel = keys[0] || '';
    const c = cv[cSel], al = minhasTurmas().flatMap((k) => alunosDa(k).map((a) => [a.ra, `${a.nome} · ${turmaNome(k)}`]));
    return `<div class="row2"><div class="card"><h2>Conversas</h2><div class="pg">${keys.map((k) => `<button class="btn ghost${k === cSel ? ' on' : ''}" data-conv="${esc(k)}"><b>${esc(cv[k].a.nome)}</b><br><small>${esc(cv[k].disc)} · ${esc(turmaNome(turmaKey(cv[k].a)))}${cv[k].ms.at(-1).aluno ? ' · 🔵 nova' : ''}</small></button>`).join('') || '<p class="muted">Nenhuma conversa ainda. Os alunos escrevem pelo Chat deles; você também pode começar uma.</p>'}</div></div>
      <div class="card">${c ? `<h2>${esc(c.a.nome)} · ${esc(c.disc)}</h2><div class="msgs" style="max-height:340px">${c.ms.map((m) => `<div class="msg${m.aluno ? '' : ' me'}">${esc(m.t)}<time>${m.ts ? fdt(m.ts) : ''}</time></div>`).join('')}</div>
      <form class="composer" data-form="resp"><input name="t" required maxlength="500" placeholder="Responder ao aluno…" aria-label="Mensagem" autocomplete="off"><button class="send" aria-label="Enviar">${ic('send')}</button></form>` : '<h2>Selecione uma conversa</h2>'}
      <form class="form" data-form="novaconv" style="margin-top:14px"><h3>Nova conversa</h3><div class="fields">${al.length ? fld('ra', 'Aluno', 'sel', al) : ''}${fld('disc', 'Disciplina', 'sel', [...new Set(load('grade', []).map((g) => g.disc))])}</div><label>Mensagem<input name="t" required maxlength="500"></label><button class="btn" style="justify-self:start" ${al.length ? '' : 'disabled'}>Iniciar</button></form></div></div>`;
  };
  TIT.chat = 'Chat com os alunos';

  /* ---------- comunicação interna (professores e coordenação) + solicitações ao PAET ---------- */
  V.interna = () => {
    const ms = ld('msgs', []).filter((m) => m.de === LOGIN || m.para === LOGIN || m.para === 'todos').sort((a, b) => b.ts - a.ts).slice(0, 40);
    const dest = [['coord', 'Coordenação'], ['todos', 'Todos os professores']].concat(Object.values(reg()).filter((r) => r.login !== LOGIN && r.nome).map((r) => [r.login, `${r.nome}`]));
    const nm = (l) => l === 'coord' ? 'Coordenação' : l === 'todos' ? 'Todos' : ((reg()[l] || {}).nome || '@' + l);
    const mine = ld('pend', []).filter((p) => p.de === LOGIN);
    return `<form class="card form" style="max-width:none" data-form="msg"><h2>Nova mensagem</h2><div class="fields">${fld('para', 'Para', 'sel', dest)}</div><label>Mensagem<textarea name="t" rows="3" required maxlength="800"></textarea></label><button class="btn" style="justify-self:start">${ic('send')} Enviar</button></form>
    <div class="card"><h2>Mensagens</h2>${ms.length ? `<ul class="list">${ms.map((m) => `<li><span><b>${m.de === LOGIN ? 'Você → ' + esc(nm(m.para)) : esc(m.de === 'coord' ? 'Coordenação' : m.nome) + (m.para === 'todos' ? ' (para todos)' : '')}</b><br>${esc(m.t)}</span><small>${fdt(m.ts)}</small></li>`).join('')}</ul>` : '<p class="muted">Nenhuma mensagem.</p>'}</div>
    <form class="card form" style="max-width:none" data-form="pend"><h2>Solicitar ao PAET do curso</h2><div class="fields">${fld('curso', 'Curso', 'sel', Object.entries(CURSOS).filter(([k]) => k !== 'base'))}</div><label>Solicitação<textarea name="t" rows="3" required maxlength="800"></textarea></label><button class="btn" style="justify-self:start">Enviar solicitação</button></form>
    <div class="card"><h2>Minhas solicitações</h2>${mine.length ? `<ul class="list">${mine.map((p) => `<li><span><b>${esc(CURSOS[p.curso])}</b><br>${esc(p.t)}${(p.enc || []).map((e) => `<br><small class="muted">↳ ${esc(e.t)} (${fdt(e.ts)})</small>`).join('')}</span>${pill(p.st === 'resolvida' ? 'ok' : 'warn', p.st === 'resolvida' ? 'Resolvida' : p.st === 'andamento' ? 'Em andamento' : 'Aberta')}</li>`).join('')}</ul>` : '<p class="muted">Nenhuma solicitação.</p>'}</div>`;
  };
  TIT.interna = 'Comunicação interna';

  /* ---------- avisos, notificações e calendário ---------- */
  function notificacoes() {
    const n = [], r = me() || {};
    Object.keys(ESPECIAIS).forEach((k) => { if (pedido(k) && !aut(k)) n.push(['warn', `${ESPECIAIS[k]}: aguardando autorização da coordenação.`]); else if (aut(k)) n.push(['ok', `${ESPECIAIS[k]}: autorizado.`]); });
    subsMinhas().forEach((s) => n.push(['ok', `Substituição confirmada: ${s.disc}, ${turmaNome(s.turma)}, ${dt(s.data)} às ${s.hora}.`]));
    const cv = conversas(), novas = Object.values(cv).filter((c) => c.ms.at(-1).aluno).length; if (novas) n.push(['warn', `${novas} conversa(s) de alunos aguardando resposta.`]);
    if (aut('paet')) { const q = ld('pend', []).filter((p) => p.curso === r.curso && p.st !== 'resolvida').length; if (q) n.push(['warn', `${q} pendência(s) abertas no seu curso.`]); }
    const sp = gestaoSusp().filter((x) => GVIS.status(x) === 'curso'); if (sp.length) n.push(['warn', `${sp.length} aluno(s) suspenso(s) hoje nas suas turmas: ${sp.map((x) => (window.TURMAS.porRA(x.ra) || {}).nome).filter(Boolean).slice(0, 4).join(', ')}.`]);
    const t = load('tarefas', []).filter((x) => !x.feito && x.data && x.data <= hoje()).length; if (t) n.push(['bad', `${t} tarefa(s) vencida(s) ou para hoje.`]);
    return n;
  }
  const eventos = () => ld('cal', []).map((e) => ({ ...e, esc: true })).concat(load('eventos', []).map((e) => ({ ...e })), load('atividades', []).map((a) => ({ titulo: `${a.tipo}: ${a.titulo} (${turmaNome(a.turma)})`, data: a.data }))).filter((e) => e.data >= hoje()).sort((a, b) => a.data.localeCompare(b.data));
  V.avisos = () => `<div class="card"><h2>Notificações</h2>${notificacoes().map(([s, t]) => `<p>${pill(s, s === 'ok' ? 'ok' : s === 'bad' ? 'urgente' : 'atenção')} ${esc(t)}</p>`).join('') || '<p class="muted">Sem notificações.</p>'}</div>
    <div class="card"><h2>Avisos da escola</h2>${ld('avisos', []).length ? `<ul class="list">${ld('avisos', []).map((a) => `<li><span><b>${esc(a.t)}</b><br>${esc(a.m)}</span><small>${esc(fdt(a.ts))}</small></li>`).join('')}</ul>` : '<p class="muted">Nenhum aviso publicado.</p>'}</div>
    <div class="card"><h2>Calendário (escolar + meu)</h2>${eventos().length ? `<ul class="list">${eventos().map((e) => `<li><span>${esc(e.titulo)}</span><span class="pill">${dt(e.data)}${e.esc ? ' · escola' : ''}</span></li>`).join('')}</ul>` : '<p class="muted">Nada marcado.</p>'}</div>${lista('eventos')}`;
  TIT.avisos = 'Avisos, notificações e calendário';

  /* ---------- informações da escola (só o que o perfil pode ver) ---------- */
  V.escola = () => {
    const r = reg(), ts = minhasTurmas();
    return `<div class="card"><h2>Secretaria</h2><ul class="list"><li><span>Telefone</span><b>(00) 0000-0000</b></li><li><span>E-mail</span><b>secretaria@escola.exemplo</b></li><li><span>Horário</span><b>Seg a Sex, 7h às 17h</b></li></ul></div>
    <div class="card"><h2>Cursos e responsáveis (PAET)</h2><ul class="list">${Object.entries(CURSOS).filter(([k]) => k !== 'base').map(([k, l]) => { const p = paetDe(k); return `<li><span>${esc(l)}</span><b>${p ? esc(p.nome) : 'sem PAET autorizado'}</b></li>`; }).join('')}</ul></div>
    <div class="card"><h2>Minhas turmas</h2>${ts.length ? `<ul class="list">${ts.map((k) => `<li><span>${esc(turmaNome(k))}</span><b>${alunosDa(k).length} alunos</b></li>`).join('')}</ul>` : '<p class="muted">Você ainda não tem turmas.</p>'}<p class="muted">Dados pessoais de alunos só aparecem para as turmas e fichas que você tem autorização para acompanhar.</p></div>
    <div class="card"><h2>Colegas cadastrados</h2><p class="muted">${Object.values(r).filter((x) => x.nome).length} professor(es) com perfil.</p></div>`;
  };
  TIT.escola = 'Informações da escola';

  /* ---------- professor substituto ---------- */
  const gate = (k, corpo) => aut(k) ? corpo() : `<div class="card"><h2>${ESPECIAIS[k]}</h2><p>${pill('warn', 'Aguardando a coordenação')}</p><p class="muted">Seu pedido foi enviado. Esta área abre assim que a coordenação autorizar.</p></div>`;
  V.sub = () => gate('sub', () => {
    const l = subs().filter((s) => s.data >= hoje() || s.escolhido === LOGIN).sort((a, b) => a.data.localeCompare(b.data));
    const st = (s) => s.escolhido === LOGIN ? pill('ok', 'Confirmada — está na sua agenda') : s.escolhido ? pill('bad', 'Preenchida por outro professor') : (s.interessados || []).includes(LOGIN) ? pill('warn', 'Aguardando aprovação da coordenação') : pill('', 'Disponível');
    return `<div class="card"><h2>Aulas para substituição</h2>${l.length ? `<ul class="list">${l.map((s) => `<li><span><b>${esc(s.disc)}</b> · ${esc(turmaNome(s.turma))}<br><small class="muted">${dt(s.data)} (${diaDe(s.data)}) · ${esc(s.hora)}</small><br>${st(s)}</span>${s.escolhido ? '' : `<button class="btn${(s.interessados || []).includes(LOGIN) ? ' ghost' : ''} sm" data-interesse="${s.id}">${(s.interessados || []).includes(LOGIN) ? 'Retirar interesse' : 'Tenho interesse'}</button>`}</li>`).join('')}</ul>` : '<p class="muted">Nenhuma aula disponível. A coordenação publica as aulas aqui.</p>'}</div>`;
  });
  TIT.sub = 'Professor substituto';

  /* ---------- PAET ---------- */
  V.paet = () => gate('paet', () => {
    const c = (me() || {}).curso, l = ld('pend', []).filter((p) => p.curso === c).sort((a, b) => (a.st === 'resolvida') - (b.st === 'resolvida') || b.ts - a.ts);
    return `<div class="card hero"><div><h2>PAET · ${esc(CURSOS[c])}</h2><p>${l.filter((p) => p.st !== 'resolvida').length} pendência(s) aberta(s).</p></div></div>
    ${l.map((p) => `<div class="card req"><div class="req-top"><span><b>${esc(p.nome)}</b> · ${fdt(p.ts)}<br>${esc(p.t)}</span>${pill(p.st === 'resolvida' ? 'ok' : 'warn', p.st === 'resolvida' ? 'Resolvida' : p.st === 'andamento' ? 'Em andamento' : 'Aberta')}</div>
      ${(p.enc || []).map((e) => `<small class="muted">↳ ${esc(e.t)} (${fdt(e.ts)})</small>`).join('')}
      ${p.st === 'resolvida' ? '' : `<form class="form" data-form="enc:${p.id}"><label>Registrar encaminhamento<input name="t" required maxlength="300"></label><div class="row-btns"><button class="btn sm">Registrar</button><button class="btn ghost sm" type="button" data-resolver="${p.id}">Marcar como resolvida</button></div></form>`}</div>`).join('') || '<div class="card"><p class="muted">Nenhuma pendência no seu curso. Os professores enviam em Comunicação interna.</p></div>'}`;
  });
  TIT.paet = 'Painel PAET';

  /* ---------- educação especial: Meus Alunos Acompanhados ---------- */
  let fRa = '';
  V.acomp = () => gate('esp', () => {
    const ras = (ld('acomp', {})[LOGIN] || []), fi = load('fichas', {});
    if (!ras.includes(fRa)) fRa = '';
    const f = fi[fRa] || { horarios: '', objetivos: '', reg: [] }, a = fRa && window.TURMAS.porRA(fRa);
    const lista1 = `<div class="card"><h2>Meus Alunos Acompanhados</h2><p class="muted">Só aparecem alunos autorizados pela coordenação para você.</p><div class="pg">${ras.map((ra) => { const x = window.TURMAS.porRA(ra); return x ? `<button class="btn ghost${ra === fRa ? ' on' : ''}" data-ficha="${ra}"><b>${esc(x.nome)}</b><br><small>${esc(window.TURMAS.rotulo(x))}</small></button>` : ''; }).join('') || '<p class="muted">Nenhum aluno autorizado ainda.</p>'}</div></div>`;
    if (!a) return lista1;
    const niv = f.reg.filter((x) => x.n).slice().sort((x, y) => x.d.localeCompare(y.d)).slice(-12);
    return `<div class="row2">${lista1}<div>
      <form class="card form" style="max-width:none" data-form="ficha"><h2>Ficha de ${esc(a.nome)}</h2><p class="muted">${esc(window.TURMAS.rotulo(a))} · RA ${a.ra}</p>${fld('horarios', 'Horários de atendimento', 'area', [], f.horarios)}${fld('objetivos', 'Objetivos pedagógicos', 'area', [], f.objetivos)}<button class="btn" style="justify-self:start">Salvar ficha</button></form>
      <form class="card form" style="max-width:none" data-form="acreg"><h2>Novo registro de acompanhamento</h2><div class="fields">${fld('d', 'Data', 'date', [], hoje())}${fld('n', 'Desempenho no dia', 'sel', [['', 'Não avaliar'], ['1', '1 · muito difícil'], ['2', '2'], ['3', '3 · parcial'], ['4', '4'], ['5', '5 · muito bom']])}</div>${fld('t', 'Registro', 'area')}<button class="btn" style="justify-self:start">Registrar</button></form>
      <div class="card"><h2>Evolução</h2>${niv.length ? `<div class="bars" role="img" aria-label="Evolução do desempenho">${niv.map((x) => `<i style="height:${x.n * 20}%" title="${dt(x.d)}: ${x.n}"></i>`).join('')}</div><p class="muted">Últimos ${niv.length} registros avaliados (1 a 5).</p>` : '<p class="muted">Sem avaliações ainda.</p>'}</div>
      <div class="card"><h2>Histórico</h2>${f.reg.length ? `<ul class="list">${f.reg.slice().sort((x, y) => y.d.localeCompare(x.d)).map((x) => `<li><span>${esc(x.t)}</span><span class="pill">${dt(x.d)}${x.n ? ' · ' + x.n + '/5' : ''}</span></li>`).join('')}</ul>` : '<p class="muted">Nenhum registro.</p>'}</div></div></div>`;
  });
  TIT.acomp = 'Meus Alunos Acompanhados';

  /* ---------- notas: o professor corrige e lança no boletim ---------- */
  let nTurma = '', nDisc = '', nB = 0;
  V.notas = () => {
    const grade = load('grade', []), ts = [...new Set(grade.map((g) => g.turma))];
    if (!ts.length) return `<div class="card"><h2>Notas e boletim</h2><p class="muted">Cadastre suas aulas em Agenda e horários para lançar notas nas suas turmas.</p><button class="btn" data-go="agenda">Abrir agenda</button></div>`;
    if (!ts.includes(nTurma)) nTurma = ts[0];
    const ds = [...new Set(grade.filter((g) => g.turma === nTurma).map((g) => g.disc))]; if (!ds.includes(nDisc)) nDisc = ds[0];
    const ov = ld('notas', {}), cur = (a) => { const b = TURMAS.boletim(a).notas[nDisc]; return b ? ((ov[a.ra] || {})[nDisc] || b) : null; };
    const al = alunosDa(nTurma).filter((a) => cur(a));
    const fmt = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',');
    return `<form class="card form" style="max-width:none" data-form="notas"><h2>Lançar notas no boletim</h2><div class="fields"><label>Turma<select data-nsel="t">${ts.map((k) => `<option value="${esc(k)}"${k === nTurma ? ' selected' : ''}>${esc(turmaNome(k))}</option>`).join('')}</select></label><label>Disciplina<select data-nsel="d">${ds.map((d) => `<option${d === nDisc ? ' selected' : ''}>${esc(d)}</option>`).join('')}</select></label><label>Bimestre<select data-nsel="b">${[1, 2, 3, 4].map((b) => `<option value="${b - 1}"${b - 1 === nB ? ' selected' : ''}>${b}º bimestre</option>`).join('')}</select></label></div>
      <p class="muted">Corrija ou preencha a nota de 0 a 10 (deixe vazio se ainda não houver nota). Ao salvar, o boletim do aluno e dos responsáveis é atualizado.</p>
      <div class="tscroll"><table><thead><tr><th>Aluno</th><th>Notas lançadas</th><th>${nB + 1}º bimestre</th></tr></thead><tbody>${al.map((a) => { const c = cur(a); return `<tr><td>${esc(a.nome)}</td><td>${c.map((v) => v === null ? '–' : fmt(v)).join(' · ')}</td><td><input name="n_${a.ra}" inputmode="decimal" value="${c[nB] === null ? '' : fmt(c[nB])}" size="4" aria-label="Nota de ${esc(a.nome)}"></td></tr>`; }).join('')}</tbody></table></div>
      <button class="btn" style="justify-self:start">Salvar notas</button></form>`;
  };
  TIT.notas = 'Notas e boletim';

  /* ---------- feedback aos responsáveis e chat com responsáveis ---------- */
  V.feedback = () => {
    const al = minhasTurmas().flatMap((k) => alunosDa(k).map((a) => [a.ra, `${a.nome} · ${turmaNome(k)}`])), mine = ld('fb', []).filter((f) => f.prof === LOGIN).sort((a, b) => b.ts - a.ts);
    return `${al.length ? `<form class="card form" style="max-width:none" data-form="fb"><h2>Feedback para os responsáveis</h2><div class="fields">${fld('ra', 'Aluno', 'sel', al)}${fld('tipo', 'Tipo', 'sel', ['Evolução', 'Elogio', 'Ponto de atenção', 'Sugestão para casa'])}${fld('disc', 'Disciplina', 'sel', [...new Set(load('grade', []).map((g) => g.disc))])}</div>${fld('t', 'Feedback', 'area')}<button class="btn" style="justify-self:start">Enviar aos responsáveis</button></form>` : '<div class="card"><p class="muted">Cadastre suas aulas para escolher alunos.</p></div>'}
    <div class="card"><h2>Feedbacks enviados</h2>${mine.length ? `<ul class="list">${mine.map((f) => { const a = TURMAS.porRA(f.ra); return `<li><span><b>${esc(f.tipo)}</b> · ${esc(a ? a.nome : f.ra)} · ${esc(f.disc)}<br>${esc(f.t)}</span><small>${fdt(f.ts)}</small></li>`; }).join('')}</ul>` : '<p class="muted">Nenhum feedback enviado.</p>'}</div>`;
  };
  TIT.feedback = 'Feedback aos responsáveis';
  let pSel = '';
  V.pais = () => {
    const all = ld('pchat', []).filter((m) => m.para === 'prof:' + LOGIN), cv = {};
    all.forEach((m) => { (cv[m.conv] ||= { m, ms: [] }).ms.push(m); });
    const keys = Object.keys(cv).sort((a, b) => cv[b].ms.at(-1).ts - cv[a].ms.at(-1).ts); if (!cv[pSel]) pSel = keys[0] || '';
    const c = cv[pSel], al = (x) => TURMAS.porRA(x.ra);
    return `<div class="row2"><div class="card"><h2>Responsáveis</h2><div class="pg">${keys.map((k) => `<button class="btn ghost${k === pSel ? ' on' : ''}" data-pconv="${esc(k)}"><b>${esc(cv[k].m.nomeResp)}</b><br><small>responsável de ${esc((al(cv[k].m) || {}).nome || '')}${cv[k].ms.at(-1).de === 'resp' ? ' · 🔵 nova' : ''}</small></button>`).join('') || '<p class="muted">Nenhuma mensagem de responsáveis ainda.</p>'}</div></div>
      <div class="card">${c ? `<h2>${esc(c.m.nomeResp)}</h2><div class="msgs" style="max-height:340px">${c.ms.sort((a, b) => a.ts - b.ts).map((m) => `<div class="msg${m.de === 'resp' ? '' : ' me'}">${esc(m.t)}<time>${fdt(m.ts)}</time></div>`).join('')}</div><form class="composer" data-form="presp"><input name="t" required maxlength="500" placeholder="Responder ao responsável…" aria-label="Mensagem" autocomplete="off"><button class="send" aria-label="Enviar">${ic('send')}</button></form>` : '<h2>Selecione uma conversa</h2>'}</div></div>`;
  };
  TIT.pais = 'Chat com os responsáveis';

  /* ---------- acessibilidade ---------- */
  V.acess = () => `<form class="card form" style="max-width:none" data-form="acess"><h2>Acessibilidade</h2><p class="muted">Tudo é opcional e não depende de diagnóstico. Escolha o que ajuda você.</p>${RECURSOS.map(([k, l]) => `<label class="chk"><input type="checkbox" name="rc_${k}" ${ACESS.includes(k) ? 'checked' : ''}> ${l}</label>`).join('')}<p class="muted">Libras usa o tradutor oficial do governo e precisa de internet.</p><button class="btn" style="justify-self:start">Salvar</button></form>`;
  TIT.acess = 'Acessibilidade';

  /* ---------- início ---------- */
  V.inicio = () => {
    const dia = diaDe(hoje()), grade = load('grade', []).filter((g) => g.dia === dia).concat(subsMinhas().filter((s) => s.data === hoje())), n = notificacoes();
    const tile = (v, i, t, s) => `<button class="tile" data-go="${v}"><span class="ti">${ic(i)}</span><span>${t}<small>${s}</small></span></button>`;
    return `<section class="card hero"><div><span class="eyebrow">${esc(CURSOS[(me() || {}).curso] || '')}</span><h2>Olá, ${esc(nome1())}!</h2><p>E.E. Colombo de Almeida${['paet', 'sub', 'esp'].filter(aut).map((k) => ` · ${ESPECIAIS[k]}`).join('')}</p></div></section>
    <div class="tiles">${tile('agenda', 'cal', 'Agenda', 'Horários')}${tile('diario', 'book', 'Diário', 'Turmas e presença')}${tile('atividades', 'pen', 'Atividades', 'Avaliações')}${tile('ocorrencias', 'alert', 'Ocorrências', 'Alunos')}${tile('notas', 'check', 'Notas', 'Boletim')}${tile('chat', 'chat', 'Chat', 'Alunos')}${tile('pais', 'users', 'Responsáveis', 'Chat e feedback')}${tile('interna', 'mail', 'Comunicação', 'Colegas e coordenação')}${tile('avisos', 'bell', 'Avisos', 'Calendário')}${tile('tarefas', 'folder', 'Tarefas', 'Documentos')}${tile('escola', 'school', 'Escola', 'Informações')}
      ${(pedido('sub') || aut('sub')) ? tile('sub', 'swap', 'Substituição', 'Aulas disponíveis') : ''}${(pedido('paet') || aut('paet')) ? tile('paet', 'shield', 'PAET', 'Pendências do curso') : ''}${(pedido('esp') || aut('esp')) ? tile('acomp', 'heart', 'Meus Alunos', 'Acompanhados') : ''}</div>
    <div class="grid"><div class="card"><h2>Hoje (${dia})</h2>${grade.length ? grade.sort((a, b) => a.hora.localeCompare(b.hora)).map((g) => `<div class="aula" style="--c:${corDe(g.disc)}"><b>${esc(g.hora)}</b> · ${esc(g.disc)}<small>${esc(turmaNome(g.turma))}</small></div>`).join('') : '<p class="muted">Sem aulas hoje.</p>'}</div>
      <div class="card"><h2>Pendências</h2>${n.slice(0, 5).map(([s, t]) => `<p>${pill(s, s === 'ok' ? 'ok' : 'atenção')} ${esc(t)}</p>`).join('') || '<p class="muted">Tudo em dia. 🎉</p>'}<button class="btn ghost sm" data-go="avisos">Ver tudo</button></div></div>`;
  };
  TIT.inicio = 'Início';

  /* ---------- núcleo ---------- */
  const NAV = [['inicio', 'home', 'Início'], ['agenda', 'cal', 'Agenda e horários'], ['diario', 'book', 'Diário de classe'], ['atividades', 'pen', 'Atividades e avaliações'], ['ocorrencias', 'alert', 'Ocorrências'], ['pedidos', 'folder', 'Pedidos e chamados'], ['notas', 'check', 'Notas e boletim'], ['chat', 'chat', 'Chat com alunos'], ['pais', 'users', 'Chat com responsáveis'], ['feedback', 'heart', 'Feedback aos responsáveis'], ['interna', 'mail', 'Comunicação interna'], ['avisos', 'bell', 'Avisos e calendário'], ['tarefas', 'folder', 'Documentos e tarefas'], ['escola', 'school', 'Informações da escola']];
  function montarMenu() {
    const r = me();
    if (!r || !r.nome) { $('#nav').innerHTML = ''; return; }
    const it = NAV.slice();
    if (pedido('sub') || aut('sub')) it.push(['sub', 'swap', 'Substituição']);
    if (pedido('paet') || aut('paet')) it.push(['paet', 'shield', 'Painel PAET']);
    if (pedido('esp') || aut('esp')) it.push(['acomp', 'heart', 'Meus Alunos Acompanhados']);
    it.push(['perfil', 'id', 'Meu perfil'], ['acess', 'cog', 'Acessibilidade']);
    $('#nav').innerHTML = it.map(([v, i, l]) => `<button data-view="${v}">${ic(i)}<span>${l}</span></button>`).join('');
    $('#whoName').textContent = r.nome; pintarFoto();
  }
  let cur = 'inicio';
  function go(v) {
    const r = me(); if (!r || !r.nome) v = 'perfil'; // primeiro acesso: só o formulário
    cur = v; $('#title').textContent = TIT[v]; $$('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.view === v));
    $('#content').innerHTML = V[v](); $('#side').classList.remove('open'); window.scrollTo(0, 0);
    const m = $('.msgs'); if (m) m.scrollTop = m.scrollHeight;
    $('#title').focus({ preventScroll: true }); speak(TIT[v]);
  }
  const sair = () => { Colombo.session.end(); location.href = 'professor.html'; };

  document.addEventListener('click', (e) => {
    const t = e.target.closest('button,a'); if (!t) return;
    const D = t.dataset;
    if (D.foto !== undefined) return fi.click();
    if (D.fotoRm !== undefined) { try { localStorage.removeItem(K('foto')); } catch { /* ignora */ } pintarFoto(); toast('Foto removida.'); return go('perfil'); }
    if (D.view || D.go) return go(D.view || D.go);
    if (D.turma) { dTurma = D.turma; return go('diario'); }
    if (D.pconv) { pSel = D.pconv; return go('pais'); }
    if (D.conv) { cSel = D.conv; return go('chat'); }
    if (D.ficha) { fRa = D.ficha; return go('acomp'); }
    if (D.fe || D.del) { const [k, i] = (D.fe || D.del).split('|'); save(k, load(k, []).map((x) => x.id === i ? { ...x, feito: !x.feito } : x).filter((x) => !(D.del && x.id === i))); if (D.del && { ocorrencias: 1, atividades: 1 }[k]) { const mk = k === 'ocorrencias' ? 'ocorr' : 'ativ'; sv(mk, ld(mk, []).filter((x) => x.id !== i)); } return go(cur); }
    if (D.interesse) { const l = subs().map((s) => { if (s.id !== D.interesse || s.escolhido) return s; const i = new Set(s.interessados || []); i.has(LOGIN) ? i.delete(LOGIN) : i.add(LOGIN); return { ...s, interessados: [...i] }; }); sv('subs', l); toast('Interesse atualizado. A coordenação vai avaliar.'); return go('sub'); }
    if (D.resolver) { sv('pend', ld('pend', []).map((p) => p.id === D.resolver ? { ...p, st: 'resolvida' } : p)); toast('Pendência resolvida.'); return go('paet'); }
  });
  document.addEventListener('change', (e) => { const t = e.target, D = t.dataset;
    if (D.datadiario !== undefined && t.value) { dData = t.value; go('diario'); }
    if (D.discdiario !== undefined) { dDisc = t.value; go('diario'); }
    if (D.nsel) { if (D.nsel === 't') { nTurma = t.value; nDisc = ''; } else if (D.nsel === 'd') nDisc = t.value; else nB = Number(t.value); go('notas'); } });
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-form]'); if (!form) return; e.preventDefault();
    const fd = new FormData(form), d = Object.fromEntries(fd), [tipo, arg] = form.dataset.form.split(':'), ts = now();
    switch (tipo) {
      case 'chamesc': { const [t, alvo] = CHT[Number(d.tipo)]; let l = []; try { l = JSON.parse(localStorage.getItem('colombo.chamados.v1')) || []; } catch { l = []; } l.unshift({ id: id(), tipo: t, alvo, sala: d.sala, obs: d.obs, urg: d.urg ? 1 : 0, por: meuNome(), st: 'aberto', at: fdt(ts), ts }); try { localStorage.setItem('colombo.chamados.v1', JSON.stringify(l)); } catch { /* ignora */ } toast('Chamado enviado!'); return go('pedidos'); }
      case 'pedesc': { const sq = ld('org_seq', {}); sq.ped = (sq.ped || 0) + 1; sv('org_seq', sq); const cat = PCAT.find((c) => c[0] === d.cat) || PCAT[7], pr = PDIAS[d.prio] ? d.prio : 'normal', dd = new Date(); dd.setDate(dd.getDate() + PDIAS[pr]);
        sv('org_ped', [{ id: id(), num: `PED-${dd.getFullYear()}-${String(sq.ped).padStart(4, '0')}`, titulo: d.titulo, desc: d.desc || '', cat: cat[0], prio: pr, local: d.local || '', setor: cat[2], por: 'professor:' + LOGIN, porNome: meuNome(), st: 'aberto', ts, atualizado: ts, prazo: `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`, custo: 0, atrib: '', atribNome: '', aprov: null, hist: [{ ts, por: meuNome(), t: 'Pedido aberto' }] }, ...ld('org_ped', [])]); toast('Pedido enviado à escola.'); return go('pedidos'); }
      case 'perfil': return salvarPerfil(d);
      case 'acess': ACESS = RECURSOS.map(([k]) => k).filter((k) => d['rc_' + k]); save('acess', ACESS); setReg(LOGIN, (r) => ({ ...r, acess: { ...(r.acess || {}), recursos: ACESS } })); aplicarAcess(); toast('Preferências salvas!'); return go('acess');
      case 'g': { const it = { ...d, id: id(), ts }; save(arg, [it, ...load(arg, [])]); const mk = { ocorrencias: 'ocorr', atividades: 'ativ' }[arg]; if (mk) sv(mk, [...ld(mk, []), { ...it, prof: (me() || {}).nome }]); } toast('Salvo!'); return go(cur);
      case 'notas': { const ov = ld('notas', {}); let ruim = '';
        alunosDa(nTurma).forEach((a) => { const k = 'n_' + a.ra; if (!(k in d)) return; const raw = String(d[k]).trim().replace(',', '.'), v = raw === '' ? null : Number(raw);
          if (v !== null && (isNaN(v) || v < 0 || v > 10)) { ruim = a.nome; return; }
          const b = TURMAS.boletim(a).notas[nDisc]; if (!b) return; const arr = ((ov[a.ra] || {})[nDisc] || b).slice(); arr[nB] = v === null ? null : Math.round(v * 10) / 10; (ov[a.ra] ||= {})[nDisc] = arr; });
        if (ruim) return toast(`Nota inválida para ${ruim}. Use de 0 a 10.`); sv('notas', ov); toast('Notas lançadas no boletim!'); return go('notas'); }
      case 'fb': sv('fb', [...ld('fb', []), { id: id(), prof: LOGIN, profNome: (me() || {}).nome, ...d, ts }]); toast('Feedback enviado aos responsáveis.'); return go('feedback');
      case 'presp': { if (!pSel) return; const m = ld('pchat', []).find((x) => x.conv === pSel); sv('pchat', [...ld('pchat', []), { id: id(), conv: pSel, para: m.para, resp: m.resp, nomeResp: m.nomeResp, ra: m.ra, de: 'prof', t: d.t, ts }]); return go('pais'); }
      case 'grade': save('grade', [...load('grade', []), { ...d, id: id() }]); toast('Aula adicionada.'); return go('agenda');
      case 'diario': { if (!dDisc) return; const aus = alunosDa(dTurma).filter((a) => !d['p_' + a.ra]).map((a) => a.ra), di = load('diario', {}); di[`${dTurma}|${dData}|${dDisc}`] = { conteudo: d.conteudo, ausentes: aus }; save('diario', di);
        sv('pres', ld('pres', []).filter((p) => !(p.prof === LOGIN && p.turma === dTurma && p.data === dData && p.disc === dDisc)).concat({ prof: LOGIN, turma: dTurma, data: dData, disc: dDisc, ausentes: aus })); toast('Diário salvo!'); return go('diario'); }
      case 'resp': { if (!cSel) return; const [ra, ...dc] = cSel.split('|'); sv('resp', [...ld('resp', []), { ra, disc: dc.join('|'), t: d.t, ts, de: LOGIN }]); return go('chat'); }
      case 'novaconv': { if (!d.ra) return; sv('resp', [...ld('resp', []), { ra: d.ra, disc: d.disc, t: d.t, ts, de: LOGIN }]); cSel = `${d.ra}|${d.disc}`; return go('chat'); }
      case 'msg': sv('msgs', [...ld('msgs', []), { id: id(), de: LOGIN, nome: (me() || {}).nome, para: d.para, t: d.t, ts }]); toast('Mensagem enviada.'); return go('interna');
      case 'pend': sv('pend', [{ id: id(), curso: d.curso, de: LOGIN, nome: (me() || {}).nome, t: d.t, st: 'aberta', enc: [], ts }, ...ld('pend', [])]); toast('Solicitação enviada ao PAET.'); return go('interna');
      case 'enc': sv('pend', ld('pend', []).map((p) => p.id === arg ? { ...p, st: 'andamento', enc: [...(p.enc || []), { t: d.t, ts }] } : p)); toast('Encaminhamento registrado.'); return go('paet');
      case 'ficha': { const fi = load('fichas', {}); fi[fRa] = { ...(fi[fRa] || { reg: [] }), horarios: d.horarios, objetivos: d.objetivos }; save('fichas', fi); toast('Ficha salva.'); return go('acomp'); }
      case 'acreg': { const fi = load('fichas', {}), f = fi[fRa] || { horarios: '', objetivos: '', reg: [] }; f.reg = [...f.reg, { d: d.d, t: d.t, n: Number(d.n) || 0 }]; fi[fRa] = f; save('fichas', fi); toast('Registro salvo.'); return go('acomp'); }
    }
  });
  window.addEventListener('storage', () => { if (!['perfil', 'agenda'].includes(cur) && !document.activeElement.closest('form')) { montarMenu(); go(cur); } });

  $('#burger').innerHTML = '<svg class="ic" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  $('#burger').onclick = () => $('#side').classList.toggle('open'); $('#scrim').onclick = () => $('#side').classList.remove('open');
  $('#logout').innerHTML = `${ic('logout')} Sair da conta`; $('#logout').onclick = sair;
  aplicarAcess(); montarMenu(); go('inicio');
})();
