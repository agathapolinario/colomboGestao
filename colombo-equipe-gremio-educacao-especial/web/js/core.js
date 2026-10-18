/* ==========================================================
   Colombo · core.js
   "Back-end de mentirinha" para o protótipo.
   Tudo roda no navegador (localStorage / sessionStorage).

   Fluxo:
   1) Primeiro acesso  -> usuário digita os dados e CRIA a senha.
   2) Próximos acessos -> só digita a senha que criou.
   3) 5 erros seguidos -> bloqueio de 60 segundos.
   4) Senha guardada com hash SHA-256 + salt (nunca em texto puro).

   IMPORTANTE: isto NÃO é segurança real. Em produção, a validação
   precisa acontecer em um servidor. Aqui serve só para simular.
   ========================================================== */
(() => {
  'use strict';

  const KEYS = {
    users: 'colombo.users.v1',
    session: 'colombo.session.v1',
    locks: 'colombo.locks.v1',
  };
  const MAX_TRIES = 5;
  const LOCK_MS = 60 * 1000;
  const REMEMBER_MS = 7 * 24 * 60 * 60 * 1000;

  /* ---------- utilidades ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const onlyDigits = (v) => String(v || '').replace(/\D/g, '');
  const fmtDate = (ts) => new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const accountKey = (role, parts) =>
    `${role}:${parts.map((p) => String(p).trim().toLowerCase()).join('|')}`;

  const read = (store, key, fallback) => {
    try { const v = JSON.parse(store.getItem(key)); return v ?? fallback; } catch { return fallback; }
  };
  const write = (store, key, value) => {
    try { store.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  };

  /* ---------- máscaras e validações compartilhadas ---------- */
  const maskCPF = (v) => {
    const d = onlyDigits(v).slice(0, 11);
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  };

  const validCPF = (value) => {
    const d = onlyDigits(value);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    const calc = (len) => {
      let sum = 0;
      for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
      const r = (sum * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
  };

  /* ---------- hash de senha ---------- */
  async function sha256(text) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    // Plano B simples (contextos sem crypto.subtle). Só para protótipo.
    let h = 5381;
    for (const c of text) h = ((h << 5) + h) ^ c.charCodeAt(0);
    return 'x' + (h >>> 0).toString(16);
  }

  function randomSalt() {
    if (window.crypto && crypto.getRandomValues) {
      return [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return Math.random().toString(16).slice(2, 18);
  }

  /* ---------- "banco de dados" ---------- */
  const db = {
    all: () => read(localStorage, KEYS.users, {}),
    get(role, parts) { return this.all()[accountKey(role, parts)] || null; },
    put(role, parts, rec) {
      const all = this.all();
      all[accountKey(role, parts)] = rec;
      write(localStorage, KEYS.users, all);
    },
    remove(role, parts) {
      const all = this.all();
      delete all[accountKey(role, parts)];
      write(localStorage, KEYS.users, all);
    },
  };

  const locks = {
    all: () => read(localStorage, KEYS.locks, {}),
    get(key) { return this.all()[key] || { count: 0, until: 0 }; },
    set(key, value) { const all = this.all(); all[key] = value; write(localStorage, KEYS.locks, all); },
    clear(key) { const all = this.all(); delete all[key]; write(localStorage, KEYS.locks, all); },
  };

  /* ---------- autenticação ---------- */
  const auth = {
    exists: (role, parts) => !!db.get(role, parts),

    async register(role, parts, password, profile = null) {
      const salt = randomSalt();
      const hash = await sha256(`${salt}:${password}`);
      db.put(role, parts, { salt, hash, createdAt: Date.now(), lastLogin: null, profile });
    },

    profile(role, parts) {
      const rec = db.get(role, parts);
      return rec ? rec.profile || {} : null;
    },

    async setPassword(role, parts, password) {
      const rec = db.get(role, parts);
      if (!rec) return false;
      rec.salt = randomSalt();
      rec.hash = await sha256(`${rec.salt}:${password}`);
      db.put(role, parts, rec);
      locks.clear(accountKey(role, parts));
      return true;
    },

    async login(role, parts, password) {
      const key = accountKey(role, parts);
      const now = Date.now();
      const lock = locks.get(key);
      if (lock.until > now) return { ok: false, reason: 'locked', wait: Math.ceil((lock.until - now) / 1000) };

      const rec = db.get(role, parts);
      if (!rec) return { ok: false, reason: 'unknown' };

      const hash = await sha256(`${rec.salt}:${password}`);
      if (hash !== rec.hash) {
        const count = lock.count + 1;
        if (count >= MAX_TRIES) {
          locks.set(key, { count: 0, until: now + LOCK_MS });
          return { ok: false, reason: 'locked', wait: LOCK_MS / 1000 };
        }
        locks.set(key, { count, until: 0 });
        return { ok: false, reason: 'wrong', left: MAX_TRIES - count };
      }

      locks.clear(key);
      const previous = rec.lastLogin;
      rec.lastLogin = now;
      db.put(role, parts, rec);
      return { ok: true, previous };
    },

    reset(role, parts) {
      db.remove(role, parts);
      locks.clear(accountKey(role, parts));
    },
  };

  /* ---------- sessão ---------- */
  const session = {
    start(data, remember) {
      this.end();
      write(remember ? localStorage : sessionStorage, KEYS.session, { ...data, at: Date.now(), remember: !!remember });
    },
    get() {
      const s = read(sessionStorage, KEYS.session, null) || read(localStorage, KEYS.session, null);
      if (s && s.remember && Date.now() - s.at > REMEMBER_MS) { this.end(); return null; }
      return s;
    },
    end() {
      try { sessionStorage.removeItem(KEYS.session); localStorage.removeItem(KEYS.session); } catch { /* ignora */ }
    },
  };

  /* ---------- força da senha ---------- */
  function passwordIssues(pw) {
    const out = [];
    if (pw.length < 8) out.push('mínimo de 8 caracteres');
    if (!/[A-Za-z]/.test(pw)) out.push('pelo menos uma letra');
    if (!/\d/.test(pw)) out.push('pelo menos um número');
    return out;
  }

  function strength(pw) {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.max(1, Math.min(s, 4));
  }
  const STRENGTH_LABELS = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];

  /* ---------- pequenos ajustes de interface ---------- */
  function enhanceUI() {
    // Mostrar / ocultar senha
    $$('.toggle-pw').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', String(show));
        btn.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
      });
    });

    // Se a logo não carregar, mostra o monograma "CA"
    $$('img.logo').forEach((img) => {
      const fallback = () => {
        const span = document.createElement('span');
        span.className = 'logo-fallback';
        span.textContent = 'CA';
        img.replaceWith(span);
      };
      if (img.complete && img.naturalWidth === 0) fallback();
      else img.addEventListener('error', fallback, { once: true });
    });
  }

  /* ==========================================================
     Controlador do formulário de login
     Cada página só informa os campos e as regras dela.
     ========================================================== */
  function initLoginForm(cfg) {
    const role = cfg.role;
    const form = $('#loginForm');
    const status = $('#formStatus');
    const badge = $('#modeBadge');
    const pwInput = $('#password');
    const pwLabel = $('#passwordLabel');
    const confirmWrap = $('#confirmField');
    const confirmInput = $('#confirm');
    const strengthEl = $('#strength');
    const strengthLabel = $('#strengthLabel');
    const submitBtn = $('#submitBtn');
    const submitLabel = $('.btn-label', submitBtn);
    const formView = $('#formView');
    const successView = $('#successView');
    const logoutBtn = $('#logoutBtn');
    const remember = $('#remember');

    let firstAccess = false;
    let lockTimer = null;

    const fields = cfg.fields.map((f) => {
      const el = form.elements[f.name];
      return { ...f, el, wrap: el.closest('.field') };
    });
    const pwWrap = pwInput.closest('.field');
    const confirmFieldWrap = confirmWrap;

    /* ----- mensagens ----- */
    const setStatus = (msg, type = 'error') => {
      if (!msg) { status.hidden = true; status.textContent = ''; return; }
      status.hidden = false;
      status.className = `status status--${type}`;
      status.textContent = msg;
    };
    const setError = (wrap, msg) => {
      const p = $('.field-error', wrap);
      wrap.classList.toggle('has-error', !!msg);
      if (p) { p.textContent = msg || ''; p.hidden = !msg; }
      const input = $('input', wrap);
      if (input && msg) input.setAttribute('aria-invalid', 'true');
      else if (input) input.removeAttribute('aria-invalid');
    };
    const clearErrors = () => {
      fields.forEach((f) => setError(f.wrap, ''));
      setError(pwWrap, '');
      setError(confirmFieldWrap, '');
    };
    const busy = (on) => {
      submitBtn.disabled = on;
      submitBtn.classList.toggle('is-busy', on);
    };

    /* ----- leitura dos campos ----- */
    const extraParts = () => (cfg.extra ? cfg.extra() : []);

    function collect(showErrors) {
      const parts = [];
      let ok = true;
      let firstBad = null;
      fields.forEach((f) => {
        const value = f.el.value.trim();
        const err = f.validate(value);
        if (showErrors) setError(f.wrap, err);
        if (err) { ok = false; firstBad = firstBad || f.el; }
        parts.push(f.normalize ? f.normalize(value) : value);
      });
      return { parts: parts.concat(extraParts()), ok, firstBad };
    }

    /* ----- modo: primeiro acesso x retorno ----- */
    function refreshMode() {
      const { parts, ok } = collect(false);
      const wasFirst = firstAccess;

      if (!ok) {
        firstAccess = false;
        badge.hidden = true;
      } else if (auth.exists(role, parts)) {
        firstAccess = false;
        badge.hidden = false;
        badge.className = 'badge badge--back';
        badge.textContent = 'Que bom te ver de novo! Digite sua senha.';
      } else {
        firstAccess = true;
        badge.hidden = false;
        badge.className = 'badge badge--new';
        badge.textContent = 'Primeiro acesso: crie uma senha para sua conta.';
      }

      confirmWrap.hidden = !firstAccess;
      strengthEl.hidden = !firstAccess;
      strengthLabel.hidden = !firstAccess;
      pwLabel.textContent = firstAccess ? 'Crie sua senha' : 'Senha';
      pwInput.autocomplete = firstAccess ? 'new-password' : 'current-password';
      pwInput.placeholder = firstAccess ? 'Mínimo de 8 caracteres' : 'Sua senha';
      submitLabel.textContent = firstAccess ? 'Criar senha e entrar' : 'Entrar';
      if (wasFirst !== firstAccess) { confirmInput.value = ''; setError(confirmFieldWrap, ''); }
    }

    function updateStrength() {
      const level = firstAccess ? strength(pwInput.value) : 0;
      strengthEl.dataset.level = String(level);
      strengthLabel.textContent = level ? `Força da senha: ${STRENGTH_LABELS[level]}` : '';
    }

    /* ----- bloqueio por tentativas ----- */
    function showLock(seconds) {
      clearInterval(lockTimer);
      let left = seconds;
      const tick = () => {
        if (left <= 0) {
          clearInterval(lockTimer);
          submitBtn.disabled = false;
          setStatus('Você já pode tentar novamente.', 'info');
          return;
        }
        submitBtn.disabled = true;
        setStatus(`Muitas tentativas incorretas. Aguarde ${left}s para tentar de novo.`);
        left--;
      };
      tick();
      lockTimer = setInterval(tick, 1000);
    }

    /* ----- tela de sucesso ----- */
    function showSuccess(info) {
      formView.hidden = true;
      successView.hidden = false;
      $('[data-slot="who"]', successView).textContent = info.who;
      $('[data-slot="role"]', successView).textContent = cfg.roleLabel;
      $('[data-slot="last"]', successView).textContent = info.first
        ? 'Primeiro acesso'
        : info.previous ? fmtDate(info.previous) : '—';
      $('[data-slot="now"]', successView).textContent = fmtDate(Date.now());
      // Para ligar a um painel real, defina cfg.redirect (ex.: 'painel-aluno.html').
      if (cfg.redirect) setTimeout(() => { location.href = cfg.redirect; }, 1200);
    }

    function showForm() {
      successView.hidden = true;
      formView.hidden = false;
      pwInput.value = '';
      confirmInput.value = '';
      updateStrength();
      refreshMode();
    }

    /* ----- eventos ----- */
    fields.forEach((f) => {
      f.el.addEventListener('input', () => {
        if (f.mask) { const pos = f.el.value; f.el.value = f.mask(pos); }
        setError(f.wrap, '');
        setStatus('');
        refreshMode();
        updateStrength();
      });
    });
    $$('input[type="radio"]', form).forEach((r) => r.addEventListener('change', () => { setStatus(''); refreshMode(); }));
    pwInput.addEventListener('input', () => { setError(pwWrap, ''); setStatus(''); updateStrength(); });
    confirmInput.addEventListener('input', () => setError(confirmFieldWrap, ''));

    logoutBtn.addEventListener('click', () => { session.end(); showForm(); setStatus('Você saiu da conta.', 'info'); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('');
      clearErrors();

      const { parts, ok, firstBad } = collect(true);
      const pw = pwInput.value;
      let valid = ok;
      if (!pw) { setError(pwWrap, 'Informe a senha.'); valid = false; firstBad || (pwInput.focus()); }
      if (!valid) { if (firstBad) firstBad.focus(); return; }

      busy(true);
      try {
        await sleep(450); // simula o tempo de uma chamada ao servidor
        const exists = auth.exists(role, parts);

        if (!exists) {
          const issues = passwordIssues(pw);
          if (issues.length) { setError(pwWrap, `A senha precisa de: ${issues.join(', ')}.`); pwInput.focus(); return; }
          if (confirmInput.value !== pw) { setError(confirmFieldWrap, 'As senhas não conferem.'); confirmInput.focus(); return; }
          await auth.register(role, parts, pw);
        }

        const res = await auth.login(role, parts, pw);
        if (!res.ok) {
          if (res.reason === 'locked') { showLock(res.wait); return; }
          setError(pwWrap, `Senha incorreta. Restam ${res.left} tentativa${res.left === 1 ? '' : 's'}.`);
          pwInput.select();
          return;
        }

        const who = cfg.displayName(parts);
        const prof = auth.profile(role, parts) || {};
        session.start({ role, who, ...(cfg.sessionExtra ? cfg.sessionExtra(parts, prof) : {}) }, remember && remember.checked);
        showSuccess({ who, previous: res.previous, first: !exists });
      } finally {
        busy(false);
      }
    });

    /* ----- início ----- */
    const current = session.get();
    if (current && current.role === role) {
      showSuccess({ who: current.who, previous: null, first: false });
      $('[data-slot="last"]', successView).textContent = 'Sessão ativa';
    } else {
      refreshMode();
    }
  }

  document.addEventListener('DOMContentLoaded', enhanceUI);

  window.Colombo = { $, $$, onlyDigits, maskCPF, validCPF, auth, session, initLoginForm, passwordIssues, strength, STRENGTH_LABELS };
})();
