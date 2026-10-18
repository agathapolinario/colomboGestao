/* Colombo · utilidades das telas de Equipe e Grêmio (dados só neste navegador) */
window.E = (() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ld = (k, f) => { try { return JSON.parse(localStorage.getItem(`colombo.${k}.v1`)) ?? f; } catch { return f; } };
  const sv = (k, v) => { try { localStorage.setItem(`colombo.${k}.v1`, JSON.stringify(v)); } catch { /* ignora */ } };
  const now = () => new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const toast = (m) => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 2400); };
  const $ = (s, r = document) => r.querySelector(s);
  const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  return { esc, ld, sv, now, toast, $, id };
})();
