/* Responsável · identificação por RG + CPF */
(() => {
  const { onlyDigits, maskCPF, validCPF, initLoginForm } = Colombo;

  initLoginForm({
    role: 'responsavel',
    roleLabel: 'Responsável',
    redirect: 'painel-responsavel.html',
    fields: [
      {
        name: 'rg',
        // aceita números, X (dígito verificador), ponto e hífen
        mask: (v) => v.toUpperCase().replace(/[^0-9X.\-]/g, '').slice(0, 14),
        normalize: (v) => v.toUpperCase().replace(/[^0-9X]/g, ''),
        validate: (v) => {
          const clean = v.toUpperCase().replace(/[^0-9X]/g, '');
          if (!clean) return 'Informe seu RG.';
          if (clean.length < 7 || clean.length > 10) return 'RG inválido. Confira os números.';
          return null;
        },
      },
      {
        name: 'cpf',
        mask: maskCPF,
        normalize: (v) => onlyDigits(v),
        validate: (v) => {
          if (!v) return 'Informe seu CPF.';
          if (!validCPF(v)) return 'CPF inválido. Confira os números.';
          return null;
        },
      },
    ],
    displayName: (p) => `CPF ***.${p[1].slice(3, 6)}.${p[1].slice(6, 9)}-**`,
  });
})();
