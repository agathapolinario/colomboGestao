/* ==========================================================
   Colombo · org.js
   Núcleo dos painéis da GESTÃO (coordenação e direção) e da EQUIPE
   (agentes, segurança, limpeza, secretaria, GOE, cuidadora, AEE).

   O que tem aqui:
   - quem é a pessoa logada (cargo, nome, setor) e o "catálogo" de pessoas
   - datas, ícones, peças de HTML, impressão e CSV
   - seletor de aluno (turma + busca)
   - regras compartilhadas: suspensões, ocorrências, convocações, chamada,
     justificativas, alertas de emergência e pedidos
   - gerador de telas de cadastro (crud) usado por vários setores
   - o menu de cada cargo (NAV)

   Os dados ficam em localStorage (colombo.doc.<nome>.v1), o mesmo
   padrão dos painéis de professor, aluno e responsável: por isso
   tudo que a gestão lança aparece nos outros painéis.
   ========================================================== */
window.ORG = (() => {
  'use strict';
  const D = window.DOC;
  const { ld, sv, esc, fdt, id, now } = D;
  const CARGOS = window.CARGOS, LEGADO = window.CARGOS_LEGADO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- datas ---------- */
  const p2 = (n) => String(n).padStart(2, '0');
  const isoDe = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  const hoje = () => isoDe(new Date());
  const dt = (iso) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR') : '');
  const hm = (ts) => (ts ? new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '');
  const agora = () => { const d = new Date(); return `${p2(d.getHours())}:${p2(d.getMinutes())}`; };
  const somaDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoDe(d); };
  const SEM = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const diaSem = (iso) => SEM[new Date(iso + 'T12:00:00').getDay()];
  const ehUtil = (iso) => { const w = new Date(iso + 'T12:00:00').getDay(); return w > 0 && w < 6; };
  const diasUteis = (a, b) => { let n = 0; for (let d = a; d <= b; d = somaDias(d, 1)) if (ehUtil(d)) n++; return n; };
  const fimPorDias = (ini, n) => { let d = ini, c = ehUtil(d) ? 1 : 0; while (c < n) { d = somaDias(d, 1); if (ehUtil(d)) c++; } return d; };
  const proxUtil = (iso) => { let d = somaDias(iso, 1); while (!ehUtil(d)) d = somaDias(d, 1); return d; };
  const antes = (n) => somaDias(hoje(), -n);
  const mesAtual = () => hoje().slice(0, 7);
  const minDe = (h) => { const [a, b] = String(h || '0:0').split(':'); return Number(a) * 60 + Number(b || 0); };
  const num = (v) => { const n = Number(String(v ?? '').replace(/\./g, '').replace(',', '.')); return isNaN(n) ? 0 : n; };
  const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /* ---------- mensagens e peças de HTML ---------- */
  const toast = (m) => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; t.setAttribute('role', 'status'); document.body.append(t); setTimeout(() => t.remove(), 2800); };
  const pill = (st, t) => `<span class="pill ${st || ''}">${esc(t)}</span>`;
  const IC = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v5M12 18h.01"/>',
    shield: '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/>',
    clip: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
    check: '<path d="M5 13l4 4L19 7"/>',
    checkc: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
    cal: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    send: '<path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    door: '<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17"/><path d="M3 21h18M15 12h.01"/>',
    spark: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-2.6-.6-.6-2.6z"/>',
    dollar: '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19v2h15"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    heart: '<path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    print: '<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    cog: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16a3 3 0 0 1 6 0M14 10h4M14 14h3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    siren: '<path d="M7 18v-5a5 5 0 0 1 10 0v5"/><path d="M4 18h16v3H4zM12 3v2M4.5 6.5 6 8M19.5 6.5 18 8"/>',
    food: '<path d="M7 3v8a2 2 0 0 0 2 2v8M11 3v8a2 2 0 0 1-2 2M7 3v5M15 21V3c3 0 5 3 5 8h-5"/>',
    building: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M11 21v-3h2v3"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/>',
    swap: '<path d="M7 7h13l-3-3M17 17H4l3 3"/>',
    ticket: '<path d="M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"/><path d="M13 5v14"/>',
    mega: '<path d="M3 11v3a1 1 0 0 0 1 1h3l8 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M18 9a4 4 0 0 1 0 6"/>',
    walk: '<circle cx="13" cy="4" r="2"/><path d="M8 21l3-7 3 2v5M11 14l1-5-3 2-2 4M12 9l3 2 3-1"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    car: '<path d="M5 17h14M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M3 13l2-6h14l2 6v4H3z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    eyeoff: '<path d="M2 12s3.5-7 10-7c2 0 3.700.6 5.100 1.500M22 12s-3.500 7-10 7c-2 0-3.700-.6-5.100-1.500M3 3l18 18"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>',
  };
  const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;
  const vazio = (t) => `<p class="muted">${esc(t)}</p>`;
  const tile = (v, i, t, s, bdg) => `<button class="tile" data-go="${v}"><span class="ti">${ic(i)}${bdg ? `<b class="bdg">${bdg}</b>` : ''}</span><span>${esc(t)}<small>${esc(s || '')}</small></span></button>`;
  const kpi = (rot, val, sub, tom, go) => `<${go ? `button data-go="${go}"` : 'div'} class="kpi ${tom || ''}"><span>${esc(rot)}</span><b>${val}</b><small>${esc(sub || '')}</small></${go ? 'button' : 'div'}>`;
  const iniciais = (s) => String(s || '?').replace(/^@/, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  const CORES = ['#2563eb', '#7c3aed', '#059669', '#db2777', '#ea580c', '#0891b2', '#4f46e5', '#16a34a', '#d97706', '#0d9488'];
  const corDe = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return CORES[h % CORES.length]; };
  const optHtml = (list, sel) => (list || []).map((x) => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(v)}"${String(v) === String(sel) ? ' selected' : ''}>${esc(l)}</option>`; }).join('');
  const bar = (v, max, cor) => `<div class="hbar"><i style="width:${max ? Math.max(2, Math.round((v / max) * 100)) : 0}%${cor ? `;background:${cor}` : ''}"></i></div>`;

  /* ---------- download e impressão ---------- */
  const baixar = (nome, texto, tipo = 'text/csv;charset=utf-8') => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + texto], { type: tipo })); a.download = nome; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  const csv = (nome, linhas) => baixar(nome.replace(/[^\w.-]+/g, '-') + '.csv', linhas.map((l) => l.map((c) => `"${String(c ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`).join(';')).join('\r\n'));
  const CSS_DOC = 'body{font:14px/1.6 Georgia,serif;color:#111;max-width:760px;margin:30px auto;padding:0 20px}h1,h2,h3{font-family:Arial,sans-serif}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #999;padding:6px 8px;text-align:left;font-size:13px}.cab{text-align:center;line-height:1.3;margin-bottom:22px}.cab b{display:block;font-size:16px}.ass{display:flex;gap:40px;margin-top:70px}.ass div{flex:1;border-top:1px solid #000;text-align:center;padding-top:4px;font-size:12px}.rod{margin-top:30px;font-size:11px;color:#444;border-top:1px dashed #999;padding-top:6px}.cx{border:1px solid #999;padding:8px 12px;margin:10px 0}@media print{body{margin:0}}';
  const cabecalho = () => '<div class="cab">GOVERNO DO ESTADO DE SÃO PAULO<br>SECRETARIA DA EDUCAÇÃO<b>E.E. COLOMBO DE ALMEIDA</b></div>';
  const imprimir = (titulo, corpo) => {
    const f = document.createElement('iframe'); f.setAttribute('aria-hidden', 'true'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.append(f);
    const d = f.contentWindow.document; d.open(); d.write(`<!doctype html><meta charset="utf-8"><title>${esc(titulo)}</title><style>${CSS_DOC}</style><body>${corpo}</body>`); d.close();
    setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch { /* ignora */ } setTimeout(() => f.remove(), 4000); }, 250);
  };
  const codigoAut = (txt) => { let h = 7; for (const c of String(txt)) h = (h * 33 + c.charCodeAt(0)) >>> 0; return h.toString(36).toUpperCase().padStart(7, '0').slice(-7); };

  /* ---------- cargo, nome e catálogo de pessoas ---------- */
  const SETOR_NOME = { direcao: 'Direção', coordenacao: 'Coordenação', secretaria: 'Secretaria', goe: 'GOE', seguranca: 'Segurança', limpeza: 'Limpeza', agente: 'Agentes escolares', aee: 'AEE', cuidadora: 'Cuidadoras' };
  const setorDe = (cargo) => { const c = CARGOS[cargo]; return !c ? 'direcao' : c.grupo; };
  const cargoNome = (cargo) => (CARGOS[cargo] || {}).curto || (CARGOS[cargo] || {}).nome || cargo;
  const perfilLocal = (uid) => ld('org_perfil', {})[uid] || {};
  const LEG_ROTULO = { 'Coordenação': 'coordm1', 'Direção': 'dir', 'Corredor': 'agente', 'Cuidadora': 'cuidadora', 'Limpeza': 'limpeza', 'Professora do AEE': 'aee' };
  let _me = null;
  function me() {
    if (_me) return _me;
    const s = Colombo.session.get(); if (!s) return null;
    let cargo = s.cargo, login = s.login;
    if (!cargo || !CARGOS[cargo]) {
      const m = /^(.*?) · @(.+)$/.exec(s.who || '');
      cargo = m ? (LEG_ROTULO[m[1]] || Object.keys(CARGOS).find((k) => CARGOS[k].nome === m[1])) : null; login = m ? m[2] : login;
      if (!cargo) cargo = LEGADO[s.cargo] || null;
    }
    if (!cargo || !CARGOS[cargo]) return null;
    login = login || 'usuario';
    const uid = `${cargo}:${login}`;
    let prof = {}; try { prof = Colombo.auth.profile(CARGOS[cargo].role, [login, cargo]) || {}; } catch { /* ignora */ }
    const nome = perfilLocal(uid).nome || s.nome || prof.nome || '@' + login;
    _me = { uid, cargo, login, nome, role: CARGOS[cargo].role, grupo: CARGOS[cargo].grupo, setor: setorDe(cargo), turno: CARGOS[cargo].turno || null, ehDirecao: CARGOS[cargo].grupo === 'direcao', ehGestao: CARGOS[cargo].role === 'gestao', cargoNome: cargoNome(cargo), contato: prof.contato || '' };
    return _me;
  }
  const quem = () => { const m = me(); return `${m.nome} (${m.cargoNome})`; };
  const resetMe = () => { _me = null; };
  function diretorio() {
    let all = {}; try { all = JSON.parse(localStorage.getItem('colombo.users.v1')) || {}; } catch { /* ignora */ }
    const out = new Map();
    Object.entries(all).forEach(([k, rec]) => {
      const m = /^(gestao|equipe):([^|]+)\|(.+)$/.exec(k); if (!m) return;
      const cargo = CARGOS[m[3]] ? m[3] : LEGADO[m[3]]; if (!cargo) return;
      const uid = `${cargo}:${m[2]}`;
      out.set(uid, { uid, cargo, login: m[2], nome: perfilLocal(uid).nome || (rec.profile || {}).nome || '@' + m[2], contato: (rec.profile || {}).contato || '' });
    });
    const eu = me(); if (eu && !out.has(eu.uid)) out.set(eu.uid, { uid: eu.uid, cargo: eu.cargo, login: eu.login, nome: eu.nome, contato: eu.contato });
    return [...out.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  }
  const pessoaDe = (uid) => diretorio().find((p) => p.uid === uid);
  const rotuloPessoa = (p) => `${p.nome} · ${cargoNome(p.cargo)}`;
  const professores = () => Object.values(D.reg()).filter((p) => p.nome).sort((a, b) => a.nome.localeCompare(b.nome));

  /* ---------- alunos ---------- */
  const alunoDe = (ra) => window.TURMAS.porRA(ra);
  const alunoNome = (ra) => { const a = alunoDe(ra); return a ? a.nome : String(ra || ''); };
  const alunoTurma = (ra) => { const a = alunoDe(ra); return a ? `${a.serie} ${a.letra}` : ''; };
  const alunoRotulo = (ra) => { const a = alunoDe(ra); return a ? `${a.nome} · ${a.serie} ${a.letra} (${a.turno})` : String(ra || ''); };
  const turmaOpts = () => window.TURMAS.turmas.map((t) => [D.turmaKey(t), `${t.serie} ${t.letra} · ${t.turno}`]);

  function alunoPicker(nome, o = {}) {
    const a = o.ra ? alunoDe(o.ra) : null, t = a ? D.turmaKey(a) : (o.turma || '');
    const lista = a ? D.alunosDa(t) : (t ? D.alunosDa(t) : []);
    const opts = (lista.length ? [['', 'Selecione o aluno…']].concat(lista.slice(0, 200).map((x) => [x.ra, `${x.nome} · ${x.serie} ${x.letra}`])) : [['', 'Escolha a turma ou busque pelo nome…']]);
    return `<div class="picker fields" style="grid-column:1/-1"><label>Turma<select data-tsel><option value="">Todas (use a busca)</option>${optHtml(turmaOpts(), t)}</select></label>
      <label>Buscar por nome ou RA<input data-asrch placeholder="Digite para filtrar" autocomplete="off"></label>
      <label>${esc(o.label || 'Aluno')}<select name="${nome}" data-pk-aluno${o.req === false ? '' : ' required'}>${optHtml(opts, a ? a.ra : '')}</select></label></div>`;
  }
  function pkUpdate(box) {
    const sel = $('[data-pk-aluno]', box), t = $('[data-tsel]', box).value, q = norm($('[data-asrch]', box).value.trim());
    let lista = t ? D.alunosDa(t) : window.TURMAS.lista;
    if (q) lista = lista.filter((a) => norm(a.nome).includes(q) || a.ra.includes(q) || a.matricula.includes(q));
    else if (!t) lista = [];
    const cur = sel.value, mais = lista.length > 200; lista = lista.slice(0, 200);
    sel.innerHTML = `<option value="">${lista.length ? 'Selecione o aluno…' : (t || q ? 'Nenhum aluno encontrado' : 'Escolha a turma ou busque pelo nome…')}</option>` +
      lista.map((a) => `<option value="${a.ra}"${a.ra === cur ? ' selected' : ''}>${esc(a.nome)} · ${a.serie} ${a.letra}</option>`).join('') + (mais ? '<option value="" disabled>… refine a busca</option>' : '');
    if (q && lista.length === 1) sel.value = lista[0].ra;
  }

  /* ---------- registros compartilhados ---------- */
  const SUSP_MOTIVOS = ['Agressão física', 'Agressão verbal / ameaça', 'Bullying ou cyberbullying', 'Dano ao patrimônio', 'Uso ou porte de substâncias proibidas', 'Desacato à equipe escolar', 'Reincidência de advertências', 'Outro motivo'];
  const OC_TIPOS_GESTAO = ['Ocorrência', 'Advertência', 'Orientação / atendimento', 'Encaminhamento (saúde, Conselho Tutelar)', 'Comunicado à família', 'Elogio'];
  const OC_TIPOS_EQUIPE = ['Relato de ocorrência', 'Atraso', 'Comportamento', 'Saúde / mal-estar', 'Elogio'];
  const OC_ST = { registrada: ['warn', 'Registrada'], apuracao: ['warn', 'Em apuração'], encaminhada: ['', 'Encaminhada'], resolvida: ['ok', 'Resolvida'] };
  const OC_TOM = { 'Advertência': 'bad', 'Ocorrência': 'warn', 'Relato de ocorrência': 'warn', 'Elogio': 'ok' };

  const susp = {
    list: () => ld('susp', []),
    status(s, h = hoje()) { if (s.cancelada) return 'cancelada'; if (h < s.inicio) return 'agendada'; if (h > s.fim) return 'cumprida'; return 'curso'; },
    ativas(h = hoje()) { return susp.list().filter((s) => susp.status(s, h) === 'curso'); },
    futuras(h = hoje()) { return susp.list().filter((s) => susp.status(s, h) === 'agendada'); },
    deAluno: (ra) => susp.list().filter((s) => s.ra === ra).sort((a, b) => b.inicio.localeCompare(a.inicio)),
    suspensoNo: (ra, dia) => susp.list().find((s) => s.ra === ra && susp.status(s, dia) === 'curso'),
  };
  const ocorr = {
    list: () => ld('ocorr', []),
    add: (o) => sv('ocorr', [...ocorr.list(), { id: id(), ts: now(), ...o }]),
  };
  const convoc = {
    list: () => ld('convoc', []),
    pendentes: (ra) => convoc.list().filter((c) => c.ra === ra && c.st === 'pendente' && c.data >= hoje()),
  };
  const cham = {
    list: () => ld('cham', []),
    de: (turma, data) => cham.list().find((c) => c.turma === turma && c.data === data),
    salvar(turma, data, ausentes, atrasos) {
      const l = cham.list().filter((c) => !(c.turma === turma && c.data === data));
      l.push({ id: id(), turma, data, ausentes, atrasos, por: me().nome, cargo: me().cargo, ts: now() }); sv('cham', l);
    },
  };
  const justif = {
    list: () => ld('justif', []),
    cobre: (ra, dia) => justif.list().find((j) => j.ra === ra && j.st !== 'Indeferida' && j.de <= dia && dia <= j.ate),
  };
  // falta registrada na chamada: { falta, just, susp }
  const faltaNo = (ra, dia) => {
    const a = alunoDe(ra); if (!a) return null; const c = cham.de(D.turmaKey(a), dia);
    if (!c || !c.ausentes.includes(ra)) return null;
    return { falta: true, just: justif.cobre(ra, dia) || null, susp: susp.suspensoNo(ra, dia) || null };
  };

  /* ---------- alertas de emergência (SOS) ---------- */
  const alertas = {
    list: () => ld('org_alerta', []),
    ativos: () => alertas.list().filter((a) => a.st === 'ativo').sort((a, b) => b.ts - a.ts),
    novo(tipo, local, obs) { const m = me(); sv('org_alerta', [{ id: id(), tipo, local, obs: obs || '', por: m.nome, cargo: m.cargoNome, ts: now(), st: 'ativo' }, ...alertas.list()]); },
    resolver(i) { const m = me(); sv('org_alerta', alertas.list().map((a) => (a.id === i ? { ...a, st: 'resolvido', resPor: m.nome, resTs: now() } : a))); },
  };

  /* ---------- pedidos da escola ---------- */
  const CATS = {
    manut: ['Manutenção e reparos', 'goe'], limpeza: ['Limpeza e higiene', 'limpeza'], material: ['Material e compras', 'goe'],
    seguranca: ['Segurança e portaria', 'seguranca'], docs: ['Documentos e secretaria', 'secretaria'], ti: ['Tecnologia e informática', 'goe'],
    ped: ['Pedagógico', 'coordenacao'], eventos: ['Eventos e espaços', 'goe'], pessoal: ['Pessoal e RH', 'goe'], merenda: ['Alimentação e merenda', 'goe'],
    aee: ['Educação especial (AEE)', 'aee'], outros: ['Outros assuntos', 'direcao'],
  };
  const PRIO = { baixa: ['Baixa', 15], normal: ['Normal', 7], alta: ['Alta', 3], urgente: ['Urgente', 1] };
  const PED_ST = { aberto: ['warn', 'Aberto'], analise: ['', 'Em análise'], andamento: ['', 'Em andamento'], aguardando: ['warn', 'Aguardando'], concluido: ['ok', 'Concluído'], recusado: ['bad', 'Recusado'] };
  const pedidos = {
    list: () => ld('org_ped', []),
    novo(p) {
      const m = me(), seq = ld('org_seq', {}); seq.ped = (seq.ped || 0) + 1; sv('org_seq', seq);
      const cat = CATS[p.cat] ? p.cat : 'outros', prio = PRIO[p.prio] ? p.prio : 'normal';
      const reg = {
        id: id(), num: `PED-${new Date().getFullYear()}-${String(seq.ped).padStart(4, '0')}`, titulo: p.titulo, desc: p.desc || '', cat, prio, local: p.local || '',
        setor: p.setor || CATS[cat][1], por: m ? m.uid : p.uid || '', porNome: m ? quem() : p.porNome || '', st: 'aberto', ts: now(), atualizado: now(),
        prazo: p.prazo || somaDias(hoje(), PRIO[prio][1]), custo: p.custo || 0, atrib: '', atribNome: '',
        aprov: p.aprov ? { st: 'pendente' } : null, hist: [{ ts: now(), por: m ? quem() : p.porNome || '', t: 'Pedido aberto' }],
      };
      sv('org_ped', [reg, ...pedidos.list()]); return reg;
    },
    abertos: () => pedidos.list().filter((p) => !['concluido', 'recusado'].includes(p.st)),
    atrasado: (p) => !['concluido', 'recusado'].includes(p.st) && p.prazo && p.prazo < hoje(),
    doSetor: (setor) => pedidos.abertos().filter((p) => p.setor === setor),
  };

  /* ---------- chamados rápidos (um toque) ---------- */
  const CH_TIPOS = [
    ['Sala suja / precisa de limpeza', 'limpeza'], ['Falta papel, sabonete ou material', 'limpeza'], ['Derramou algo / piso molhado', 'limpeza'],
    ['Carteira, porta ou janela quebrada', 'agente'], ['Preciso de chave ou equipamento', 'agente'], ['Aluno fora de sala / no corredor', 'agente'],
    ['Aluno precisa de acompanhamento', 'cuidadora'], ['Atendimento na sala de recursos', 'aee'],
    ['Pessoa estranha / segurança', 'seguranca'], ['Preciso de documento / secretaria', 'secretaria'], ['Precisa de ajuda da gestão', 'coordenacao'],
  ];
  const chamados = {
    list: () => { try { return JSON.parse(localStorage.getItem('colombo.chamados.v1')) || []; } catch { return []; } },
    save: (l) => { try { localStorage.setItem('colombo.chamados.v1', JSON.stringify(l)); } catch { /* ignora */ } },
    doSetor: (setor) => chamados.list().filter((c) => (c.alvo === setor || (setor === 'agente' && c.alvo === 'corredor') || (setor === 'coordenacao' && c.alvo === 'gestao'))),
  };

  /* ---------- mensagens da família (descobrir responsáveis de um aluno) ---------- */
  function responsaveisDe(ra) {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const m = /^colombo\.responsavel\.(.+)\.filho$/.exec(localStorage.key(i) || ''); if (!m) continue;
      let f; try { f = JSON.parse(localStorage.getItem(localStorage.key(i))); } catch { continue; }
      if (f !== ra) continue;
      let p = {}; try { p = JSON.parse(localStorage.getItem(`colombo.responsavel.${m[1]}.perfil`)) || {}; } catch { /* ignora */ }
      out.push({ uid: m[1], nome: p.nome || 'Responsável' });
    }
    return out;
  }
  function avisarFamilia(ra, texto, para = 'coord') {
    const m = me(), rs = responsaveisDe(ra); if (!rs.length) return 0;
    const l = ld('pchat', []);
    rs.forEach((r) => l.push({ id: id(), conv: `${r.uid}|${ra}|${para}`, para, resp: r.uid, nomeResp: r.nome, ra, de: 'gestao', quem: m.cargoNome, t: texto, ts: now() }));
    sv('pchat', l); return rs.length;
  }

  /* ---------- telas, ações e estado compartilhado com o motor ---------- */
  const V = {}, A = {}, F = {}, C = {}, I = {}, BADGE = {}, W = {};
  const S = { params: {}, go: () => {}, refresh: () => {} };

  /* ---------- gerador de telas de cadastro (crud) ---------- */
  const CR = {};
  function crud(c) {
    CR[c.key] = c;
    const st = { q: '', f: {}, ed: null, per: c.periodoDef || 'todos' };
    c.st = st;
    const todas = () => ld(c.store, []);
    const perm = () => ({ add: true, edit: !!c.edit, del: c.del !== false, ...(c.perm ? c.perm(me()) : {}) });
    const valorPadrao = (f) => (typeof f.def === 'function' ? f.def() : f.def === 'hoje' ? hoje() : f.def === 'agora' ? agora() : (f.def ?? ''));
    const campo = (f, v) => {
      const val = v ?? valorPadrao(f), req = f.req ? ' required' : '', wide = f.larg ? ' style="grid-column:1/-1"' : '';
      switch (f.tipo) {
        case 'sel': return `<label${wide}>${esc(f.l)}<select name="${f.n}">${optHtml(typeof f.op === 'function' ? f.op() : f.op, val)}</select></label>`;
        case 'area': return `<label style="grid-column:1/-1">${esc(f.l)}<textarea name="${f.n}" rows="3" maxlength="800"${req}>${esc(val)}</textarea></label>`;
        case 'date': return `<label>${esc(f.l)}<input type="date" name="${f.n}" value="${esc(val)}"${req}></label>`;
        case 'time': return `<label>${esc(f.l)}<input type="time" name="${f.n}" value="${esc(val)}"${req}></label>`;
        case 'num': return `<label>${esc(f.l)}<input name="${f.n}" inputmode="decimal" value="${esc(val === '' ? '' : String(val).replace('.', ','))}" placeholder="${esc(f.ph || '0')}"${req}></label>`;
        case 'check': return `<label class="switch"><input type="checkbox" name="${f.n}" value="1"${val ? ' checked' : ''}><span>${esc(f.l)}</span></label>`;
        case 'aluno': return alunoPicker(f.n, { ra: val || (S.params.ra && !st.ed ? S.params.ra : ''), label: f.l, req: !!f.req });
        case 'prof': return `<label>${esc(f.l)}<select name="${f.n}"><option value="">—</option>${optHtml(professores().map((p) => [p.login, p.nome]), val)}</select></label>`;
        default: return `<label${wide}>${esc(f.l)}<input name="${f.n}" value="${esc(val)}" maxlength="${f.max || 120}" placeholder="${esc(f.ph || '')}"${req}></label>`;
      }
    };
    const celula = (col, r) => { const [k, , fn] = col; return fn ? fn(r[k], r) : esc(r[k] ?? ''); };
    const texto = (col, r) => { const [k, , , t] = col; if (t) return t(r[k], r); if (/^(ra|aluno)$/.test(k)) return alunoNome(r[k]); return r[k] ?? ''; };
    const filtrar = () => {
      const q = norm(st.q), per = st.per, k = c.periodo || 'data';
      return todas().filter((r) => (!c.onde || c.onde(r))
        && (!q || (c.busca || []).some((b) => norm(/^(ra|aluno)$/.test(b) ? alunoNome(r[b]) : r[b]).includes(q)))
        && (c.filtros || []).every((f) => !st.f[f.n] || String(r[f.n]) === st.f[f.n])
        && (!c.periodo || per === 'todos' || (per === 'hoje' ? r[k] === hoje() : r[k] >= antes(Number(per)))))
        .sort(c.ordem || ((a, b) => (b.ts || 0) - (a.ts || 0)));
    };
    V[c.key] = {
      t: c.t, i: c.i,
      r() {
        const p = perm(), rows = filtrar(), ed = st.ed ? todas().find((x) => x.id === st.ed) : null;
        const form = (p.add || ed) && !c.ro ? `<details class="card form-card"${ed || c.aberto ? ' open' : ''}><summary><b>${ic(ed ? 'edit' : 'plus')} ${ed ? 'Editando' : esc(c.novo || 'Novo registro')}</b></summary>
          <form class="form" style="max-width:none" data-f="crud:${c.key}"><div class="fields">${c.campos.map((f) => campo(f, ed ? ed[f.n] : undefined)).join('')}</div>
          <div class="row-btns"><button class="btn">${ed ? 'Salvar alterações' : esc(c.salvar || 'Salvar')}</button>${ed ? `<button type="button" class="btn ghost" data-act="crud" data-k="${c.key}" data-op="canc">Cancelar</button>` : ''}</div></form></details>` : '';
        const filtros = `<div class="filtros"><input type="search" data-in="crud" data-k="${c.key}" data-n="q" placeholder="Buscar…" value="${esc(st.q)}" aria-label="Buscar">
          ${(c.filtros || []).map((f) => `<select data-ch="crud" data-k="${c.key}" data-n="f:${f.n}" aria-label="${esc(f.l)}"><option value="">${esc(f.l)}: todos</option>${optHtml(f.op, st.f[f.n])}</select>`).join('')}
          ${c.periodo ? `<select data-ch="crud" data-k="${c.key}" data-n="per" aria-label="Período">${optHtml([['hoje', 'Hoje'], ['7', 'Últimos 7 dias'], ['30', 'Últimos 30 dias'], ['todos', 'Tudo']], st.per)}</select>` : ''}
          ${c.csv ? `<button class="btn ghost sm" data-act="crud" data-k="${c.key}" data-op="csv">${ic('download')} Planilha</button>` : ''}</div>`;
        const lista = rows.length ? `<div class="tscroll"><table><thead><tr>${c.cols.map((x) => `<th>${esc(x[1])}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map((r) => `<tr>${c.cols.map((x) => `<td>${celula(x, r)}</td>`).join('')}<td class="acoes">${(c.acoes || []).filter((a) => !a.se || a.se(r)).map((a) => `<button class="btn ${a.cls || 'ghost'} sm" data-act="crud" data-k="${c.key}" data-op="ac" data-ac="${a.k}" data-id="${r.id}">${esc(a.l)}</button>`).join(' ')}
          ${p.edit && !c.ro ? `<button class="btn ghost sm" data-act="crud" data-k="${c.key}" data-op="ed" data-id="${r.id}" aria-label="Editar">${ic('edit')}</button>` : ''}${p.del && !c.ro && (!c.podeApagar || c.podeApagar(r, me())) ? `<button class="btn ghost sm" data-act="crud" data-k="${c.key}" data-op="del" data-id="${r.id}" aria-label="Apagar">${ic('trash')}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : vazio(c.vazio || 'Nada por aqui ainda.');
        return `${c.intro ? `<p class="muted intro">${esc(c.intro)}</p>` : ''}${c.resumo ? c.resumo(todas().filter((r) => !c.onde || c.onde(r))) : ''}${form}<div class="card">${filtros}<p class="muted">${rows.length} registro(s)</p>${lista}</div>`;
      },
    };
    A.crud = A.crud || ((el) => {
      const cc = CR[el.dataset.k], s2 = cc.st, op = el.dataset.op, l = ld(cc.store, []);
      if (op === 'del') { if (!confirm('Apagar este registro?')) return false; sv(cc.store, l.filter((r) => r.id !== el.dataset.id)); toast('Apagado.'); return; }
      if (op === 'ed') { s2.ed = el.dataset.id; return; }
      if (op === 'canc') { s2.ed = null; return; }
      if (op === 'ac') {
        const a = cc.acoes.find((x) => x.k === el.dataset.ac), r = l.find((x) => x.id === el.dataset.id); if (!r) return;
        const novo = a.fn(r); if (novo === false) return false;
        sv(cc.store, l.map((x) => (x.id === r.id ? { ...novo, id: r.id } : x))); if (a.depois) a.depois(novo); toast(a.ok || 'Atualizado.'); return;
      }
      if (op === 'csv') {
        const lista = cc._filtrar(); csv(cc.t, [cc.cols.map((x) => x[1])].concat(lista.map((r) => cc.cols.map((x) => { const [k, , , t] = x; if (t) return t(r[k], r); if (/^(ra|aluno)$/.test(k)) return alunoNome(r[k]); return r[k] ?? ''; }))));
        return false;
      }
    });
    c._filtrar = filtrar;
    F.crud = F.crud || ((d, form, key) => {
      const cc = CR[key], s2 = cc.st, l = ld(cc.store, []), velho = s2.ed ? l.find((x) => x.id === s2.ed) : null;
      const reg = { ...(velho || {}) };
      cc.campos.forEach((f) => { reg[f.n] = f.tipo === 'check' ? !!d[f.n] : f.tipo === 'num' ? num(d[f.n]) : (d[f.n] ?? '').toString().trim(); });
      const m = me();
      if (!velho) Object.assign(reg, { id: id(), ts: now(), por: m.nome, uid: m.uid, cargo: m.cargo });
      const erro = cc.valida ? cc.valida(reg, l.filter((x) => !velho || x.id !== velho.id), velho) : null;
      if (erro) { toast(erro); return false; }
      const final = cc.pre ? cc.pre(reg, velho) : reg;
      sv(cc.store, velho ? l.map((x) => (x.id === velho.id ? final : x)) : [...l, final]);
      s2.ed = null; if (cc.depois) cc.depois(final, !velho); toast(velho ? 'Alterações salvas.' : 'Salvo!');
    });
    C.crud = C.crud || ((el) => { const cc = CR[el.dataset.k], n = el.dataset.n; if (n.startsWith('f:')) cc.st.f[n.slice(2)] = el.value; else cc.st[n] = el.value; });
    I.crud = I.crud || ((el) => { const cc = CR[el.dataset.k]; cc.st[el.dataset.n] = el.value; clearTimeout(I._t); I._t = setTimeout(() => { S.refresh({ foco: el }); }, 220); });
  }

  /* ---------- menu de cada cargo ---------- */
  const GESTAO_BASE = [
    ['', ['inicio']],
    ['Comunicação', ['chat', 'comunicados', 'reunioes', 'convocacoes']],
    ['Alunos', ['aluno360', 'ocorrencias', 'suspensoes', 'busca', 'saidas']],
    ['Escola', ['pedidos', 'chamados', 'professores', 'acompanhamento', 'profausentes', 'portaria', 'reservas', 'prazos']],
    ['Gestão', ['relatorios', 'tarefas', 'perfil']],
  ];
  const NAV = {
    coordenacao: GESTAO_BASE,
    direcao: GESTAO_BASE.slice(0, 4).concat([['Administração', ['aprovacoes', 'pessoal', 'ponto', 'escala', 'estoque', 'patrimonio', 'financas']]], GESTAO_BASE.slice(4)),
    agente: [['', ['inicio']], ['Dia a dia', ['chamados', 'foraSala', 'atrasos', 'saidas', 'profausentes', 'rondas']], ['Alunos', ['ocorrencias', 'suspensoes']], ['Escola', ['achados', 'incidentes']], ['Comunicação', ['chat', 'pedidos', 'mural']], ['Eu', ['escalaver', 'perfil']]],
    seguranca: [['', ['inicio']], ['Portaria', ['visitantes', 'saidas', 'suspensoes', 'rondas', 'incidentes', 'achados']], ['Operação', ['chamados', 'contatos']], ['Comunicação', ['chat', 'pedidos', 'mural']], ['Eu', ['escalaver', 'perfil']]],
    limpeza: [['', ['inicio']], ['Trabalho', ['chamados', 'limpezaDia', 'material']], ['Comunicação', ['chat', 'pedidos', 'mural']], ['Eu', ['escalaver', 'perfil']]],
    secretaria: [['', ['inicio']], ['Atendimento', ['fila', 'pedidosAluno', 'chat']], ['Alunos', ['chamada', 'justificativas', 'cadastro', 'docpend', 'matriculas', 'declaracoes']], ['Arquivo', ['protocolo', 'prazos', 'achados']], ['Escola', ['saidas', 'suspensoes', 'pedidos', 'chamados', 'mural']], ['Eu', ['perfil']]],
    goe: [['', ['inicio']], ['Pessoal', ['pessoal', 'ponto', 'profausentes', 'escala']], ['Patrimônio e materiais', ['patrimonio', 'estoque', 'merenda', 'reservas']], ['Financeiro e documentos', ['financas', 'protocolo', 'prazos', 'contatos']], ['Pedidos', ['pedidos', 'chamados']], ['Comunicação', ['chat', 'mural']], ['Eu', ['perfil']]],
    cuidadora: [['', ['inicio']], ['Acompanhamento', ['cuidado']], ['Dia a dia', ['chamados', 'suspensoes']], ['Comunicação', ['chat', 'pedidos', 'mural']], ['Eu', ['escalaver', 'perfil']]],
    aee: [['', ['inicio']], ['Atendimento', ['aeeAlunos']], ['Dia a dia', ['chamados', 'suspensoes']], ['Comunicação', ['chat', 'pedidos', 'mural']], ['Eu', ['perfil']]],
  };
  const navDe = (cargo) => NAV[setorDe(cargo)] || NAV.agente;

  const TEMA = {
    direcao: ['#4338ca', '#8b5cf6', '#1e1b6e', '#4338ca', '#8b5cf6'], coordenacao: ['#2d4fe0', '#38bdf8', '#0b1240', '#2340c8', '#3b82f6'],
    secretaria: ['#0369a1', '#06b6d4', '#082a6b', '#1d4ed8', '#06b6d4'], goe: ['#b45309', '#f59e0b', '#3b1d04', '#b45309', '#f59e0b'],
    seguranca: ['#334155', '#ef4444', '#0f172a', '#334155', '#dc2626'], agente: ['#c2410c', '#fb923c', '#431407', '#c2410c', '#fb923c'],
    limpeza: ['#15803d', '#4ade80', '#052e16', '#15803d', '#22c55e'], cuidadora: ['#be185d', '#f472b6', '#500724', '#be185d', '#f472b6'],
    aee: ['#6d28d9', '#a78bfa', '#2e1065', '#6d28d9', '#a78bfa'],
  };

  return {
    D, CARGOS, S, V, A, F, C, I, BADGE, W, CR, NAV, TEMA, navDe, crud,
    // util
    $, $$, esc, fdt, id, now, ld, sv, p2, isoDe, hoje, dt, hm, agora, somaDias, SEM, diaSem, ehUtil, diasUteis, fimPorDias, proxUtil, antes, mesAtual, minDe, num, brl, norm,
    toast, pill, ic, IC, vazio, tile, kpi, iniciais, corDe, optHtml, bar, baixar, csv, imprimir, cabecalho, codigoAut,
    // pessoas
    me, quem, resetMe, diretorio, pessoaDe, rotuloPessoa, professores, setorDe, cargoNome, SETOR_NOME, perfilLocal,
    // alunos
    alunoDe, alunoNome, alunoTurma, alunoRotulo, turmaOpts, alunoPicker, pkUpdate,
    // dados
    SUSP_MOTIVOS, OC_TIPOS_GESTAO, OC_TIPOS_EQUIPE, OC_ST, OC_TOM, susp, ocorr, convoc, cham, justif, faltaNo, alertas, CATS, PRIO, PED_ST, pedidos, CH_TIPOS, chamados, responsaveisDe, avisarFamilia,
  };
})();
