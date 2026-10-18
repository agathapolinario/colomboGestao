/* ==========================================================
   Links das plataformas de aprendizagem.
   >>> É SÓ AQUI que você troca os links. <<<
   "cor" = cor do cartão na tela de plataformas.
   ========================================================== */
const SALA = 'https://saladofuturo.educacao.sp.gov.br/';

window.COLOMBO_LINKS = {
  tarefasSP: SALA, // botão "Abrir Tarefas SP" do início
  plataformas: [
    { nome: 'Materiais Digitais',    url: 'https://repositorio.educacao.sp.gov.br/midia', icone: 'book',   cor: '#2563eb', desc: 'Repositório de mídias e materiais' },
    { nome: 'Provas',                url: SALA, icone: 'file',   cor: '#7c3aed', desc: 'Avaliações da rede' },
    { nome: 'Tarefas SP',            url: SALA, icone: 'check',  cor: '#059669', desc: 'Atividades e tarefas' },
    { nome: 'Redação Paulista',      url: SALA, icone: 'pen',    cor: '#db2777', desc: 'Escreva e receba correção' },
    { nome: 'Escreva Mais',          url: SALA, icone: 'pen',    cor: '#ea580c', desc: 'Pratique a escrita' },
    { nome: 'Sala de Aula Virtual',  url: SALA, icone: 'school', cor: '#0891b2', desc: 'Sala do Futuro' },
    { nome: 'Canva',                 url: 'https://www.canva.com/pt_br/login/', icone: 'palette', cor: '#06b6d4', desc: 'Design e apresentações' },
    { nome: 'Alura',                 url: 'https://cursos.alura.com.br/', icone: 'code', cor: '#1d4ed8', desc: 'Cursos de tecnologia' },
    { nome: 'Khan Academy',          url: 'https://pt.khanacademy.org/', icone: 'calc', cor: '#16a34a', desc: 'Matemática e ciências' },
    { nome: 'Educação Profissional', url: 'https://educacaoprofissional.educacao.sp.gov.br/', icone: 'brief', cor: '#4f46e5', desc: 'Só para o curso técnico', soTecnico: true },
  ],
};
