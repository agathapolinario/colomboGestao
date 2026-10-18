/* Aluno · identificação por RA + matrícula */
(() => {
  const { onlyDigits, initLoginForm } = Colombo;

  initLoginForm({
    role: 'aluno',
    roleLabel: 'Aluno',
    redirect: 'painel-aluno.html',
    fields: [
      {
        name: 'ra',
        mask: (v) => onlyDigits(v).slice(0, 13),
        normalize: (v) => onlyDigits(v),
        validate: (v) => {
          if (!v) return 'Informe seu RA.';
          if (onlyDigits(v).length < 8) return 'O RA deve ter ao menos 8 dígitos.';
          return window.TURMAS ? TURMAS.validaRA(v) : null;
        },
      },
      {
        name: 'matricula',
        mask: (v) => onlyDigits(v).slice(0, 12),
        normalize: (v) => onlyDigits(v),
        validate: (v) => {
          if (!v) return 'Informe sua matrícula.';
          if (onlyDigits(v).length < 4) return 'A matrícula deve ter ao menos 4 dígitos.';
          return window.TURMAS ? TURMAS.validaPar((document.getElementById('ra') || {}).value, v) : null;
        },
      },
    ],
    displayName: (p) => `RA ${p[0]}`,
  });
})();
