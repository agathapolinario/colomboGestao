/* Professor · identificação por login */
(() => {
  const { initLoginForm } = Colombo;

  initLoginForm({
    role: 'professor',
    roleLabel: 'Professor',
    redirect: 'painel-professor.html',
    fields: [
      {
        name: 'login',
        mask: (v) => v.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30),
        normalize: (v) => v.toLowerCase(),
        validate: (v) => {
          if (!v) return 'Informe seu login.';
          if (v.length < 3) return 'O login deve ter ao menos 3 caracteres.';
          return null;
        },
      },
    ],
    displayName: (p) => `@${p[0]}`,
  });
})();
