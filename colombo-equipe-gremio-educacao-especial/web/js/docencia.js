/* Colombo · docencia.js — dados compartilhados entre o painel do professor e o da coordenação.
   Tudo em localStorage (chaves colombo.doc.<nome>.v1), no mesmo padrão do restante do protótipo. */
window.DOC = (() => {
  const ld = (k, f) => { try { return JSON.parse(localStorage.getItem(`colombo.doc.${k}.v1`)) ?? f; } catch { return f; } };
  const sv = (k, v) => { try { localStorage.setItem(`colombo.doc.${k}.v1`, JSON.stringify(v)); return true; } catch { return false; } };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const now = () => Date.now();
  const fdt = (ts) => new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const id = () => now().toString(36) + Math.random().toString(36).slice(2, 5);
  const CURSOS = { base: 'Ensino regular (sem curso técnico)' };
  Object.entries(window.TURMAS.CURSOS).forEach(([k, c]) => { CURSOS[k] = `${c.nome} · ${c.inst}`; });
  const ESPECIAIS = { paet: 'Professor PAET', sub: 'Professor substituto', esp: 'Professor de educação especial' };
  const RECURSOS = [['libras', 'Libras (VLibras)'], ['leitor', 'Leitor de tela (avisos falados e rótulos)'], ['texto', 'Texto maior'], ['contraste', 'Alto contraste'],
    ['teclado', 'Navegação por teclado reforçada'], ['estimulos', 'Menos estímulos visuais'], ['animacoes', 'Sem animações'], ['agendaVisual', 'Agenda visualmente organizada (cores)']];
  const reg = () => ld('reg', {});
  const setReg = (login, fn) => { const r = reg(); r[login] = fn(r[login] || { login, pedido: {}, aut: {} }); sv('reg', r); };
  // PAET: apenas um por curso
  const paetDe = (curso) => Object.values(reg()).find((p) => p.aut && p.aut.paet && p.curso === curso);
  const turmaKey = (t) => `${t.serie}|${t.letra}`;
  const turmaNome = (k) => { const [s, l] = k.split('|'); return `${s} ${l}`; };
  const alunosDa = (k) => window.TURMAS.lista.filter((a) => turmaKey(a) === k);
  const turmasTodas = () => window.TURMAS.turmas.map(turmaKey);
  const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  // notas lançadas pelos professores e faltas do diário se somam ao boletim-base (turmas.js)
  const notasDe = (a, base) => { const o = ld('notas', {})[a.ra] || {}, r = {}; Object.keys(base).forEach((d) => { r[d] = o[d] ? o[d].slice() : base[d]; }); return r; };
  const freqDe = (a, base) => { const r = {}; Object.entries(base).forEach(([d, v]) => { r[d] = v.slice(); });
    ld('pres', []).filter((p) => p.turma === turmaKey(a) && r[p.disc]).forEach((p) => { r[p.disc][0]++; if (p.ausentes.includes(a.ra)) r[p.disc][1]++; }); return r; };
  const fotoRedim = (file, cb, erro) => { if (!file || !/^image\//.test(file.type)) return erro('Escolha um arquivo de imagem.');
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 256; const s = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 256, 256); URL.revokeObjectURL(url); cb(c.toDataURL('image/jpeg', 0.85)); };
    img.onerror = () => { URL.revokeObjectURL(url); erro('Não consegui abrir essa imagem.'); }; img.src = url; };
  const avatarPadrao = (nome) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#5b3fd1"/><text x="40" y="53" font-size="38" text-anchor="middle" fill="#fff" font-family="Arial">${esc(((nome || 'P')[0] || 'P').toUpperCase())}</text></svg>`);
  return { notasDe, freqDe, fotoRedim, avatarPadrao, ld, sv, esc, fdt, id, CURSOS, ESPECIAIS, RECURSOS, reg, setReg, paetDe, turmaKey, turmaNome, alunosDa, turmasTodas, DIAS, now };
})();
