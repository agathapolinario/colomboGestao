/* Painel do aluno · protótipo.
   Os dados abaixo (DADOS) são de exemplo: na versão real virão do servidor/SED. */
(() => {
  'use strict';
  const { session } = Colombo;
  const sess = session.get();
  if (!sess || sess.role !== 'aluno') { location.replace('aluno.html'); return; }

  const LINKS = window.COLOMBO_LINKS;
  /* quem é o aluno na lista da escola (turma, turno, curso técnico, grêmio) */
  const RA = String(sess.who || '').replace(/\D/g, '');
  const ALUNO = TURMAS.porRA(RA) || { nome: '', segmento: 'em', serie: '2º', letra: 'B', turno: 'Manhã', curso: null, gremio: null, ra: RA || '0' };
  const CURSO = TURMAS.cursoDe(ALUNO);
  const BOL = TURMAS.boletim(ALUNO);
  const MEDIA = 5, FREQ_MIN = 75;

  /* ---------- DADOS DE EXEMPLO ---------- */
  const DADOS = {
    turma: '2º Ano B',
    // notas por bimestre; null = ainda não lançada
    notas: {
      'Língua Portuguesa': [7, 7, 7, 7], 'Matemática': [6, 4, 5, null], 'História': [8, 7, 9, null],
      'Geografia': [7, 6, null, null], 'Ciências': [5, 6, 6, null], 'Inglês': [9, 8, 8, null],
      'Educação Física': [10, 9, null, null], 'Artes': [8, 9, 8, null],
    },
    // aulas dadas / faltas por disciplina
    freq: {
      'Língua Portuguesa': [120, 6], 'Matemática': [120, 12], 'História': [60, 2], 'Geografia': [60, 4],
      'Ciências': [60, 3], 'Inglês': [60, 1], 'Educação Física': [60, 5], 'Artes': [30, 0],
    },
    secretaria: { tel: '(00) 0000-0000', whats: '(00) 90000-0000', email: 'secretaria@escola.exemplo', horario: 'Seg a Sex, 7h às 17h', local: 'Térreo, ao lado da entrada principal' },
    documentos: ['Declaração de comparecimento', 'Declaração de matrícula', 'Histórico escolar', 'Boletim / ficha individual', 'Declaração de transferência', 'Outro documento'],
    professores: ['Língua Portuguesa', 'Matemática', 'História', 'Geografia', 'Ciências', 'Inglês', 'Educação Física', 'Artes'].map((d) => ({ id: d, nome: `Prof(a). de ${d}`, disc: d })).concat([{ id: 'Direção', nome: 'Direção', disc: 'Direção da escola' }, { id: 'Secretaria', nome: 'Secretaria', disc: 'Documentos e atendimento' }]),
    agenda: [
      { id: 1, prof: 'Matemática', txt: 'Entregar lista de exercícios (função afim)', data: '2026-10-16' },
      { id: 2, prof: 'História', txt: 'Trabalho em grupo: Era Vargas', data: '2026-10-20' },
      { id: 3, prof: 'Língua Portuguesa', txt: 'Redação Paulista da semana', data: '2026-10-18' },
    ],
    ocorrencias: { advertencias: 0, ocorrencias: 1, lista: [{ tipo: 'Ocorrência', data: '2026-09-22', txt: 'Atraso na entrada (3 vezes no mês).' }] },
    convocacoes: [], // ex.: { data, txt } — a vice-direção convoca pela plataforma
    cardapio: { 'Segunda': 'Arroz, feijão, frango assado e salada', 'Terça': 'Macarrão à bolonhesa e fruta', 'Quarta': 'Arroz, feijão, carne moída e legumes', 'Quinta': 'Escondidinho de frango e salada', 'Sexta': 'Arroz, feijão, omelete e suco' },
    dados: { nome: '', nascimento: '', rg: '', cpf: '', endereco: '', bairro: '', cidade: '', mae: '', pai: '', respTel: '', tel: '', email: '' },
  };

  DADOS.turma = TURMAS.rotulo(ALUNO);
  DADOS.notas = DOC.notasDe(ALUNO, BOL.notas); // inclui notas lançadas pelos professores
  DADOS.freq = DOC.freqDe(ALUNO, BOL.freq);   // inclui faltas lançadas no diário
  /* dados lançados pela gestão (recalculados a cada tela, para refletir mudanças) */
  const syncGestao = () => {
    const oc = GVIS.ocorr(ALUNO.ra), conv = GVIS.convoc(ALUNO.ra).filter((c) => c.quem !== 'Responsável');
    DADOS.ocorrencias = { advertencias: oc.filter((o) => /advert/i.test(o.tipo)).length, ocorrencias: oc.length, lista: oc.map((o) => ({ tipo: o.tipo, data: o.data, txt: o.obs || '' })) };
    DADOS.convocacoes = conv.map((c) => ({ data: c.data, txt: `${c.assunto} (${c.hora || ''}, ${c.local || 'escola'})` }));
    const cd = DOC.ld('cardapio', null); if (cd && Object.values(cd).some(Boolean)) DADOS.cardapio = cd;
  };
  syncGestao();
  DADOS.professores = Object.keys(BOL.notas).map((d) => ({ id: d, nome: `Prof(a). de ${d}`, disc: d }))
    .concat([{ id: 'Direção', nome: 'Direção', disc: 'Direção da escola' }, { id: 'Secretaria', nome: 'Secretaria', disc: 'Documentos e atendimento' }]);
  DADOS.dados.nome = ALUNO.nome || '';

  /* ---------- utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = String(sess.who || 'aluno');
  const K = (n) => `colombo.aluno.${uid}.${n}`;
  const load = (n, f) => { try { return JSON.parse(localStorage.getItem(K(n))) ?? f; } catch { return f; } };
  const save = (n, v) => { try { localStorage.setItem(K(n), JSON.stringify(v)); return true; } catch { return false; } };
  /* caixa compartilhada do Grêmio (todas as contas deste navegador enxergam) */
  const SH = (n) => `colombo.gremio.${n}.v1`;
  const shLoad = (n) => { try { return JSON.parse(localStorage.getItem(SH(n))) || []; } catch { return []; } };
  const shSave = (n, v) => { try { localStorage.setItem(SH(n), JSON.stringify(v)); } catch { /* ignora */ } };
  const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const fmt = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',');
  const dt = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR');
  const toast = (m) => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 2600); };

  /* ---------- ícones (SVG de traço) ---------- */
  const IC = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-8M21 20H3"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    pin: '<path d="M12 2a6 6 0 0 0-6 6c0 5 6 12 6 12s6-7 6-12a6 6 0 0 0-6-6z"/><circle cx="12" cy="8" r="2"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v5M12 18h.01"/>',
    food: '<path d="M7 3v7a2 2 0 0 0 4 0V3M9 10v11M17 3c-2 2-3 5-3 8h3v10"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14a5 5 0 0 1 5 5"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16a3 3 0 0 1 6 0M14 10h4M14 14h4"/>',
    cog: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    camera: '<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    ext: '<path d="M7 17 17 7M8 7h9v9"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    checks: '<path d="m2 12 5 5L17 6M10 15l2 2L22 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    pen: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    school: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.500 6-3v-4.500"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.500 0 2-1 1.500-2-.5-1.200.2-2.500 1.500-2.500H17a4 4 0 0 0 4-4c0-5-4-9.500-9-9.500z"/><circle cx="7.500" cy="11" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="16" cy="8" r="1"/>',
    code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M8 16h2M12 16h2"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
    paper: '<path d="M4 4h16v13H8l-4 4z"/>',
    phone: '<path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
  };
  const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;
  const CORES = ['#2563eb', '#7c3aed', '#059669', '#db2777', '#ea580c', '#0891b2', '#4f46e5', '#16a34a', '#d97706', '#0d9488'];
  const corDe = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return CORES[h % CORES.length]; };
  const iniciais = (s) => String(s).replace(/^Prof\(a\)\.\s*de\s*/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'A';
  const horaCurta = (ts) => { if (!ts) return ''; const d = new Date(ts), h = new Date(); return d.toDateString() === h.toDateString() ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); };
  const diaLongo = (ts) => { const d = new Date(ts), h = new Date(), ont = new Date(Date.now() - 864e5); return d.toDateString() === h.toDateString() ? 'Hoje' : d.toDateString() === ont.toDateString() ? 'Ontem' : d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }); };
  const proto = (pre, id) => `${pre}-${new Date().getFullYear()}-${String(id).slice(-5)}`;

  /* ---------- lógica do boletim (média 5) ---------- */
  function situacaoDisc(notas) {
    const lan = notas.filter((n) => n !== null);
    const soma = lan.reduce((a, b) => a + b, 0);
    const falta = notas.length - lan.length;
    const total = notas.length;
    if (!falta) {
      const media = soma / total;
      return { soma, media, st: media >= MEDIA ? 'ok' : 'bad', txt: media >= MEDIA ? 'Aprovado' : 'Reprovado', nota: '' };
    }
    const precisa = MEDIA * total - soma; // soma necessária nos bimestres restantes
    const porB = precisa / falta;
    if (porB > 10) return { soma, media: soma / lan.length, st: 'bad', txt: 'Sem chance de média', nota: '' };
    return { soma, media: soma / lan.length, st: porB <= 0 ? 'ok' : 'warn', txt: porB <= 0 ? 'Já garantiu a média' : 'Em andamento',
      nota: porB <= 0 ? '' : `Precisa de ${fmt(Math.max(porB, 0))} em cada bimestre restante` };
  }
  const resumoNotas = () => Object.entries(DADOS.notas).map(([d, n]) => ({ d, n, ...situacaoDisc(n) }));
  function freqGeral() {
    let a = 0, f = 0;
    Object.values(DADOS.freq).forEach(([x, y]) => { a += x; f += y; });
    const pct = a ? ((a - f) / a) * 100 : 100;
    return { aulas: a, faltas: f, pct, ok: pct >= FREQ_MIN };
  }
  function passouAno() {
    const r = resumoNotas(), fq = freqGeral();
    const finalizado = r.every((x) => x.n.every((v) => v !== null));
    const reprov = r.filter((x) => x.st === 'bad').map((x) => x.d);
    if (!fq.ok) return { st: 'bad', txt: 'Frequência abaixo de 75% — risco de reprovação por falta.' };
    if (reprov.length) return { st: 'bad', txt: finalizado ? `Reprovado em: ${reprov.join(', ')}.` : `Atenção: sem média em ${reprov.join(', ')}.` };
    if (!finalizado) return { st: 'warn', txt: 'Ano em andamento: até agora você está no caminho para passar de ano.' };
    return { st: 'ok', txt: 'Parabéns! Você passou de ano. 🎉' };
  }

  /* ---------- telas ---------- */
  const V = {};
  const pill = (st, t) => `<span class="pill ${st}">${esc(t)}</span>`;

  V.inicio = () => {
    syncGestao();
    const p = passouAno(), fq = freqGeral(), oc = DADOS.ocorrencias, hoje = DIAS[new Date().getDay()];
    const pend = load('agendaFeita', []);
    const ags = DADOS.agenda.filter((a) => !pend.includes(a.id)).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 3);
    const conv = GVIS.faixa(ALUNO.ra, 'aluno');
    const hr = new Date().getHours(), saud = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
    const tile = (v, i, t, s) => `<button class="tile" data-go="${v}"><span class="ti">${ic(i)}</span><span>${t}<small>${s}</small></span></button>`;
    return `
    <section class="card hero"><div><span class="eyebrow">${esc(DADOS.turma)}${CURSO ? ` · ${esc(CURSO.nome)}` : ''}</span><h2>${saud}, ${esc(nome())}!</h2><p>E.E. Colombo de Almeida${CURSO ? ` · ${esc(CURSO.inst)}` : ''}</p>${ALUNO.gremio ? `<span class="pill">${ic('star')} Grêmio · ${esc(ALUNO.gremio)}</span>` : ''}</div>
      <a class="btn" href="${esc(LINKS.tarefasSP)}" target="_blank" rel="noopener">Abrir Tarefas SP ${ic('ext')}</a></section>
    ${conv}
    ${avisosGremio()}
    <div class="tiles">
      ${tile('chat', 'chat', 'Chat', 'Professores')}
      ${tile('secretaria', 'folder', 'Secretaria', 'Documentos')}
      ${tile('cardapio', 'food', 'Cantina', 'Cardápio')}
      ${tile('direcao', 'shield', 'Direção', 'Abrir pedido')}
      ${tile('plataformas', 'grid', 'Plataformas', 'Acesso rápido')}
      ${tile('boletim', 'chart', 'Boletim', 'Notas')}
    </div>
    <div class="grid">
      <div class="card"><h3>Situação no ano</h3><p>${pill(p.st, p.st === 'ok' ? 'Passando' : p.st === 'warn' ? 'Em andamento' : 'Atenção')}</p><p class="muted">${esc(p.txt)}</p><p><button class="btn ghost sm" data-go="boletim">Ver boletim</button></p></div>
      <div class="card"><h3>Frequência</h3><div class="stat"><div class="ring ${fq.ok ? '' : 'bad'}" style="--p:${Math.min(fq.pct, 100)}"><b>${fmt(fq.pct)}%</b></div><div><p class="muted" style="margin:0">${fq.faltas} faltas</p><p class="muted" style="margin:0">mínimo ${FREQ_MIN}%</p></div></div></div>
      <div class="card"><h3>Advertências / ocorrências</h3><div class="big">${oc.advertencias} / ${oc.ocorrencias}</div><p class="muted">no ano letivo</p><p><button class="btn ghost sm" data-go="ocorrencias">Detalhes</button></p></div>
    </div>
    <div class="grid">
      <div class="card"><h2>Agenda da sala</h2>${ags.length ? `<ul class="list">${ags.map((a) => `<li><span><b>${esc(a.prof)}</b><br>${esc(a.txt)}</span><span class="pill">${dt(a.data)}</span></li>`).join('')}</ul>` : '<p class="muted">Nada pendente. 🎉</p>'}<p><button class="btn ghost sm" data-go="agenda">Abrir agenda</button></p></div>
      <div class="card"><h2>Cantina hoje</h2><p>${esc(DADOS.cardapio[hoje] || 'Sem cardápio hoje (fim de semana).')}</p><p><button class="btn ghost sm" data-go="cardapio">Cardápio da semana</button></p></div>
    </div>`;
  };

  V.boletim = () => {
    const r = resumoNotas(), p = passouAno();
    return `<div class="card"><h2>Resultado</h2><p>${pill(p.st, p.st === 'ok' ? 'Aprovado' : p.st === 'warn' ? 'Em andamento' : 'Atenção')} ${esc(p.txt)}</p>
      <p class="muted">Regra: soma das notas dos 4 bimestres ÷ 4 = média anual. Média mínima ${MEDIA}. Frequência mínima ${FREQ_MIN}%.</p></div>
    <div class="card tscroll"><table><thead><tr><th>Disciplina</th><th>1º</th><th>2º</th><th>3º</th><th>4º</th><th>Soma</th><th>Média</th><th>Situação</th></tr></thead><tbody>
    ${r.map((x) => `<tr><td>${esc(x.d)}</td>${x.n.map((v) => `<td>${v === null ? '–' : fmt(v)}</td>`).join('')}<td>${fmt(x.soma)}</td><td><b>${fmt(x.media)}</b></td><td>${pill(x.st, x.txt)}${x.nota ? `<br><small class="muted">${esc(x.nota)}</small>` : ''}</td></tr>`).join('')}
    </tbody></table></div>`;
  };

  V.faltas = () => {
    const fq = freqGeral();
    return `<div class="card"><h2>Frequência geral</h2><div class="big">${fmt(fq.pct)}%</div><div class="bar ${fq.ok ? '' : 'bad'}"><i style="width:${Math.min(fq.pct, 100)}%"></i></div>
      <p>${pill(fq.ok ? 'ok' : 'bad', fq.ok ? 'Frequência suficiente' : 'Abaixo de 75%')} <span class="muted">${fq.faltas} faltas em ${fq.aulas} aulas. Você pode faltar no máximo ${Math.floor(fq.aulas * 0.25)} aulas no ano (25%) — ${fq.faltas <= Math.floor(fq.aulas * 0.25) ? `restam ${Math.floor(fq.aulas * 0.25) - fq.faltas}` : 'limite ultrapassado'}.</span></p></div>
    <div class="card tscroll"><table><thead><tr><th>Disciplina</th><th>Aulas</th><th>Faltas</th><th>Frequência</th></tr></thead><tbody>
    ${Object.entries(DADOS.freq).map(([d, [a, f]]) => { const pc = a ? ((a - f) / a) * 100 : 100; return `<tr><td>${esc(d)}</td><td>${a}</td><td>${f}</td><td>${pill(pc >= FREQ_MIN ? 'ok' : 'bad', fmt(pc) + '%')}</td></tr>`; }).join('')}
    </tbody></table></div>`;
  };

  V.agenda = () => {
    const feitas = load('agendaFeita', []);
    return `<div class="card"><h2>Agenda da ${esc(DADOS.turma)}</h2><p class="muted">Recados e entregas que os professores colocam para a sua sala.</p>
    <ul class="list">${DADOS.agenda.slice().sort((a, b) => a.data.localeCompare(b.data)).map((a) => `<li class="${feitas.includes(a.id) ? 'done' : ''}"><label style="display:flex;gap:10px;align-items:flex-start;font-weight:400"><input type="checkbox" data-ag="${a.id}" ${feitas.includes(a.id) ? 'checked' : ''} style="width:auto"><span><b>${esc(a.prof)}</b> — ${esc(a.txt)}</span></label><span class="pill">${dt(a.data)}</span></li>`).join('')}</ul></div>`;
  };

  V.plataformas = () => `<div class="card"><h2>Plataformas de aprendizagem</h2><p class="muted">Acesso rápido a tudo que você usa nos estudos. Abre em nova aba.</p></div>
    <div class="links">${LINKS.plataformas.filter((p) => !p.soTecnico || CURSO).map((p) => `<a class="plat" style="--c:${esc(p.cor || '#2563eb')}" href="${esc(p.url)}" target="_blank" rel="noopener"><span class="pi">${ic(p.icone)}</span><span><b>${esc(p.nome)}</b><small>${esc(p.desc || '')}</small></span><span class="go">${ic('ext')}</span></a>`).join('')}</div>`;

  V.ocorrencias = () => {
    syncGestao(); const o = DADOS.ocorrencias;
    return `${GVIS.lista(ALUNO.ra, 'aluno', true).html}<div class="grid"><div class="card"><h3>Advertências</h3><div class="big">${o.advertencias}</div></div><div class="card"><h3>Ocorrências</h3><div class="big">${o.ocorrencias}</div></div></div>
    <div class="card"><h2>📣 Convocações da vice-direção</h2>${DADOS.convocacoes.length ? `<ul class="list">${DADOS.convocacoes.map((c) => `<li><span>${esc(c.txt)}</span><b>${dt(c.data)}</b></li>`).join('')}</ul>` : '<p class="muted">Nenhuma convocação no momento.</p>'}</div>
    <div class="card"><h2>Histórico</h2>${o.lista.length ? `<ul class="list">${o.lista.map((x) => `<li><span><b>${esc(x.tipo)}</b> — ${esc(x.txt)}</span><span class="pill">${dt(x.data)}</span></li>`).join('')}</ul>` : '<p class="muted">Nada registrado. Continue assim! 👏</p>'}</div>`;
  };

  V.cardapio = () => {
    const hoje = DIAS[new Date().getDay()], votos = load('cantinaVotos', {}), sug = load('cantinaSug', []);
    const itens = (t) => String(t).split(/,| e (?=[a-zà-ú])/i).map((x) => x.trim()).filter(Boolean);
    const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
    const dias = Object.entries(DADOS.cardapio);
    return `<section class="card hero cant-hero"><div><span class="eyebrow">Cantina · ${hoje}</span><h2>${DADOS.cardapio[hoje] ? 'O que tem hoje' : 'Sem cardápio hoje'}</h2>${DADOS.cardapio[hoje] ? `<div class="chips">${itens(DADOS.cardapio[hoje]).map((x) => `<span class="chip">${esc(cap(x))}</span>`).join('')}</div>` : '<p>Hoje a cantina não funciona (fim de semana).</p>'}</div></section>
    <div class="week">${dias.map(([d, c]) => `<article class="day ${d === hoje ? 'today' : ''}"><header><h3>${d}</h3>${d === hoje ? '<span class="pill ok">Hoje</span>' : ''}</header>
      <ul>${itens(c).map((x) => `<li>${esc(cap(x))}</li>`).join('')}</ul>
      <div class="rate" role="group" aria-label="Avaliar o cardápio de ${d}">${[['gostei', '😋', 'Gostei'], ['normal', '😐', 'Mais ou menos'], ['nao', '😕', 'Não gostei']].map(([k, e, l]) => `<button type="button" title="${l}" aria-label="${l}" data-vote="${d}|${k}" class="${votos[d] === k ? 'on' : ''}">${e}</button>`).join('')}</div></article>`).join('')}</div>
    <div class="card"><h2>Sugerir um prato</h2><p class="muted">Conte o que você gostaria de ver no cardápio.</p>
      <form class="form" data-form="cantina"><input name="m" required maxlength="120" placeholder="Ex.: mais frutas na sobremesa"><button class="btn" style="justify-self:start">${ic('send')} Enviar sugestão</button></form>
      ${sug.length ? `<ul class="list" style="margin-top:14px">${sug.slice(0, 3).map((s) => `<li><span>${esc(s.m)}</span><small class="muted">${esc(s.at)}</small></li>`).join('')}</ul>` : ''}</div>`;
  };

  V.gremio = () => {
    const msgs = load('gremio', []);
    return `<div class="card"><h2>Fale com o Grêmio Estudantil</h2><p class="muted">Sugestões, pedidos de ajuda e ideias para eventos.</p>
    <form class="form" data-form="gremio"><label>Assunto<select name="as"><option>Sugestão</option><option>Pedido de ajuda</option><option>Evento / festa</option><option>Outro</option></select></label>
    <label>Mensagem<textarea name="m" rows="4" required maxlength="800"></textarea></label><button class="btn">Enviar ao Grêmio</button></form></div>
    ${msgs.length ? `<div class="card"><h3>Enviadas</h3><ul class="list">${msgs.map((m) => `<li><span><b>${esc(m.as)}</b> — ${esc(m.m)}</span><small>${esc(m.at)}</small></li>`).join('')}</ul></div>` : ''}`;
  };

  function avisosGremio() {
    const av = shLoad('avisos').slice(0, 3);
    return av.length ? `<div class="card"><h2>🤝 Avisos do Grêmio</h2><ul class="list">${av.map((a) => `<li><span><b>${esc(a.t)}</b><br>${esc(a.m)}</span><small>${esc(a.at)}</small></li>`).join('')}</ul></div>` : '';
  }

  V.tecnico = () => {
    const r = resumoNotas().filter((x) => CURSO.modulos.includes(x.d));
    return `<div class="card"><h2>💼 ${esc(CURSO.nome)}</h2>
      <ul class="list"><li><span>Instituição</span><b>${esc(CURSO.inst)}</b></li><li><span>Local das aulas técnicas</span><b>${esc(CURSO.local)}</b></li><li><span>Rotina</span><b>${esc(CURSO.dias)}</b></li><li><span>Sua turma</span><b>${esc(DADOS.turma)}</b></li></ul></div>
    <div class="card tscroll"><h2>Módulos do curso</h2><table><thead><tr><th>Módulo</th><th>Média até agora</th><th>Situação</th></tr></thead><tbody>
    ${r.map((x) => `<tr><td>${esc(x.d)}</td><td><b>${fmt(x.media)}</b></td><td>${pill(x.st, x.txt)}</td></tr>`).join('')}</tbody></table>
    <p class="muted">As notas dos módulos também aparecem no boletim.</p></div>`;
  };

  V['gremio-adm'] = () => {
    const inbox = shLoad('inbox'), av = shLoad('avisos');
    return `<div class="card hero"><div><h2>⭐ Painel do Grêmio</h2><p>Você é <b>${esc(ALUNO.gremio)}</b>. Só membros do Grêmio veem esta área.</p></div></div>
    <div class="card"><h2>Publicar aviso para todos os alunos</h2>
    <form class="form" data-form="aviso"><label>Título<input name="t" required maxlength="80"></label>
    <label>Mensagem<textarea name="m" rows="3" required maxlength="500"></textarea></label><button class="btn">Publicar aviso</button></form></div>
    <div class="card"><h3>Avisos publicados</h3>${av.length ? `<ul class="list">${av.map((a, i) => `<li><span><b>${esc(a.t)}</b> — ${esc(a.m)}<br><small class="muted">${esc(a.por)} · ${esc(a.at)}</small></span><button class="btn ghost" data-delaviso="${i}">Apagar</button></li>`).join('')}</ul>` : '<p class="muted">Nenhum aviso ainda.</p>'}</div>
    <div class="card"><h3>Caixa de entrada (mensagens dos alunos)</h3>${inbox.length ? `<ul class="list">${inbox.map((m) => `<li><span><b>${esc(m.as)}</b> — ${esc(m.m)}<br><small class="muted">${esc(m.de)} · ${esc(m.turma)}</small></span><small>${esc(m.at)}</small></li>`).join('')}</ul>` : '<p class="muted">Nenhuma mensagem recebida.</p>'}</div>`;
  };

  const DIR_TIPOS = [
    ['Agendar conversa', 'calendar', 'Pedir um horário com a direção'],
    ['Relato confidencial', 'shield', 'Bullying, violência ou situação grave'],
    ['Estrutura / manutenção', 'alert', 'Algo quebrado ou perigoso na escola'],
    ['Segurança', 'user', 'Pessoas ou situações suspeitas'],
    ['Elogio ou ideia', 'star', 'Sugestão para melhorar a escola'],
    ['Outro assunto', 'paper', 'Qualquer outro pedido'],
  ];
  const dirSt = { enviado: ['warn', 'Enviado'], analise: ['warn', 'Em análise'], respondido: ['ok', 'Respondido'] };
  V.direcao = () => {
    const env = load('direcao', []).filter((m) => m.proto);
    return `<section class="card hero dir-hero"><div><span class="eyebrow">Canal oficial</span><h2>Abrir pedido à direção</h2><p>Tudo vira um protocolo que você acompanha aqui. Relatos são confidenciais e só a direção tem acesso.</p></div></section>
    <form class="card form" style="max-width:none" data-form="direcao" id="dirForm"><h2>Novo pedido</h2>
      <div class="types">${DIR_TIPOS.map(([t, i, d], k) => `<label class="docopt"><input type="radio" name="tipo" value="${esc(t)}" ${k === 0 ? 'checked' : ''}><div><span class="di">${ic(i)}</span><span><b>${esc(t)}</b><small>${esc(d)}</small></span></div></label>`).join('')}</div>
      <div class="fields" id="dirAgenda"><label>Data preferida<input type="date" name="data" min="${new Date().toISOString().slice(0, 10)}"></label>
        <label>Período<select name="periodo"><option>Manhã</option><option>Tarde</option></select></label></div>
      <label>Urgência<div class="seg"><label><input type="radio" name="urg" value="Normal" checked><span>Normal</span></label><label><input type="radio" name="urg" value="Importante"><span>Importante</span></label><label><input type="radio" name="urg" value="Urgente"><span>Urgente</span></label></div></label>
      <label>Descreva o pedido<textarea name="m" rows="4" required maxlength="1500" placeholder="Conte com detalhes o que aconteceu ou o que você precisa"></textarea></label>
      <label>Vídeo ou foto (opcional)<input type="file" name="v" accept="video/*,image/*"></label>
      <label class="switch"><input type="checkbox" name="anon"><span>Enviar de forma anônima<small>A direção não verá seu nome neste pedido.</small></span></label>
      <button class="btn" style="justify-self:start">${ic('send')} Enviar pedido</button>
      <p class="muted">Protótipo: o arquivo anexado ainda não é enviado a nenhum servidor — só o registro fica salvo neste aparelho.</p></form>
    <div class="card"><h2>Meus pedidos</h2>${env.length ? `<div class="grid" style="grid-template-columns:1fr">${env.map((m) => `<div class="req"><div class="req-top"><span><b>${esc(m.tipo)}</b> ${pill(...dirSt[m.st || 'enviado'])} ${m.urg && m.urg !== 'Normal' ? pill('bad', m.urg) : ''}<br><span class="muted">${esc(m.m)}</span>${m.data ? `<br><small class="muted">Data preferida: ${dt(m.data)} · ${esc(m.periodo)}</small>` : ''}${m.v ? `<br><small class="muted">Anexo: ${esc(m.v)}</small>` : ''}</span><code>${esc(m.proto)}</code></div>
      <div class="tl tl4">${['Enviado', 'Em análise', 'Respondido'].map((s, i) => `<div class="${i <= ['enviado', 'analise', 'respondido'].indexOf(m.st || 'enviado') ? 'on' : ''}">${s}</div>`).join('')}</div>
      <div><small class="muted">${esc(m.at)}${m.anon ? ' · anônimo' : ''}</small>${m.st !== 'respondido' ? ` <button class="btn ghost sm" data-dir="${m.id}" title="Só no protótipo">Simular andamento</button>` : ''}</div></div>`).join('')}</div>` : '<p class="muted">Você ainda não abriu nenhum pedido.</p>'}</div>`;
  };

  const DOCS = [
    ['Declaração de matrícula', 'file', 'Pronta em até 2 dias úteis'],
    ['Declaração de comparecimento', 'check', 'Pronta em até 2 dias úteis'],
    ['Histórico escolar', 'book', 'Até 5 dias úteis'],
    ['Boletim / ficha individual', 'chart', 'Até 2 dias úteis'],
    ['Declaração de transferência', 'paper', 'Até 5 dias úteis'],
    ['Outro documento', 'plus', 'Diga qual na observação'],
  ];
  const stat = { pedido: ['warn', 'Solicitado'], analise: ['warn', 'Em preparo'], pronto: ['ok', 'Pronto para baixar'] };
  V.secretaria = () => {
    const s = DADOS.secretaria, ped = load('pedidos', []);
    const idx = { pedido: 0, analise: 1, pronto: 2 };
    return `<section class="card hero sec-hero"><div><span class="eyebrow">Secretaria digital</span><h2>Documentos sem fila</h2><p>Peça pela plataforma, acompanhe cada etapa e baixe quando estiver pronto.</p>
      <div class="steps-row"><span>${ic('plus')} Solicitar</span><span>${ic('clock')} Acompanhar</span><span>${ic('download')} Baixar</span></div></div>
      <button class="btn" data-prof="Secretaria">${ic('chat')} Falar com a secretaria</button></section>
    <form class="card form" style="max-width:none" data-form="pedido"><h2>Solicitar documento</h2>
      <div class="docs">${DOCS.map(([n, i, d], k) => `<label class="docopt"><input type="radio" name="doc" value="${esc(n)}" ${k === 0 ? 'checked' : ''}><div><span class="di">${ic(i)}</span><span><b>${esc(n)}</b><small>${esc(d)}</small></span></div></label>`).join('')}</div>
      <div class="fields"><label>Como quer receber?<select name="entrega"><option>Digital (baixar aqui)</option><option>Retirar na secretaria</option></select></label>
      <label>Observação (opcional)<input name="obs" maxlength="200" placeholder="Ex.: preciso para o estágio"></label></div>
      <button class="btn" style="justify-self:start">${ic('send')} Solicitar documento</button></form>
    <div class="card"><h2>Meus pedidos</h2>${ped.length ? `<div class="grid" style="grid-template-columns:1fr">${ped.map((p) => `<div class="req"><div class="req-top"><span><b>${esc(p.doc)}</b> ${pill(...stat[p.st])}<br><small class="muted">${p.obs ? esc(p.obs) + ' · ' : ''}${esc(p.entrega || 'Digital (baixar aqui)')} · ${esc(p.at)}</small></span><code>${proto('SEC', p.id)}</code></div>
      <div class="tl">${['Solicitado', 'Em preparo', 'Pronto'].map((x, i) => `<div class="${i <= idx[p.st] ? 'on' : ''}">${x}</div>`).join('')}</div>
      <div>${p.st === 'pronto' ? `<button class="btn sm" data-baixar="${p.id}">${ic('download')} Baixar</button>` : `<button class="btn ghost sm" data-demo="${p.id}" title="Só no protótipo">Simular andamento</button>`}</div></div>`).join('')}</div>` : '<p class="muted">Você ainda não pediu nenhum documento.</p>'}</div>
    <div class="card"><h2>Atendimento presencial e contatos</h2><div class="grid">
      <div class="contact"><span class="ci">${ic('phone')}</span><span><b>${esc(s.tel)}</b><small>Telefone</small></span></div>
      <div class="contact"><span class="ci">${ic('chat')}</span><span><b>${esc(s.whats)}</b><small>WhatsApp</small></span></div>
      <div class="contact"><span class="ci">${ic('mail')}</span><span><b>${esc(s.email)}</b><small>E-mail</small></span></div>
      <div class="contact"><span class="ci">${ic('clock')}</span><span><b>${esc(s.horario)}</b><small>Horário</small></span></div>
      <div class="contact"><span class="ci">${ic('pin')}</span><span><b>${esc(s.local)}</b><small>Local</small></span></div></div></div>`;
  };

  let chatSel = DADOS.professores[0].id, chatOpen = false;
  const avatarContato = (p, cls = '') => p.id === 'Direção' ? `<span class="cav ${cls}" style="background:linear-gradient(135deg,#312e81,#4f46e5)">${ic('shield')}</span>`
    : p.id === 'Secretaria' ? `<span class="cav ${cls}" style="background:linear-gradient(135deg,#0369a1,#06b6d4)">${ic('folder')}</span>`
    : `<span class="cav ${cls}" style="background:linear-gradient(135deg,${corDe(p.id)},color-mix(in srgb,${corDe(p.id)} 55%,#0b1240))">${esc(iniciais(p.id))}</span>`;
  function chatLista(q = '') {
    const all = load('chat', {});
    const ult = (id) => { const l = all[id] || []; return l[l.length - 1]; };
    return DADOS.professores.filter((p) => !q || `${p.nome} ${p.disc}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => ((ult(b.id) || {}).ts || 0) - ((ult(a.id) || {}).ts || 0))
      .map((p) => { const u = ult(p.id); return `<button class="citem ${p.id === chatSel ? 'on' : ''}" data-prof="${esc(p.id)}">${avatarContato(p)}<span class="cbody"><span class="crow"><b>${esc(p.nome)}</b><span class="ctime">${u ? horaCurta(u.ts) : ''}</span></span><span class="cprev">${u ? 'Você: ' + esc(u.t) : esc(p.disc)}</span></span></button>`; }).join('')
      || '<p class="muted" style="padding:12px">Nenhum contato encontrado.</p>';
  }
  V.chat = () => {
    const all = load('chat', {}), rs = (() => { try { return JSON.parse(localStorage.getItem('colombo.doc.resp.v1')) || []; } catch { return []; } })().filter((r) => r.ra === RA && r.disc === chatSel).map((r) => ({ t: r.t, ts: r.ts, prof: true })), c = (all[chatSel] || []).concat(rs).sort((x, y) => (x.ts || 0) - (y.ts || 0));
    const prof = DADOS.professores.find((p) => p.id === chatSel);
    let ultDia = '';
    const corpo = c.length ? c.map((m) => {
      const dia = m.ts ? diaLongo(m.ts) : '', sep = dia && dia !== ultDia ? `<div class="dsep">${dia}</div>` : ''; ultDia = dia || ultDia;
      return `${sep}<div class="msg${m.prof ? '' : ' me'}">${esc(m.t)}<time>${m.ts ? new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : esc(m.at)} ${m.prof ? '' : ic('checks')}</time></div>`;
    }).join('') : `<div class="empty-chat">${avatarContato(prof)}<b>${esc(prof.nome)}</b><p>Nenhuma mensagem ainda. Mande sua dúvida — ela fica registrada aqui.</p></div>`;
    return `<div class="card chat ${chatOpen ? 'show-room' : ''}" id="chatBox"><aside class="contacts"><div class="csearch">${ic('search')}<input id="csearch" type="search" placeholder="Buscar professor ou setor" autocomplete="off" aria-label="Buscar contato"></div><div class="clist" id="clist">${chatLista()}</div></aside>
    <section class="room"><div class="room-head"><button class="rback" data-chatback aria-label="Voltar">${ic('back')}</button>${avatarContato(prof, 'sm')}<div><b>${esc(prof.nome)}</b><small>${esc(prof.disc)}</small></div></div>
    <div class="msgs" id="msgs">${corpo}</div>
    <form class="composer" data-form="chat"><input name="t" placeholder="Escreva uma mensagem…" autocomplete="off" maxlength="500" required aria-label="Mensagem"><button class="send" aria-label="Enviar">${ic('send')}</button></form></section></div>`;
  };

  V.dados = () => {
    const d = { ...DADOS.dados, nome: nome(), ...load('dados', {}) };
    const f = (k, l, extra = '') => `<label>${l}<input name="${k}" value="${esc(d[k])}" ${extra}></label>`;
    const pic = load('foto', '');
    return `<div class="card"><h2>Foto de perfil</h2><div class="profile-pic"><img class="avatar" id="avatarBig" src="${esc(pic || defaultAvatar())}" alt="Sua foto"><div><div class="row-btns"><button class="btn" data-foto>${ic('camera')} Alterar foto</button>${pic ? `<button class="btn ghost" data-foto-remover>Remover</button>` : ''}</div><p class="muted">Você também pode clicar na sua foto, no canto de cima da tela.</p></div></div></div>
    <form class="card form" style="max-width:none" data-form="dados"><h2>Dados do aluno</h2>
      <div class="fields">${f('nome', 'Nome completo')}${f('nascimento', 'Nascimento', 'type="date"')}${f('rg', 'RG')}${f('cpf', 'CPF', 'inputmode="numeric"')}${f('endereco', 'Endereço')}${f('bairro', 'Bairro')}${f('cidade', 'Cidade')}${f('tel', 'Seu telefone', 'type="tel"')}${f('email', 'E-mail', 'type="email"')}</div>
      <h2>Contatos dos responsáveis</h2><div class="fields">${f('mae', 'Nome da mãe / responsável')}${f('pai', 'Nome do pai / responsável')}${f('respTel', 'Telefone dos responsáveis', 'type="tel"')}</div>
      <button class="btn" style="justify-self:start">Salvar dados</button></form>`;
  };

  V.config = () => {
    const t = load('tema', 'claro');
    return `<div class="card"><h2>Aparência</h2><div class="themes">${[['escuro', 'Azul escuro', '#0d1233'], ['claro', 'Azul claro', '#e9f0ff'], ['branco', 'Branco', '#ffffff']].map(([k, l, c]) => `<button data-tema="${k}" class="${t === k ? 'on' : ''}"><span class="sw" style="background:${c}"></span>${l}</button>`).join('')}</div></div>
    <div class="card"><h2>Foto de perfil</h2><button class="btn" data-foto>${ic('camera')} Alterar foto</button></div>`;
  };

  /* ---------- núcleo ---------- */
  const TITULOS = { tecnico: 'Meu curso técnico', 'gremio-adm': 'Painel do Grêmio', inicio: 'Início', chat: 'Chat com professores', boletim: 'Boletim', faltas: 'Faltas e frequência', agenda: 'Agenda da sala', plataformas: 'Plataformas de aprendizagem', ocorrencias: 'Advertências e avisos', cardapio: 'Cantina', gremio: 'Grêmio estudantil', secretaria: 'Secretaria', direcao: 'Direção', dados: 'Meus dados', config: 'Configurações' };
  const NAV = [['inicio', 'home', 'Início'], ['chat', 'chat', 'Chat com professores'], ['boletim', 'chart', 'Boletim'], ['faltas', 'calendar', 'Faltas e frequência'], ['agenda', 'pin', 'Agenda da sala'], ['plataformas', 'grid', 'Plataformas'], ['ocorrencias', 'alert', 'Advertências e avisos'], ['cardapio', 'food', 'Cantina'], ['gremio', 'users', 'Grêmio estudantil'], ['secretaria', 'folder', 'Secretaria'], ['direcao', 'shield', 'Direção'], ['dados', 'id', 'Meus dados'], ['config', 'cog', 'Configurações']];

  function baixar(p) {
    if (!p) return;
    const dd = { nome: nome(), ...load('dados', {}) };
    const hoje = new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' });
    const html = `<!doctype html><meta charset="utf-8"><title>${esc(p.doc)}</title><body style="font-family:Georgia,serif;max-width:700px;margin:60px auto;line-height:1.7"><h2 style="text-align:center">E.E. Colombo de Almeida</h2><h3 style="text-align:center">${esc(p.doc).toUpperCase()}</h3><p>Declaramos, para os devidos fins, que <b>${esc(dd.nome === 'aluno' ? 'Aluno(a)' : dd.nome)}</b>, RA ${esc(String(sess.who).replace(/^RA\s*/i, ''))}, turma ${esc(DADOS.turma)}, é aluno(a) regularmente matriculado(a) nesta unidade escolar.</p><p style="margin-top:60px">${hoje}.</p><p style="margin-top:60px;text-align:center">______________________<br>Secretaria</p><p style="color:#999;font-size:12px">Modelo de demonstração do protótipo.</p><script>print()<\/script>`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); a.download = p.doc.replace(/\W+/g, '-') + '.html'; a.click();
  }
  function nome() { return (load('dados', {}).nome || ALUNO.nome || '').split(' ')[0] || 'aluno'; }
  function defaultAvatar() {
    const i = (nome()[0] || 'A').toUpperCase();
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d4fe0"/><stop offset="1" stop-color="#38bdf8"/></linearGradient></defs><rect width="80" height="80" fill="url(#g)"/><text x="40" y="53" font-size="38" text-anchor="middle" fill="#fff" font-family="Arial">${i}</text></svg>`);
  }
  const setTema = (t) => { document.documentElement.dataset.theme = t; };
  const refreshHeader = () => {
    const rotulo = nome() === 'aluno' ? `RA ${String(sess.who || '').replace(/^RA\s*/i, '')}` : nome();
    const foto = load('foto', '') || defaultAvatar();
    $('#whoName').textContent = rotulo; $('#menuName').textContent = rotulo; $('#menuSub').textContent = DADOS.turma;
    $('#avatarTop').src = foto; $('#avatarMenu').src = foto;
    const big = $('#avatarBig'); if (big) big.src = foto;
    $('#mRemover').hidden = !load('foto', '');
  };

  /* ---------- foto de perfil (fica só neste navegador) ---------- */
  function trocarFoto(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) return toast('Escolha um arquivo de imagem.');
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const s = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 256, 256);
      URL.revokeObjectURL(url);
      if (!save('foto', c.toDataURL('image/jpeg', 0.85))) return toast('Não foi possível guardar a foto neste aparelho.');
      refreshHeader(); if (cur === 'dados') go('dados'); toast('Foto atualizada!');
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast('Não consegui abrir essa imagem.'); };
    img.src = url;
  }
  const removerFoto = () => { try { localStorage.removeItem(K('foto')); } catch { /* ignora */ } refreshHeader(); if (cur === 'dados') go('dados'); toast('Foto removida.'); };
  const menu = $('#profileMenu'), whoBtn = $('#whoBtn');
  const toggleMenu = (open) => { menu.hidden = !open; whoBtn.setAttribute('aria-expanded', String(open)); };
  const sair = () => { session.end(); location.href = 'aluno.html'; };

  let cur = 'inicio';
  function go(v) {
    cur = v;
    $('#title').textContent = TITULOS[v];
    $$('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.view === v));
    $('#content').innerHTML = V[v]();
    $('#side').classList.remove('open');
    toggleMenu(false);
    if (v !== 'chat') window.scrollTo(0, 0);
    const m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight;
    syncDir();
  }
  function syncDir() { const f = $('#dirForm'); if (f) { const ag = $('#dirAgenda'); ag.hidden = f.elements.tipo.value !== 'Agendar conversa'; } }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.who')) toggleMenu(false);
    if (e.target.closest('#whoBtn')) return toggleMenu(menu.hidden);
    if (e.target.closest('#mFoto, [data-foto]')) { toggleMenu(false); return $('#fotoInput').click(); }
    if (e.target.closest('#mRemover, [data-foto-remover]')) return removerFoto();
    if (e.target.closest('#mSair')) return sair();
    const g = e.target.closest('[data-view],[data-go]');
    if (g) return go(g.dataset.view || g.dataset.go);
    const p = e.target.closest('[data-prof]'); if (p) { chatSel = p.dataset.prof; chatOpen = true; return go('chat'); }
    if (e.target.closest('[data-chatback]')) { chatOpen = false; return go('chat'); }
    const dm = e.target.closest('[data-demo]'); if (dm) { const nx = { pedido: 'analise', analise: 'pronto' }; save('pedidos', load('pedidos', []).map((x) => (x.id == dm.dataset.demo ? { ...x, st: nx[x.st] || x.st } : x))); toast('Andamento atualizado (simulação).'); return go('secretaria'); }
    const dr = e.target.closest('[data-dir]'); if (dr) { const nx = { enviado: 'analise', analise: 'respondido' }; save('direcao', load('direcao', []).map((x) => (x.id == dr.dataset.dir ? { ...x, st: nx[x.st || 'enviado'] } : x))); toast('Andamento atualizado (simulação).'); return go('direcao'); }
    const vt = e.target.closest('[data-vote]'); if (vt) { const [d, k] = vt.dataset.vote.split('|'), v = load('cantinaVotos', {}); v[d] = v[d] === k ? undefined : k; save('cantinaVotos', v); return go('cardapio'); }
    const da = e.target.closest('[data-delaviso]'); if (da) { shSave('avisos', shLoad('avisos').filter((_, i) => i !== Number(da.dataset.delaviso))); return go('gremio-adm'); }
    const bx = e.target.closest('[data-baixar]'); if (bx) return baixar(load('pedidos', []).find((x) => x.id == bx.dataset.baixar));
    const t = e.target.closest('[data-tema]'); if (t) { save('tema', t.dataset.tema); setTema(t.dataset.tema); return go('config'); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(false); });
  document.addEventListener('input', (e) => { if (e.target.id === 'csearch') $('#clist').innerHTML = chatLista(e.target.value.trim()); });
  document.addEventListener('change', (e) => {
    if (e.target.dataset.ag) {
      const id = Number(e.target.dataset.ag), l = new Set(load('agendaFeita', []));
      e.target.checked ? l.add(id) : l.delete(id); save('agendaFeita', [...l]); go('agenda');
    }
    if (e.target.id === 'fotoInput') { trocarFoto(e.target.files[0]); e.target.value = ''; }
    if (e.target.name === 'tipo') syncDir();
  });
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-form]'); if (!form) return;
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form)); const ts = Date.now(), at = new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    switch (form.dataset.form) {
      case 'chat': { const all = load('chat', {}); (all[chatSel] ||= []).push({ t: d.t, at, ts }); save('chat', all); go('chat'); const i = $('.composer input'); if (i) i.focus(); return; }
      case 'gremio': save('gremio', [{ as: d.as, m: d.m, at }, ...load('gremio', [])]); shSave('inbox', [{ as: d.as, m: d.m, at, de: nome(), turma: DADOS.turma }, ...shLoad('inbox')]); toast('Mensagem enviada ao Grêmio!'); return go('gremio');
      case 'aviso': shSave('avisos', [{ t: d.t, m: d.m, at, por: `${nome()} (${ALUNO.gremio})` }, ...shLoad('avisos')]); toast('Aviso publicado!'); return go('gremio-adm');
      case 'direcao': { const ag = d.tipo === 'Agendar conversa'; save('direcao', [{ id: ts, proto: proto('DIR', ts), st: 'enviado', tipo: d.tipo, urg: d.urg, m: d.m, v: d.v && d.v.name, anon: !!d.anon, data: ag ? d.data : '', periodo: d.periodo, at }, ...load('direcao', [])]); toast(`Pedido ${proto('DIR', ts)} enviado.`); return go('direcao'); }
      case 'pedido': save('pedidos', [{ id: ts, doc: d.doc, obs: d.obs, entrega: d.entrega, st: 'pedido', at }, ...load('pedidos', [])]); toast(`Pedido ${proto('SEC', ts)} enviado à secretaria!`); return go('secretaria');
      case 'cantina': save('cantinaSug', [{ m: d.m, at }, ...load('cantinaSug', [])]); toast('Sugestão enviada. Obrigado!'); return go('cardapio');
      case 'dados': save('dados', d); refreshHeader(); toast('Dados salvos!'); return;
    }
  });

  $('#burger').innerHTML = '<svg class="ic" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  $('#burger').onclick = () => $('#side').classList.toggle('open');
  $('#scrim').onclick = () => $('#side').classList.remove('open');
  $('#logout').innerHTML = `${ic('logout')} Sair da conta`; $('#logout').onclick = sair;
  $('#camBadge').innerHTML = ic('camera');
  $('#mFoto').innerHTML = `${ic('camera')} Alterar foto de perfil`;
  $('#mRemover').innerHTML = `${ic('trash')} Remover foto`;
  $('#mDados').innerHTML = `${ic('id')} Meus dados`;
  $('#mConfig').innerHTML = `${ic('cog')} Configurações`;
  $('#mSair').innerHTML = `${ic('logout')} Sair do app`;

  /* ---------- Educação especial: modo de acesso fácil ---------- */
  const CH = 'colombo.chamados.v1';
  const chamar = (o) => { let l = []; try { l = JSON.parse(localStorage.getItem(CH)) || []; } catch { /* ignora */ } l.unshift({ id: Date.now().toString(36), st: 'aberto', por: `${nome()} (${DADOS.turma})`, sala: DADOS.turma, at: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }), ...o }); try { localStorage.setItem(CH, JSON.stringify(l)); } catch { /* ignora */ } };
  const FACIL = load('facil', false);
  if (FACIL) document.body.classList.add('facil');
  const REC = [['Segunda', '8h', 'Leitura com apoio'], ['Quarta', '9h', 'Matemática com material concreto'], ['Sexta', '8h', 'Comunicação e jogos']];
  const ATV = ['Montar o nome com letras móveis', 'Contar e agrupar objetos até 10', 'Cartão de rotina do dia'];
  const ler = (t) => `data-ler="${esc(t)}"`;
  V.atendimento = () => {
    const feitas = load('atvOk', []);
    return `<div class="card hero"><div><h2>Atendimento</h2><p>Toque em um botão. Toque em 🔊 para eu ler.</p></div></div>
    <button class="fbig sos" data-sos>🆘<b>Preciso de ajuda</b><small>Avisa a cuidadora agora</small></button>
    <div class="card"><h2>🏫 Sala de recursos <button class="btn ghost" ${ler('Sala de recursos. ' + REC.map((r) => r.join(', ')).join('. '))}>🔊</button></h2><ul class="list">${REC.map((r) => `<li><span>📅 ${r[0]} · ${r[1]}</span><b>${r[2]}</b></li>`).join('')}</ul></div>
    <div class="card"><h2>✏️ Atividades adaptadas</h2><ul class="list">${ATV.map((a, i) => `<li><span>${feitas.includes(i) ? '✅' : '⬜'} ${a}</span><button class="btn ghost" ${ler(a)}>🔊</button><button class="btn" data-atv="${i}">${feitas.includes(i) ? 'Desfazer' : 'Fiz!'}</button></li>`).join('')}</ul></div>
    <div class="card"><h2>🤝 Minha cuidadora</h2><p>Cuidadora Marta · fica comigo nas aulas e no intervalo.</p><button class="btn" data-sos>Chamar a cuidadora</button></div>`;
  };
  const rep = /^Representante/.test(ALUNO.gremio || '');
  V.chamados = () => `<div class="card"><h2>Chamar a equipe da escola</h2><p class="muted">Representante de sala: peça ajuda para a sua turma. A tia da equipe vê e assume o chamado.</p>
    <form class="form" data-form="chamado"><label>O que precisa?<select name="tp"><option value="Sala suja|limpeza">Sala suja</option><option value="Emprestar pano|limpeza">Emprestar pano</option><option value="Falta papel / sabonete|limpeza">Falta papel / sabonete</option><option value="Carteira ou porta quebrada|corredor">Carteira ou porta quebrada</option></select></label><label>Observação<input name="obs" maxlength="120"></label><button class="btn">Chamar</button></form></div>`;
  const _cfg = V.config; V.config = () => `${_cfg()}<div class="card"><h2>Educação especial</h2><p class="muted">Letras grandes, botões com figuras e leitura em voz alta, mais a tela de Atendimento.</p><button class="btn${FACIL ? ' ghost' : ''}" data-facil>${FACIL ? 'Desativar modo de acesso fácil' : 'Ativar modo de acesso fácil'}</button></div>`;
  const _gad = V['gremio-adm']; V['gremio-adm'] = () => `${_gad()}<div class="card"><h2>Rede do Grêmio</h2><p class="muted">Feed, chat, tarefas, finanças e atas.</p><a class="btn" href="gremio.html">Abrir a rede do Grêmio</a></div>`;
  TITULOS.atendimento = 'Atendimento'; TITULOS.chamados = 'Chamados à equipe';
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-sos],[data-ler],[data-atv],[data-facil]'); if (!t) return;
    if (t.dataset.sos !== undefined) { chamar({ tipo: 'Preciso de ajuda', alvo: 'cuidadora', urg: 1 }); toast('A cuidadora foi avisada! 💙'); if (navigator.vibrate) navigator.vibrate(200); }
    if (t.dataset.ler) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t.dataset.ler); u.lang = 'pt-BR'; u.rate = 0.9; speechSynthesis.speak(u); } catch { toast('Leitura em voz alta indisponível.'); } }
    if (t.dataset.atv !== undefined) { const f = load('atvOk', []), i = Number(t.dataset.atv); save('atvOk', f.includes(i) ? f.filter((x) => x !== i) : [...f, i]); go('atendimento'); }
    if (t.dataset.facil !== undefined) { save('facil', !FACIL); location.reload(); }
  });
  document.addEventListener('submit', (e) => { const f = e.target.closest('[data-form="chamado"]'); if (!f) return; e.preventDefault(); const [tipo, alvo] = new FormData(f).get('tp').split('|'); chamar({ tipo, alvo, obs: new FormData(f).get('obs') }); toast('Chamado enviado à equipe!'); go('chamados'); });

  /* menu muda conforme o perfil do aluno */
  const itens = NAV.slice();
  if (CURSO) itens.splice(itens.findIndex((n) => n[0] === 'boletim') + 1, 0, ['tecnico', 'brief', 'Meu curso técnico']);
  if (ALUNO.gremio) itens.splice(itens.findIndex((n) => n[0] === 'gremio') + 1, 0, ['gremio-adm', 'star', 'Painel do Grêmio']);
  if (FACIL) itens.splice(1, 0, ['atendimento', 'users', 'Atendimento']);
  if (rep) itens.splice(itens.findIndex((n) => n[0] === 'gremio') + 1, 0, ['chamados', 'alert', 'Chamar a equipe']);
  $('#nav').innerHTML = itens.map(([v, i, l]) => `<button data-view="${v}">${ic(i)}<span>${l}</span></button>`).join('');
  $('#sideSub').textContent = `Área do aluno · ${TURMAS.segLabel(ALUNO)}`;

  setTema(load('tema', 'claro'));
  refreshHeader();
  go('inicio');
})();
