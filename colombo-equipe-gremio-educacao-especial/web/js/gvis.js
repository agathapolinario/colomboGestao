/* Colombo · visibilidade das ações da gestão (suspensões, ocorrências, convocações)
   nos painéis de aluno, responsável e professor. Lê os mesmos dados que a gestão grava. */
window.GVIS = (() => {
  'use strict';
  const ld = (k, f) => window.DOC.ld(k, f), sv = (k, v) => window.DOC.sv(k, v);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const p2 = (n) => String(n).padStart(2, '0');
  const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
  const dt = (iso) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR') : '');
  const status = (s, h = hoje()) => (s.cancelada ? 'cancelada' : h < s.inicio ? 'agendada' : h > s.fim ? 'cumprida' : 'curso');
  const retorno = (fim) => { const d = new Date(fim + 'T12:00:00'); do { d.setDate(d.getDate() + 1); } while ([0, 6].includes(d.getDay())); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
  const susp = (ra) => ld('susp', []).filter((s) => s.ra === ra && !s.cancelada).sort((a, b) => b.inicio.localeCompare(a.inicio));
  const ativa = (ra) => susp(ra).find((s) => status(s) === 'curso') || null;
  const ocorr = (ra) => ld('ocorr', []).filter((o) => o.aluno === ra && !o.interno).sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  const convoc = (ra) => ld('convoc', []).filter((c) => c.ra === ra && c.st === 'pendente' && c.data >= hoje());
  const ciente = (id, quem) => sv('susp', ld('susp', []).map((s) => (s.id === id ? { ...s, [quem === 'aluno' ? 'cienciaAluno' : 'cienciaResp']: { ts: Date.now() } } : s)));
  const faltaSusp = (ra) => { const a = ativa(ra); return a ? `Suspenso até ${dt(a.fim)}` : ''; };

  /* faixa de aviso para a tela inicial */
  const faixa = (ra, quem) => {
    const l = susp(ra).filter((s) => ['curso', 'agendada'].includes(status(s))), c = convoc(ra);
    if (!l.length && !c.length) return '';
    return `<div class="card" style="border-color:var(--danger)">${l.map((s) => cartao(s, quem, true)).join('')}${c.map((x) => `<p>📣 <b>Convocação:</b> ${esc(x.quem)} — ${dt(x.data)} às ${esc(x.hora || '')}, ${esc(x.local || 'escola')}. ${esc(x.assunto)}</p>`).join('')}</div>`;
  };
  /* cartão de uma suspensão */
  const cartao = (s, quem, compacto) => {
    const st = status(s), k = quem === 'aluno' ? 'cienciaAluno' : 'cienciaResp', pode = quem === 'aluno' || quem === 'resp';
    const rot = { curso: 'Suspensão em curso', agendada: 'Suspensão agendada', cumprida: 'Suspensão cumprida' }[st];
    return `<div style="margin:6px 0 12px"><h3 style="margin:0">⚠️ ${rot}: ${dt(s.inicio)} a ${dt(s.fim)} (${s.dias} dia${s.dias > 1 ? 's' : ''} letivo${s.dias > 1 ? 's' : ''})</h3>
      <p><b>Motivo:</b> ${esc(s.motivo)}${s.detalhe && !compacto ? `. ${esc(s.detalhe)}` : ''}</p>
      <p><b>Retorno às aulas:</b> ${dt(retorno(s.fim))}${s.comparecer ? ' · <b>o responsável deve comparecer</b>' : ''}</p>
      ${s.atividades ? `<p><b>Atividades para fazer em casa:</b> ${esc(s.atividades)}</p>` : ''}
      <p class="muted">Lançada por ${esc(s.por)} (${esc(s.cargoNome || '')}).${s.homolog ? ' Homologada pela direção.' : ''}</p>
      ${pode ? (s[k] ? `<span class="pill ok">Ciente em ${new Date(s[k].ts).toLocaleDateString('pt-BR')}</span>` : `<button class="btn sm" data-gciente="${s.id}" data-gquem="${quem}">Estou ciente</button>`) : ''}</div>`;
  };
  const lista = (ra, quem, semConv) => {
    const s = susp(ra), o = ocorr(ra), c = convoc(ra);
    return { susp: s, ocorr: o, convoc: c, html: `${s.length ? `<div class="card"><h2>Suspensões</h2>${s.map((x) => cartao(x, quem)).join('<hr style="border:0;border-top:1px solid var(--line)">')}</div>` : ''}${c.length && !semConv ? `<div class="card" style="border-color:var(--danger)"><h2>📣 Convocações</h2><ul class="list">${c.map((x) => `<li><span><b>${esc(x.quem)}</b> · ${esc(x.assunto)}<br><small class="muted">${esc(x.local || '')} · ${esc(x.hora || '')}</small></span><b>${dt(x.data)}</b></li>`).join('')}</ul></div>` : ''}` };
  };
  /* clique global em "Estou ciente" */
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-gciente]'); if (!b) return; ciente(b.dataset.gciente, b.dataset.gquem); window.dispatchEvent(new Event('storage')); });
  return { susp, ativa, ocorr, convoc, ciente, faixa, cartao, lista, status, faltaSusp, hoje, dt, retorno };
})();
