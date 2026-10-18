/* Colombo · Primeiro acesso e Esqueci a senha (mesmo motor, escolhido por data-page) */
(() => {
  const { $, auth, passwordIssues, strength, STRENGTH_LABELS, onlyDigits } = Colombo;
  const key = new URLSearchParams(location.search).get('perfil');
  const P = window.PERFIS[key];
  if (!P) { location.replace('index.html'); return; }
  const page = document.body.dataset.page;
  document.body.classList.add(P.css);

  const card = $('#card');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SVG = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const EYE = SVG('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');
  const CHECK = SVG('<path d="M5 13l4 4L19 7"/>').replace('stroke-width="2"', 'stroke-width="3"');

  /* ----- peças de HTML ----- */
  const fieldHTML = (f) => `<div class="field${f.half ? ' field--half' : ''}"><label for="${f.name}">${f.label}</label><div class="input"><input id="${f.name}" name="${f.name}" type="${f.type || 'text'}"${f.inputmode ? ` inputmode="${f.inputmode}"` : ''} placeholder="${esc(f.placeholder || '')}" value="${esc(f.value || '')}" autocomplete="${f.autocomplete || 'off'}"></div><p class="field-error" hidden></p></div>`;
  const pwHTML = (id, label, ph, meter) => `<div class="field"><label for="${id}">${label}</label><div class="input"><input id="${id}" name="${id}" type="password" placeholder="${ph}" autocomplete="new-password"><button type="button" class="toggle-pw" data-target="${id}" aria-label="Mostrar senha" aria-pressed="false">${EYE}</button></div>${meter ? '<div class="strength" id="strength" data-level="0"><i></i><i></i><i></i><i></i></div><p class="strength-label" id="strengthLabel"></p>' : ''}<p class="field-error" hidden></p></div>`;
  const btnHTML = (label) => `<button class="btn" type="submit"><span class="btn-label">${label}</span><span class="spinner" aria-hidden="true"></span></button>`;
  const headHTML = (title, text) => `<header class="card-head"><span class="role-chip">${P.label}</span><h2>${title}</h2><p>${text}</p></header><div id="status" class="status" role="alert" hidden></div>`;
  const successHTML = (title, text, rows) => `<div class="success"><div class="success-icon">${CHECK}</div><h2>${title}</h2><p>${text}</p><dl>${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><a class="btn" href="${P.login}">Ir para o login</a></div>`;

  /* ----- estado visual ----- */
  const setStatus = (html, type = 'error') => {
    const s = $('#status', card); if (!s) return;
    s.hidden = !html; s.className = `status status--${type}`; s.innerHTML = html || '';
  };
  const setError = (wrap, msg) => {
    wrap.classList.toggle('has-error', !!msg);
    const p = $('.field-error', wrap); p.textContent = msg || ''; p.hidden = !msg;
  };
  const busy = (form, on) => { const b = $('.btn', form); b.disabled = on; b.classList.toggle('is-busy', on); };

  /* ----- campos ----- */
  const wire = (defs) => defs.map((f) => {
    const el = $('#' + f.name, card);
    const wrap = el.closest('.field');
    el.addEventListener('input', () => { if (f.mask) el.value = f.mask(el.value); setError(wrap, ''); setStatus(''); });
    return { ...f, el, wrap };
  });
  const check = (fs) => {
    const vals = {}; let bad = null;
    fs.forEach((f) => {
      const v = f.el.value.trim();
      const err = f.validate(v);
      setError(f.wrap, err);
      if (err && !bad) bad = f.el;
      vals[f.name] = f.normalize ? f.normalize(v) : v;
    });
    return { vals, bad };
  };
  const pwCheck = () => { // devolve o campo com problema (ou null)
    const pw = $('#password', card), cf = $('#confirm', card);
    const issues = passwordIssues(pw.value);
    const e1 = !pw.value ? 'Informe a senha.' : issues.length ? `A senha precisa de: ${issues.join(', ')}.` : null;
    setError(pw.closest('.field'), e1);
    if (e1) return pw;
    const e2 = cf.value !== pw.value ? 'As senhas não conferem.' : null;
    setError(cf.closest('.field'), e2);
    return e2 ? cf : null;
  };

  // mostrar/ocultar senha e medidor de força (delegação, pois o conteúdo é redesenhado)
  card.addEventListener('click', (e) => {
    const b = e.target.closest('.toggle-pw'); if (!b) return;
    const i = $('#' + b.dataset.target, card);
    const show = i.type === 'password';
    i.type = show ? 'text' : 'password';
    b.setAttribute('aria-pressed', String(show));
    b.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
  });
  card.addEventListener('input', (e) => {
    if (e.target.id !== 'password') return;
    const s = $('#strength', card); if (!s) return;
    const lv = strength(e.target.value);
    s.dataset.level = String(lv);
    $('#strengthLabel', card).textContent = lv ? `Força da senha: ${STRENGTH_LABELS[lv]}` : '';
  });

  /* =============== PRIMEIRO ACESSO =============== */
  function primeiro() {
    $('#brandTitle').textContent = `Primeiro acesso · ${P.label}`;
    $('#brandText').textContent = P.intro;
    card.innerHTML = `${headHTML('Primeiro acesso', 'Preencha seus dados para criar a sua conta.')}
      <form novalidate autocomplete="off">
        <div class="fields">${P.cadastro.map(fieldHTML).join('')}</div>
        <p class="section-label">Dados de acesso</p>
        <div class="fields">${P.ident.map(fieldHTML).join('')}</div>
        ${pwHTML('password', 'Crie sua senha', 'Mínimo de 8 caracteres', true)}
        ${pwHTML('confirm', 'Confirme a senha', 'Repita a senha')}
        ${btnHTML('Criar conta')}
      </form>
      <p class="alt-link">Já tem conta? <a href="${P.login}">Entrar</a></p>`;

    const form = $('form', card);
    const cad = wire(P.cadastro), ide = wire(P.ident);

    form.addEventListener('submit', async (e) => {
      e.preventDefault(); setStatus('');
      const c = check(cad), a = check(ide), badPw = pwCheck();
      const bad = c.bad || a.bad || badPw;
      if (bad) { bad.focus(); return; }

      const parts = P.ident.map((f) => a.vals[f.name]).concat(P.extra);
      busy(form, true);
      try {
        await sleep(450);
        if (auth.exists(P.role, parts)) {
          setStatus(`Já existe uma conta com esses dados. <a href="${P.login}">Entrar</a> ou <a href="esqueci-senha.html?perfil=${key}">redefinir a senha</a>.`);
          return;
        }
        await auth.register(P.role, parts, $('#password', card).value, { ...c.vals, perfil: key });
        card.innerHTML = successHTML('Conta criada!', 'Primeiro acesso concluído. Agora é só entrar com a sua senha.',
          [['Perfil', P.label], ['Nome', c.vals.nome], ['Escola', c.vals.escola], ['E-mail', c.vals.email]]);
      } finally { busy(form, false); }
    });
  }

  /* =============== ESQUECI A SENHA =============== */
  const EMAIL = { ...window.CAMPOS.email, label: 'E-mail cadastrado' };
  const CODE = {
    name: 'code', label: 'Código de 6 dígitos', inputmode: 'numeric', placeholder: '000000', autocomplete: 'one-time-code',
    mask: (v) => onlyDigits(v).slice(0, 6),
    validate: (v) => (v.length < 6 ? 'Digite os 6 dígitos do código.' : null),
  };

  function esqueci() {
    $('#brandTitle').textContent = 'Esqueceu a senha?';
    $('#brandText').textContent = 'Sem problema. Confirme seus dados e crie uma nova senha em poucos passos.';
    step1({});
  }

  function step1(saved) {
    card.innerHTML = `${headHTML('Esqueci a senha', 'Informe os dados da conta e o e-mail cadastrado.')}
      <form novalidate autocomplete="off">
        <div class="fields">${P.ident.map(fieldHTML).join('')}${fieldHTML(EMAIL)}</div>
        ${btnHTML('Enviar código')}
      </form>
      <p class="alt-link"><a href="${P.login}">&larr; Voltar ao login</a> &middot; <a href="primeiro-acesso.html?perfil=${key}">Primeiro acesso</a></p>`;
    Object.entries(saved).forEach(([k, v]) => { const el = $('#' + k, card); if (el) el.value = v; });

    const form = $('form', card);
    const fs = wire([...P.ident, EMAIL]);

    form.addEventListener('submit', async (e) => {
      e.preventDefault(); setStatus('');
      const r = check(fs);
      if (r.bad) { r.bad.focus(); return; }
      const parts = P.ident.map((f) => r.vals[f.name]).concat(P.extra);
      busy(form, true);
      try {
        await sleep(450);
        if (!auth.exists(P.role, parts)) {
          setStatus(`Não encontramos uma conta com esses dados. Faça o <a href="primeiro-acesso.html?perfil=${key}">primeiro acesso</a>.`);
          return;
        }
        const reg = auth.profile(P.role, parts);
        if (reg.email && reg.email !== r.vals.email) {
          setError(fs.find((f) => f.name === 'email').wrap, 'Este não é o e-mail cadastrado nesta conta.');
          return;
        }
        step2(parts, r.vals);
      } finally { busy(form, false); }
    });
  }

  function step2(parts, vals) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const [user, domain] = vals.email.split('@');
    card.innerHTML = `${headHTML('Verifique seu e-mail', `Enviamos um código de 6 dígitos para ${esc(user.slice(0, 2))}***@${esc(domain)}.`)}
      <div class="status status--info demo-code">Demonstração (não há servidor de e-mail): seu código é <strong>${code}</strong>.</div>
      <form novalidate autocomplete="off">
        <div class="fields">${fieldHTML(CODE)}</div>
        ${pwHTML('password', 'Nova senha', 'Mínimo de 8 caracteres', true)}
        ${pwHTML('confirm', 'Confirme a nova senha', 'Repita a senha')}
        ${btnHTML('Redefinir senha')}
      </form>
      <p class="alt-link"><button type="button" class="link" id="backBtn">Corrigir meus dados</button></p>`;

    const form = $('form', card);
    const cf = wire([CODE]);
    $('#backBtn', card).addEventListener('click', () => step1(vals));

    form.addEventListener('submit', async (e) => {
      e.preventDefault(); setStatus('');
      const r = check(cf), badPw = pwCheck();
      const bad = r.bad || badPw;
      if (bad) { bad.focus(); return; }
      if (r.vals.code !== code) { setError(cf[0].wrap, 'Código incorreto. Confira e tente de novo.'); cf[0].el.focus(); return; }
      busy(form, true);
      try {
        await sleep(450);
        await auth.setPassword(P.role, parts, $('#password', card).value);
        card.innerHTML = successHTML('Senha redefinida!', 'Use a nova senha para entrar na sua conta.',
          [['Perfil', P.label], ['Identificação', P.display(parts)]]);
      } finally { busy(form, false); }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#backLink').href = P.login;
    if (page === 'primeiro') primeiro(); else esqueci();
  });
})();
