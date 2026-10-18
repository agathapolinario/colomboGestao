/* Colombo · motor dos painéis da gestão e da equipe.
   Monta o menu do cargo, troca de tela e entrega cliques, formulários e buscas
   para as telas registradas em ORG.V / ORG.A / ORG.F / ORG.C / ORG.I. */
(() => {
  'use strict';
  const O = window.ORG;
  const { $, $$, esc, ic } = O;
  const panel = document.body.dataset.panel;
  const sess = Colombo.session.get();
  if (sess && sess.role === 'professor' && panel === 'equipe') { location.replace('painel-professor.html'); return; }
  const me = O.me();
  if (!me || me.role !== panel) { location.replace(panel === 'gestao' ? 'coordenacao.html' : 'equipe.html'); return; }

  /* ---------- tema do cargo e aparência (claro/escuro) ---------- */
  const T = O.TEMA[me.setor] || O.TEMA.coordenacao;
  document.body.dataset.setor = me.setor;
  const st = document.createElement('style');
  st.textContent = `html[data-theme="claro"]{--accent:${T[0]};--accent-2:${T[1]}}html{--h1:${T[2]};--h2:${T[3]};--h3:${T[4]}}`;
  document.head.append(st);
  const aplicaTema = () => { let t = 'claro'; try { t = localStorage.getItem('colombo.org.tema') || 'claro'; } catch { /* ignora */ } document.documentElement.dataset.theme = t; };
  aplicaTema(); O.S.aplicaTema = aplicaTema;

  /* ---------- menu ---------- */
  let cur = 'inicio';
  const secoes = O.navDe(me.cargo);
  const existe = (k) => !!O.V[k];
  function montarMenu() {
    $('#nav').innerHTML = secoes.map(([g, ks]) => {
      const it = ks.filter(existe); if (!it.length) return '';
      return `${g ? `<div class="nav-grp">${esc(g)}</div>` : ''}${it.map((k) => `<button data-view="${k}"${k === cur ? ' aria-current="page"' : ''}>${ic(O.V[k].i || 'list')}<span>${esc(O.V[k].n || O.V[k].t)}</span><b class="nbdg" data-bdg="${k}" hidden></b></button>`).join('')}`;
    }).join('');
    $('#sideSub').textContent = me.cargoNome;
    $('#whoName').textContent = me.nome;
    $('#avatarTop').textContent = O.iniciais(me.nome);
    $('#avatarTop').style.background = `linear-gradient(135deg,${T[0]},${T[1]})`;
  }
  function atualizaMarcas() {
    $$('#nav button').forEach((b) => { const on = b.dataset.view === cur; b.classList.toggle('on', on); on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'); });
    $$('[data-bdg]').forEach((b) => { const f = O.BADGE[b.dataset.bdg]; let n = 0; try { n = f ? f() : 0; } catch { n = 0; } b.hidden = !n; b.textContent = n > 99 ? '99+' : n; });
  }

  /* ---------- faixa de emergência ---------- */
  const podeResolver = () => me.ehGestao || ['seguranca', 'agente'].includes(me.grupo);
  function banner() {
    const al = O.alertas.ativos();
    $('#banner').innerHTML = al.map((a) => `<div class="sos-bar" role="alert"><span class="sos-ic">${ic('siren')}</span><div><b>EMERGÊNCIA: ${esc(a.tipo)}</b> · ${esc(a.local || 'local não informado')}<small>${esc(a.por)} (${esc(a.cargo)}) · ${O.hm(a.ts)}${a.obs ? ' · ' + esc(a.obs) : ''}</small></div>${podeResolver() ? `<button class="btn sm" data-act="alertaRes" data-id="${a.id}">Marcar como resolvido</button>` : ''}</div>`).join('');
  }
  O.A.alertaRes = (el) => { O.alertas.resolver(el.dataset.id); O.toast('Emergência encerrada.'); };

  function abrirSOS() {
    const dlg = document.createElement('dialog'); dlg.className = 'dlg';
    dlg.innerHTML = `<form method="dialog" id="sosForm" class="form" style="max-width:none"><h2>${ic('siren')} Avisar emergência</h2><p class="muted">Todos da gestão, segurança e agentes veem na hora.</p>
      <label>O que aconteceu?<select name="tipo">${O.optHtml(['Briga / agressão', 'Aluno passando mal', 'Pessoa estranha na escola', 'Princípio de incêndio', 'Acidente', 'Ameaça', 'Outro'])}</select></label>
      <label>Onde?<input name="local" required maxlength="60" placeholder="Ex.: pátio, banheiro térreo, sala 2º B"></label>
      <label>Detalhe (opcional)<input name="obs" maxlength="120"></label>
      <div class="row-btns"><button class="btn" value="ok" style="background:var(--danger)">Enviar alerta</button><button class="btn ghost" value="cancel" formnovalidate>Cancelar</button></div></form>`;
    document.body.append(dlg);
    dlg.addEventListener('close', () => dlg.remove());
    $('#sosForm', dlg).addEventListener('submit', (e) => {
      const b = e.submitter; if (!b || b.value !== 'ok') return;
      const d = Object.fromEntries(new FormData(e.target)); O.alertas.novo(d.tipo, d.local, d.obs); O.toast('Alerta enviado!'); refresh();
    });
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }

  /* ---------- troca e redesenho de telas ---------- */
  function render(o = {}) {
    const v = O.V[cur] || O.V.inicio, y = window.scrollY;
    $('#title').textContent = v.t;
    $('#content').innerHTML = v.r();
    if (v.after) v.after();
    banner(); atualizaMarcas();
    const m = $('.msgs'); if (m && !o.manter) m.scrollTop = m.scrollHeight;
    if (o.manter) window.scrollTo(0, y);
    if (o.foco) {
      const sel = Object.entries(o.foco.dataset).map(([k, vv]) => `[data-${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}="${CSS.escape(vv)}"]`).join('');
      const novo = sel && $(sel); if (novo) { novo.focus(); try { const n = novo.value.length; novo.setSelectionRange(n, n); } catch { /* ignora */ } }
    }
  }
  function go(v, params) {
    if (!O.V[v]) v = 'inicio';
    cur = v; O.S.params = params || {}; O.S.cur = v;
    $('#side').classList.remove('open');
    render(); window.scrollTo(0, 0); $('#title').focus({ preventScroll: true });
  }
  const refresh = (o = {}) => render({ manter: true, ...o });
  O.S.go = go; O.S.refresh = refresh;

  /* ---------- eventos ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-go],[data-view],[data-act]'); if (!t) return;
    if (t.dataset.act) {
      const fn = O.A[t.dataset.act]; if (!fn) return;
      const r = fn(t, e); if (r !== false && r !== 'go') refresh(); return;
    }
    const p = {}; if (t.dataset.ra) p.ra = t.dataset.ra; if (t.dataset.sel) p.sel = t.dataset.sel;
    go(t.dataset.go || t.dataset.view, p);
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('form[data-f]'); if (!f) return; e.preventDefault();
    const [nome, ...arg] = f.dataset.f.split(':'), fn = O.F[nome]; if (!fn) return;
    const d = Object.fromEntries(new FormData(f));
    const r = fn(d, f, arg.join(':'), e);
    if (r === 'go') return;
    if (r !== false) refresh();
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-tsel]')) return O.pkUpdate(t.closest('.picker'));
    if (t.dataset.ch && O.C[t.dataset.ch]) { O.C[t.dataset.ch](t); refresh(); }
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('[data-asrch]')) return O.pkUpdate(t.closest('.picker'));
    if (t.dataset.in && O.I[t.dataset.in]) O.I[t.dataset.in](t);
  });
  window.addEventListener('storage', () => { const a = document.activeElement; if (a && a.matches && a.matches('input,textarea,select') && a.closest('#content')) return; render({ manter: true }); });
  setInterval(() => { const a = document.activeElement; if (a && a.matches && a.matches('input,textarea,select') && a.closest('#content')) return; if (document.hidden) return; render({ manter: true }); }, 30000);

  $('#burger').innerHTML = '<svg class="ic" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  $('#burger').onclick = () => $('#side').classList.toggle('open');
  $('#scrim').onclick = () => $('#side').classList.remove('open');
  $('#logout').innerHTML = `${ic('logout')} Sair da conta`;
  $('#logout').onclick = () => { Colombo.session.end(); location.href = panel === 'gestao' ? (me.ehDirecao ? 'direcao.html' : 'coordenacao.html') : 'equipe.html'; };
  $('#sosBtn').innerHTML = `${ic('siren')}<span>Emergência</span>`; $('#sosBtn').onclick = abrirSOS;
  $('#whoBtn').onclick = () => go('perfil');

  montarMenu();
  const q = new URLSearchParams(location.search).get('v');
  go(q && O.V[q] ? q : 'inicio');
  window.addEventListener('load', () => { if (O.S.depois) O.S.depois(); });
})();
