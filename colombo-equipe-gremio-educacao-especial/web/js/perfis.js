/* Colombo · perfis: campos e regras usados por "Primeiro acesso" e "Esqueci a senha" */
(() => {
  const { onlyDigits, maskCPF, validCPF } = Colombo;

  const phone = (v) => {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length > 10) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return d;
  };
  const loginRule = (v) => (!v ? 'Informe seu login.' : v.length < 3 ? 'O login deve ter ao menos 3 caracteres.' : null);

  /* ---------- campos de cadastro ---------- */
  const F = {
    nome: {
      name: 'nome', label: 'Nome completo', placeholder: 'Nome e sobrenome', autocomplete: 'name',
      mask: (v) => v.replace(/[0-9]/g, '').slice(0, 80),
      normalize: (v) => v.replace(/\s+/g, ' ').trim(),
      validate: (v) => (!v ? 'Informe o nome completo.' : v.split(/\s+/).length < 2 ? 'Digite nome e sobrenome.' : null),
    },
    escola: {
      name: 'escola', label: 'Escola', placeholder: 'Ex.: E.E. Colombo de Almeida', value: 'E.E. Colombo de Almeida',
      validate: (v) => (!v ? 'Informe a escola.' : v.length < 3 ? 'Nome da escola muito curto.' : null),
    },
    email: {
      name: 'email', label: 'E-mail', type: 'email', inputmode: 'email', placeholder: 'nome@email.com', autocomplete: 'email',
      mask: (v) => v.replace(/\s/g, '').toLowerCase(),
      validate: (v) => (!v ? 'Informe o e-mail.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'E-mail inválido. Confira o endereço.' : null),
    },
    turma: {
      name: 'turma', label: 'Turma', placeholder: 'Ex.: 2º A', half: true,
      mask: (v) => v.toUpperCase().slice(0, 30),
      validate: (v) => (!v ? 'Informe a turma.' : null),
    },
    contato: {
      name: 'contato', label: 'Telefone / WhatsApp', inputmode: 'tel', placeholder: '(11) 91234-5678', autocomplete: 'tel', half: true,
      mask: phone,
      validate: (v) => (!v ? 'Informe o telefone.' : onlyDigits(v).length < 10 ? 'Informe o telefone com DDD.' : null),
    },
  };

  /* ---------- campos de identificação (os mesmos das telas de login) ---------- */
  const ID = {
    ra: {
      name: 'ra', label: 'RA', inputmode: 'numeric', placeholder: 'Ex.: 000114320260',
      mask: (v) => onlyDigits(v).slice(0, 13), normalize: onlyDigits,
      validate: (v) => (!v ? 'Informe seu RA.' : onlyDigits(v).length < 8 ? 'O RA deve ter ao menos 8 dígitos.' : window.TURMAS ? TURMAS.validaRA(v) : null),
    },
    matricula: {
      name: 'matricula', label: 'Matrícula', inputmode: 'numeric', placeholder: 'Ex.: 20260123',
      mask: (v) => onlyDigits(v).slice(0, 12), normalize: onlyDigits,
      validate: (v) => (!v ? 'Informe sua matrícula.' : onlyDigits(v).length < 4 ? 'A matrícula deve ter ao menos 4 dígitos.' : window.TURMAS ? TURMAS.validaPar((document.getElementById('ra') || {}).value, v) : null),
    },
    rg: {
      name: 'rg', label: 'RG', placeholder: 'Ex.: 12.345.678-9',
      mask: (v) => v.toUpperCase().replace(/[^0-9X.\-]/g, '').slice(0, 14),
      normalize: (v) => v.toUpperCase().replace(/[^0-9X]/g, ''),
      validate: (v) => {
        const c = v.toUpperCase().replace(/[^0-9X]/g, '');
        return !c ? 'Informe seu RG.' : c.length < 7 || c.length > 10 ? 'RG inválido. Confira os números.' : null;
      },
    },
    cpf: {
      name: 'cpf', label: 'CPF', inputmode: 'numeric', placeholder: '000.000.000-00',
      mask: maskCPF, normalize: onlyDigits,
      validate: (v) => (!v ? 'Informe seu CPF.' : !validCPF(v) ? 'CPF inválido. Confira os números.' : null),
    },
    login: {
      name: 'login', label: 'Login', placeholder: 'Ex.: maria.silva',
      mask: (v) => v.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30),
      normalize: (v) => v.toLowerCase(), validate: loginRule,
    },
  };

  /* ---------- gestão e equipe: um perfil para cada cargo (ver js/cargos.js) ---------- */
  const PAGINA = { coordenacao: 'coordenacao.html', direcao: 'direcao.html' };
  const INTRO = {
    gestao: 'Crie o acesso para gerenciar a escola pelo app: ocorrências, suspensões, chat, pedidos e mais.',
    agente: 'Crie seu acesso para atender chamados, controlar saídas de sala, atrasos e rondas.',
    seguranca: 'Crie seu acesso para registrar visitantes, rondas, saídas de alunos e incidentes.',
    limpeza: 'Crie seu acesso para ver seu checklist, atender chamados e pedir material.',
    secretaria: 'Crie seu acesso para fazer a chamada, organizar documentos, cadastros e protocolos.',
    goe: 'Crie seu acesso para cuidar de pessoal, patrimônio, estoque, finanças e pedidos da escola.',
    cuidadora: 'Crie seu acesso para registrar o dia a dia dos alunos que você acompanha.',
    aee: 'Crie seu acesso para registrar os atendimentos e planos do AEE.',
  };
  const cargoPerfil = (key) => {
    const c = window.CARGOS[key];
    return {
      role: c.role, label: c.nome, css: 'page-coordenacao', extra: [key],
      login: c.role === 'gestao' ? PAGINA[c.grupo] : 'equipe.html',
      intro: c.role === 'gestao' ? INTRO.gestao : INTRO[c.grupo],
      cadastro: [F.nome, F.escola, F.email, { ...F.contato, half: false }],
      ident: [ID.login],
      display: (p) => `${c.nome} · @${p[0]}`,
    };
  };

  window.CAMPOS = F;
  window.PERFIS = {
    aluno: {
      role: 'aluno', label: 'Aluno', css: 'page-aluno', login: 'aluno.html', extra: [],
      intro: 'Crie sua conta para acompanhar notas, faltas, avisos e tarefas em um só lugar.',
      cadastro: [F.nome, F.escola, F.email, { ...F.contato, label: 'Contato dos responsáveis', half: false }], // turma/curso vêm da lista da escola (turmas.js)
      ident: [ID.ra, ID.matricula],
      display: (p) => `RA ${p[0]}`,
    },
    responsavel: {
      role: 'responsavel', label: 'Responsável', css: 'page-responsavel', login: 'responsavel.html', extra: [],
      intro: 'Crie seu acesso para acompanhar a vida escolar do aluno de perto.',
      cadastro: [F.nome, F.escola, F.email, { ...F.turma, label: 'Turma do aluno' }, F.contato],
      ident: [ID.rg, ID.cpf],
      display: (p) => `CPF ***.${p[1].slice(3, 6)}.${p[1].slice(6, 9)}-**`,
    },
    professor: {
      role: 'professor', label: 'Professor', css: 'page-professor', login: 'professor.html', extra: [],
      intro: 'Crie seu acesso para lançar notas, faltas e avisos.',
      cadastro: [F.nome, F.escola, F.email, { ...F.turma, label: 'Turma(s) que leciona', placeholder: 'Ex.: 6º A, 7º B' }, F.contato],
      ident: [ID.login],
      display: (p) => `@${p[0]}`,
    },
  };
  Object.keys(window.CARGOS).forEach((k) => { window.PERFIS[k] = cargoPerfil(k); });
  // contas/links antigos
  Object.entries(window.CARGOS_LEGADO).forEach(([a, b]) => { window.PERFIS[a] = window.PERFIS[b]; });
})();
