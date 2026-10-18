/* Login de Coordenação, Direção e Equipe: cargo (lista) + login.
   Qual das três telas é? Vem de <body data-login="coordenacao|direcao|equipe">. */
(() => {
  const { initLoginForm } = Colombo;
  const tipo = document.body.dataset.login;
  const lista = window.CARGOS_LOGIN[tipo];
  const sel = document.getElementById('cargo');
  const loginEl = document.getElementById('login');
  const cargoAtual = () => sel.value;
  const legado = window.CARGOS_LEGADO;
  const nomeCargo = (c) => (window.CARGOS[c] || window.CARGOS[legado[c]] || { nome: c }).nome;

  sel.innerHTML = lista.map((c) => `<option value="${c}">${window.CARGOS[c].nome}</option>`).join('');

  const role = window.CARGOS[lista[0]].role;
  initLoginForm({
    role,
    roleLabel: role === 'gestao' ? (tipo === 'direcao' ? 'Direção' : 'Coordenação') : 'Equipe da escola',
    redirect: role === 'gestao' ? 'painel-gestao.html' : 'painel-equipe.html',
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
    // o cargo faz parte da identidade da conta (mesmo login, cargos diferentes = contas diferentes)
    extra: () => [cargoAtual()],
    displayName: (p) => `${nomeCargo(p[1])} · @${p[0]}`,
    sessionExtra: (p, prof) => ({ cargo: p[1], login: p[0], nome: (prof && prof.nome) || '' }),
  });

  // links de "Esqueci a senha" e "Primeiro acesso" seguem o cargo escolhido
  const syncLinks = () => {
    document.getElementById('forgotBtn').href = `esqueci-senha.html?perfil=${cargoAtual()}`;
    document.getElementById('firstLink').href = `primeiro-acesso.html?perfil=${cargoAtual()}`;
  };
  sel.addEventListener('change', () => { syncLinks(); loginEl.dispatchEvent(new Event('input', { bubbles: true })); });
  syncLinks();
})();
