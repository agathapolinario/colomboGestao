/* Grêmio como rede social: feed, chat por canais, tarefas por cargo, finanças e atas. */
(() => {
  const { esc, ld, sv, now, toast, $, id } = E;
  const s = Colombo.session.get();
  if (!s) { location.replace('index.html'); return; }

  /* ---------- quem é você aqui ---------- */
  const NOMES = { presidente: 'Presidente / Vice', orientador: 'Professor orientador', vice: 'Vice-diretor(a)', tesoureiro: 'Tesoureiro(a)', secretaria: 'Secretário(a)', rep: 'Representante de sala' };
  const kDe = (c) => (/^(Presidente|Vice)/.test(c) ? 'presidente' : /^Tesoureiro/.test(c) ? 'tesoureiro' : /^Secret/.test(c) ? 'secretaria' : /^Representante/.test(c) ? 'rep' : 'membro');
  let base = null;
  if (s.role === 'aluno') { const a = TURMAS.porRA(String(s.who).replace(/\D/g, '')); if (a && a.gremio) base = { k: kDe(a.gremio), nome: a.nome || a.gremio, cargo: a.gremio }; }
  else if (s.role === 'professor') base = { k: 'orientador', nome: s.who, cargo: 'Professor orientador' };
  else if (s.role === 'gestao') base = { k: 'vice', nome: s.who, cargo: 'Vice-diretor(a)' };
  if (!base) { document.body.innerHTML = '<div class="w"><div class="c"><h2>Acesso restrito</h2><p>Esta área é do Grêmio, do professor orientador e da vice-direção.</p><a class="b" href="index.html">Voltar</a></div></div>'; return; }
  const demo = sessionStorage.getItem('gr_as'); // "ver como" (teste do protótipo)
  const me = demo ? { k: demo, nome: NOMES[demo], cargo: NOMES[demo] } : base;
  const k = me.k, any = (...l) => l.includes(k);
  const P = { mod: any('presidente', 'orientador', 'vice'), tarefa: any('presidente'), finEd: any('tesoureiro'), finVer: any('tesoureiro', 'presidente', 'orientador', 'vice'), finOk: any('orientador', 'vice'), ataEd: any('secretaria'), supervisor: any('orientador', 'vice') };
  const CANAIS = { geral: 1, eventos: 1, diretoria: any('presidente', 'secretaria', 'tesoureiro', 'orientador', 'vice'), tesouraria: any('tesoureiro', 'presidente', 'orientador', 'vice') };

  /* ---------- dados de exemplo (só na primeira vez) ---------- */
  if (!ld('gr_feed', null)) {
    sv('gr_feed', [{ id: id(), por: 'Presidente', cargo: 'Presidente', t: 'Bem-vindos à rede do Grêmio! 🎉', x: 'Aqui saem os avisos, as tarefas e as decisões. Participem!', at: now(), likes: [], coms: [] }]);
    sv('gr_tasks', [{ id: id(), t: 'Fechar o orçamento da festa junina', alvo: 'tesoureiro', prazo: '2026-10-30', ok: false }, { id: id(), t: 'Redigir a ata da reunião de outubro', alvo: 'secretaria', prazo: '2026-10-23', ok: false }, { id: id(), t: 'Coletar sugestões da sua sala', alvo: 'rep', prazo: '2026-10-25', ok: false }]);
    sv('gr_fin', [{ id: id(), tipo: 'entrada', d: 'Venda de rifas', v: 320, data: '2026-10-05', apr: true }, { id: id(), tipo: 'saida', d: 'Material para cartazes', v: 85.5, data: '2026-10-09', apr: false }]);
    sv('gr_atas', [{ id: id(), title: 'Reunião de outubro', data: '2026-10-08', ciente: [], blocks: [{ t: 'h', x: 'Pauta' }, { t: 'li', x: 'Festa junina' }, { t: 'li', x: 'Campeonato interclasses' }, { t: 'todo', x: 'Definir data da festa', ok: false }] }]);
  }
  const R = { feed: () => ld('gr_feed', []), tasks: () => ld('gr_tasks', []), fin: () => ld('gr_fin', []), atas: () => ld('gr_atas', []), chat: () => ld('gr_chat', {}) };
  const money = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const autor = { por: me.nome, cargo: me.cargo };
  let tab = 'feed', canal = 'geral', ata = null;

  /* ---------- telas ---------- */
  const V = {
    feed: () => `<div class="c"><form data-f="post"><input name="t" placeholder="Título" required maxlength="80"><textarea name="x" rows="2" placeholder="Compartilhe algo com o Grêmio…" required maxlength="500"></textarea><button>Publicar</button></form></div>` +
      R.feed().map((p) => `<div class="c"><b>${esc(p.t)}</b><p>${esc(p.x)}</p><small class="m">${esc(p.por)} · ${esc(p.cargo)} · ${esc(p.at)}</small>
        <div class="r" style="margin-top:8px"><button class="g" data-like="${p.id}">♥ ${p.likes.length}</button>${P.mod ? `<button class="g bad" data-del="${p.id}" style="color:#e0364a;border-color:#e0364a">Apagar</button>` : ''}</div>
        ${p.coms.map((c) => `<div class="msg"><b>${esc(c.por)}</b> ${esc(c.x)}</div>`).join('')}
        <form data-f="com" data-id="${p.id}" class="r"><input name="x" placeholder="Comentar…" required maxlength="200"><button class="g">Enviar</button></form></div>`).join(''),
    chat: () => {
      const msgs = (R.chat()[canal] || []);
      return `<nav class="t">${Object.keys(CANAIS).map((n) => (CANAIS[n] ? `<button class="${n === canal ? 'on' : ''}" data-canal="${n}"># ${n}</button>` : '')).join('')}</nav>
      <div class="c"><div class="chat">${msgs.length ? msgs.map((m) => `<div class="msg"><b>${esc(m.por)}</b> <small class="m">${esc(m.cargo)} · ${esc(m.at)}</small><br>${esc(m.x)}</div>`).join('') : '<p class="m">Nenhuma mensagem ainda.</p>'}</div>
      <form data-f="chat" class="r"><input name="x" placeholder="Mensagem em #${canal}" required maxlength="300" autocomplete="off"><button>Enviar</button></form></div>`;
    },
    tarefas: () => {
      const ts = R.tasks().filter((t) => P.tarefa || P.supervisor || t.alvo === k);
      return (P.tarefa ? `<div class="c"><h2>Nova tarefa por cargo</h2><form data-f="task"><input name="t" placeholder="O que precisa ser feito?" required maxlength="100"><div class="r"><select name="alvo"><option value="tesoureiro">Tesoureiro(a)</option><option value="secretaria">Secretário(a)</option><option value="rep">Representantes</option><option value="membro">Diretores / suplente</option></select><input type="date" name="prazo" required></div><button>Atribuir</button></form></div>` : '') +
        `<div class="c"><h2>${P.tarefa || P.supervisor ? 'Tarefas do Grêmio' : 'Minhas tarefas'}</h2>${ts.length ? ts.map((t) => `<div class="it"><div><b${t.ok ? ' style="text-decoration:line-through"' : ''}>${esc(t.t)}</b><br><small>Cargo: ${esc(NOMES[t.alvo] || 'Diretores / suplente')} · até ${new Date(t.prazo + 'T12:00').toLocaleDateString('pt-BR')}</small></div>${t.ok ? '<span class="pl f">Feita</span>' : (t.alvo === k || P.tarefa) ? `<button class="ok" data-tok="${t.id}">Concluir</button>` : '<span class="pl">Pendente</span>'}</div>`).join('') : '<p class="m">Sem tarefas para o seu cargo. 🎉</p>'}</div>`;
    },
    financas: () => {
      const f = R.fin(), saldo = f.reduce((a, x) => a + (x.tipo === 'entrada' ? x.v : -x.v), 0);
      if (!P.finVer) return `<div class="c"><h2>Caixa do Grêmio</h2><p>Saldo atual: <b>${money(saldo)}</b></p><p class="m">Os lançamentos são vistos pelo tesoureiro, pela presidência e pelos responsáveis da escola.</p></div>`;
      return `<div class="c"><h2>Saldo: ${money(saldo)}</h2>${P.finEd ? `<form data-f="fin"><div class="r"><select name="tipo"><option value="entrada">Entrada</option><option value="saida">Saída</option></select><input name="v" type="number" step="0.01" min="0.01" placeholder="Valor (R$)" required></div><input name="d" placeholder="Descrição" required maxlength="80"><button>Lançar</button></form>` : ''}</div>
      <div class="c"><table><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Situação</th></tr></thead><tbody>${f.map((x) => `<tr><td>${new Date(x.data + 'T12:00').toLocaleDateString('pt-BR')}</td><td>${esc(x.d)}</td><td style="color:${x.tipo === 'entrada' ? '#0a7a54' : '#e0364a'}">${x.tipo === 'entrada' ? '+' : '−'}${money(x.v)}</td><td>${x.apr ? '<span class="pl f">Aprovado</span>' : P.finOk ? `<button class="ok" data-apr="${x.id}">Aprovar</button>` : '<span class="pl">Aguardando</span>'}</td></tr>`).join('')}</tbody></table></div>`;
    },
    atas: () => {
      const atas = R.atas(), a = atas.find((x) => x.id === ata);
      if (!a) return `<div class="c"><h2>Atas</h2>${P.ataEd ? '<button data-nova>+ Nova ata</button>' : ''}${atas.map((x) => `<div class="it"><div><b>${esc(x.title)}</b><br><small>${new Date(x.data + 'T12:00').toLocaleDateString('pt-BR')} · ${x.ciente.length ? 'ciência: ' + esc(x.ciente.join(', ')) : 'sem ciência ainda'}</small></div><button class="g" data-ata="${x.id}">Abrir</button></div>`).join('')}</div>`;
      const ed = P.ataEd ? ' contenteditable="true"' : '';
      return `<div class="c"><button class="g" data-ata="">← Atas</button> <h2 class="blk h"${ed} data-ti>${esc(a.title)}</h2>${a.blocks.map((b, i) => `<div class="r" style="flex-wrap:nowrap">${b.t === 'todo' ? `<input type="checkbox" style="width:auto;flex:0" data-chk="${i}"${b.ok ? ' checked' : ''}${P.ataEd ? '' : ' disabled'}>` : b.t === 'li' ? '<span style="flex:0">•</span>' : ''}<div class="blk${b.t === 'h' ? ' h' : ''}"${ed} data-b="${i}">${esc(b.x)}</div></div>`).join('')}
        ${P.ataEd ? '<div class="r" style="margin-top:10px"><button class="g" data-add="h">+ Título</button><button class="g" data-add="p">+ Texto</button><button class="g" data-add="li">+ Lista</button><button class="g" data-add="todo">+ Tarefa</button></div>' : ''}
        ${P.supervisor ? `<p><button class="ok" data-ciente="${a.id}">Dar ciência</button></p>` : ''}</div>`;
    },
  };
  const TABS = [['feed', 'Feed'], ['chat', 'Chat'], ['tarefas', 'Tarefas'], ['financas', 'Finanças'], ['atas', 'Atas']];

  function draw() {
    $('#app').innerHTML = `<header><h1>Grêmio estudantil<small>${esc(me.nome)} · ${esc(me.cargo)}</small></h1><a class="b g" href="${({ aluno: 'painel-aluno.html', gestao: 'painel-gestao.html', professor: 'painel-professor.html' }[s.role] || 'painel-equipe.html')}">Voltar</a></header>
      <div class="c" style="padding:10px"><label class="m">Ver como (teste do protótipo): <select id="as"><option value="">Meu acesso real</option>${Object.entries(NOMES).map(([v, n]) => `<option value="${v}"${demo === v ? ' selected' : ''}>${n}</option>`).join('')}</select></label></div>
      <nav class="t">${TABS.map(([v, l]) => `<button class="${v === tab ? 'on' : ''}" data-tab="${v}">${l}</button>`).join('')}</nav>${V[tab]()}`;
  }

  /* ---------- ações ---------- */
  const put = (key, fn) => { sv(key, fn(ld(key, key === 'gr_chat' ? {} : []))); draw(); };
  document.addEventListener('change', (e) => { if (e.target.id === 'as') { e.target.value ? sessionStorage.setItem('gr_as', e.target.value) : sessionStorage.removeItem('gr_as'); location.reload(); } if (e.target.dataset.chk !== undefined) edAta((a) => { a.blocks[e.target.dataset.chk].ok = e.target.checked; }, true); });
  const edAta = (fn, quiet) => { sv('gr_atas', R.atas().map((a) => { if (a.id === ata) fn(a); return a; })); if (!quiet) draw(); };
  document.addEventListener('focusout', (e) => { // salva a edição da ata ao sair do bloco
    const el = e.target; if (!P.ataEd || !el.classList || !el.classList.contains('blk')) return;
    edAta((a) => { if (el.dataset.ti !== undefined) a.title = el.textContent.trim() || a.title; else a.blocks[el.dataset.b].x = el.textContent.trim(); }, true);
  });
  document.addEventListener('click', (e) => {
    const d = e.target.dataset;
    if (d.tab) { tab = d.tab; ata = null; draw(); }
    if (d.canal) { canal = d.canal; draw(); }
    if (d.like) put('gr_feed', (l) => l.map((p) => (p.id === d.like ? { ...p, likes: p.likes.includes(me.nome) ? p.likes.filter((n) => n !== me.nome) : [...p.likes, me.nome] } : p)));
    if (d.del) put('gr_feed', (l) => l.filter((p) => p.id !== d.del));
    if (d.tok) put('gr_tasks', (l) => l.map((t) => (t.id === d.tok ? { ...t, ok: true } : t)));
    if (d.apr) { put('gr_fin', (l) => l.map((x) => (x.id === d.apr ? { ...x, apr: true } : x))); toast('Lançamento aprovado.'); }
    if (d.nova !== undefined) { const n = { id: id(), title: 'Nova ata', data: new Date().toISOString().slice(0, 10), ciente: [], blocks: [{ t: 'h', x: 'Pauta' }, { t: 'p', x: 'Escreva aqui…' }] }; sv('gr_atas', [n, ...R.atas()]); ata = n.id; draw(); }
    if (d.ata !== undefined) { ata = d.ata || null; draw(); }
    if (d.add) edAta((a) => a.blocks.push({ t: d.add, x: 'Novo item', ok: false }));
    if (d.ciente) { edAta((a) => { if (!a.ciente.includes(me.nome)) a.ciente.push(me.nome); }); toast('Ciência registrada.'); }
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.dataset.f; if (!f) return; e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (f === 'post') put('gr_feed', (l) => [{ id: id(), ...autor, t: d.t, x: d.x, at: now(), likes: [], coms: [] }, ...l]);
    if (f === 'com') put('gr_feed', (l) => l.map((p) => (p.id === e.target.dataset.id ? { ...p, coms: [...p.coms, { por: me.nome, x: d.x }] } : p)));
    if (f === 'chat') put('gr_chat', (c) => ({ ...c, [canal]: [...(c[canal] || []), { ...autor, x: d.x, at: now() }] }));
    if (f === 'task') put('gr_tasks', (l) => [{ id: id(), t: d.t, alvo: d.alvo, prazo: d.prazo, ok: false }, ...l]);
    if (f === 'fin') put('gr_fin', (l) => [{ id: id(), tipo: d.tipo, d: d.d, v: Number(d.v), data: new Date().toISOString().slice(0, 10), apr: false }, ...l]);
  });
  window.addEventListener('storage', () => { if (!document.activeElement || !document.activeElement.classList.contains('blk')) draw(); });
  draw();
})();
