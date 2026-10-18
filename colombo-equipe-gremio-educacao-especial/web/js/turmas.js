/* ==========================================================
   Colombo · turmas.js
   Estrutura da escola + lista SIMULADA de ~1200 alunos.
   >>> Para ajustar turmas, cursos ou grêmio, mexa só no CONFIG. <<<
   Na versão real, esta lista virá do servidor/SED.
   ========================================================== */
(() => {
  'use strict';

  const CONFIG = {
    // Fundamental II: 6º ao 9º, turmas A–C, à tarde
    fund2: { series: ['6º', '7º', '8º', '9º'], letras: ['A', 'B', 'C'], turno: 'Tarde' },
    // Ensino Médio
    em: [
      { serie: '1º', letras: ['A', 'B', 'C', 'D', 'E'], turno: 'Manhã' },
      { serie: '1º', letras: ['G', 'H'], turno: 'Tarde' },
      { serie: '2º', letras: ['A', 'B', 'C', 'D', 'E'], turno: 'Manhã' },
      { serie: '3º', letras: ['A', 'B', 'C', 'D', 'E', 'F'], turno: 'Manhã' },
    ],
    // Qual curso técnico cada letra faz (só turmas da manhã). Letra sem curso = ensino regular.
    cursoPorLetra: { A: 'adm', B: 'ds-escola', C: 'ds-senai', D: 'mec', E: 'design' },
    alunosPorTurma: 40,
  };

  const CURSOS = {
    'adm': { nome: 'Técnico em Administração', inst: 'Escola', local: 'Na própria escola', dias: 'Aulas técnicas no contraturno e em dias alternados',
      modulos: ['Fundamentos de Administração', 'Contabilidade Básica', 'Gestão de Pessoas'] },
    'ds-escola': { nome: 'Técnico em Desenvolvimento de Sistemas', inst: 'Escola', local: 'Na própria escola (laboratório de informática)', dias: 'Aulas técnicas na escola',
      modulos: ['Lógica de Programação', 'Banco de Dados', 'Desenvolvimento Web'] },
    'ds-senai': { nome: 'Técnico em Desenvolvimento de Sistemas', inst: 'SENAI', local: 'Unidade SENAI', dias: 'Aulas técnicas no SENAI',
      modulos: ['Lógica de Programação', 'Banco de Dados', 'Desenvolvimento Web'] },
    'mec': { nome: 'Técnico em Mecânica', inst: 'SENAI', local: 'Unidade SENAI (oficinas)', dias: 'Aulas técnicas no SENAI',
      modulos: ['Metrologia', 'Desenho Técnico', 'Processos de Usinagem'] },
    'design': { nome: 'Técnico em Design Gráfico', inst: 'SENAC', local: 'Unidade SENAC', dias: 'Aulas técnicas no SENAC',
      modulos: ['Fundamentos do Design', 'Tipografia', 'Ilustração Digital'] },
  };

  const DISC_FUND2 = ['Língua Portuguesa', 'Matemática', 'História', 'Geografia', 'Ciências', 'Inglês', 'Educação Física', 'Artes'];
  const DISC_EM = ['Língua Portuguesa', 'Matemática', 'História', 'Geografia', 'Física', 'Química', 'Biologia', 'Inglês', 'Educação Física', 'Artes', 'Filosofia', 'Sociologia'];

  const NOMES = ['Ana', 'Beatriz', 'Bruno', 'Camila', 'Carlos', 'Daniela', 'Davi', 'Eduarda', 'Felipe', 'Gabriel', 'Gabriela', 'Guilherme', 'Helena', 'Igor', 'Isabela',
    'João', 'Julia', 'Kauã', 'Larissa', 'Leonardo', 'Letícia', 'Lucas', 'Luiza', 'Marcos', 'Maria', 'Mariana', 'Mateus', 'Nicole', 'Pedro', 'Rafael',
    'Rafaela', 'Sofia', 'Thiago', 'Vitória', 'Yasmin', 'Enzo', 'Laura', 'Miguel', 'Alice', 'Heitor'];
  const SOBRENOMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
    'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas'];

  // gerador pseudoaleatório com semente (mesmos alunos toda vez que a página abre)
  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* ---------- lista de turmas ---------- */
  const turmas = [];
  CONFIG.fund2.series.forEach((serie) => CONFIG.fund2.letras.forEach((letra) =>
    turmas.push({ segmento: 'fund2', serie, letra, turno: CONFIG.fund2.turno, curso: null })));
  CONFIG.em.forEach((g) => g.letras.forEach((letra) =>
    turmas.push({ segmento: 'em', serie: g.serie, letra, turno: g.turno, curso: g.turno === 'Manhã' ? (CONFIG.cursoPorLetra[letra] || null) : null })));

  /* ---------- lista de alunos ---------- */
  const lista = [];
  const rand = rng(2026);
  turmas.forEach((t) => {
    for (let i = 0; i < CONFIG.alunosPorTurma; i++) {
      const n = lista.length;
      lista.push({
        ...t,
        nome: `${NOMES[Math.floor(rand() * NOMES.length)]} ${SOBRENOMES[Math.floor(rand() * SOBRENOMES.length)]} ${SOBRENOMES[Math.floor(rand() * SOBRENOMES.length)]}`,
        ra: `0001${String(10000 + n).padStart(5, '0')}2026`,
        matricula: `2026${String(n + 1).padStart(4, '0')}`,
        gremio: null,
      });
    }
  });
  // grêmio: [cargo, série, letra, posição na turma] — edite à vontade
  [['Presidente', '3º', 'A', 0], ['Vice-presidente', '3º', 'B', 0], ['Secretário(a)', '2º', 'A', 0], ['Tesoureiro(a)', '3º', 'C', 1],
    ['Diretor(a) de Comunicação', '2º', 'B', 0], ['Diretor(a) de Eventos', '2º', 'C', 0], ['Diretor(a) de Esportes', '3º', 'D', 0], ['Diretor(a) de Cultura', '2º', 'D', 0],
    ['Representante do 1º ano', '1º', 'A', 0], ['Representante do 2º ano', '2º', 'E', 1], ['Representante do 3º ano', '3º', 'E', 0], ['Suplente', '1º', 'B', 0],
  ].forEach(([cargo, serie, letra, pos]) => { lista.filter((a) => a.segmento === 'em' && a.serie === serie && a.letra === letra)[pos].gremio = cargo; });

  const porRA = new Map(lista.map((a) => [a.ra, a]));
  const digits = (v) => String(v || '').replace(/\D/g, '');

  /* ---------- helpers ---------- */
  const rotulo = (a) => `${a.serie} Ano ${a.letra} · ${a.turno}`;
  const segLabel = (a) => (a.segmento === 'fund2' ? 'Ensino Fundamental II' : 'Ensino Médio');
  const cursoDe = (a) => (a.curso ? CURSOS[a.curso] : null);
  const disciplinas = (a) => (a.segmento === 'fund2' ? DISC_FUND2 : DISC_EM.concat(cursoDe(a) ? cursoDe(a).modulos : []));

  function boletim(a) {
    const r = rng(Number(a.ra.slice(-9)) || 1);
    const notas = {}, freq = {};
    disciplinas(a).forEach((d) => {
      const base = 4.5 + r() * 4.5;
      notas[d] = [0, 1, 2].map(() => Math.max(2, Math.min(10, Math.round(base + r() * 3 - 1.5)))).concat(null); // 4º bimestre ainda não lançado
      const aulas = [30, 45, 60, 90][Math.floor(r() * 4)];
      freq[d] = [aulas, Math.min(aulas, Math.round(r() * r() * aulas * 0.2))];
    });
    return { notas, freq };
  }

  const validaRA = (v) => (porRA.has(digits(v)) ? null : 'RA não encontrado na lista da escola. Confira com a secretaria.');
  const validaPar = (ra, mat) => {
    const a = porRA.get(digits(ra));
    return !a || a.matricula === digits(mat) ? null : 'Esta matrícula não confere com o RA informado.';
  };

  window.TURMAS = { CONFIG, CURSOS, lista, turmas, porRA: (ra) => porRA.get(digits(ra)) || null, rotulo, segLabel, cursoDe, disciplinas, boletim, validaRA, validaPar };
})();
