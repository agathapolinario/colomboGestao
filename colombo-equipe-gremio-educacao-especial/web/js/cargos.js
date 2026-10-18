/* Colombo · cargos da gestão e da equipe (usado pelo login, pelo primeiro acesso e pelos painéis).
   >>> Para mudar nomes ou quantidade de cargos, é só aqui. <<< */
window.CARGOS = {
  // Direção: 1 diretor(a) + 3 vice-diretores(as)
  dir:   { role: 'gestao', grupo: 'direcao',     nome: 'Diretor(a)' },
  vice1: { role: 'gestao', grupo: 'direcao',     nome: 'Vice-diretor(a) 1' },
  vice2: { role: 'gestao', grupo: 'direcao',     nome: 'Vice-diretor(a) 2' },
  vice3: { role: 'gestao', grupo: 'direcao',     nome: 'Vice-diretor(a) 3' },
  // Coordenação: 2 de manhã + 2 à tarde
  coordm1: { role: 'gestao', grupo: 'coordenacao', nome: 'Coordenador(a) · Manhã 1', turno: 'Manhã' },
  coordm2: { role: 'gestao', grupo: 'coordenacao', nome: 'Coordenador(a) · Manhã 2', turno: 'Manhã' },
  coordt1: { role: 'gestao', grupo: 'coordenacao', nome: 'Coordenador(a) · Tarde 1', turno: 'Tarde' },
  coordt2: { role: 'gestao', grupo: 'coordenacao', nome: 'Coordenador(a) · Tarde 2', turno: 'Tarde' },
  // Equipe
  agente:    { role: 'equipe', grupo: 'agente',    nome: 'Agente escolar' },
  seguranca: { role: 'equipe', grupo: 'seguranca', nome: 'Segurança' },
  limpeza:   { role: 'equipe', grupo: 'limpeza',   nome: 'Limpeza' },
  secretaria:{ role: 'equipe', grupo: 'secretaria',nome: 'Secretaria' },
  goe:       { role: 'equipe', grupo: 'goe',       nome: 'GOE (Gerente de Organização Escolar)', curto: 'GOE' },
  cuidadora: { role: 'equipe', grupo: 'cuidadora', nome: 'Cuidadora' },
  aee:       { role: 'equipe', grupo: 'aee',       nome: 'Professora do AEE' },
};
// quais cargos aparecem em cada tela de login
window.CARGOS_LOGIN = {
  coordenacao: ['coordm1', 'coordm2', 'coordt1', 'coordt2'],
  direcao: ['dir', 'vice1', 'vice2', 'vice3'],
  equipe: ['agente', 'seguranca', 'limpeza', 'secretaria', 'goe', 'cuidadora', 'aee'],
};
// cargos antigos (contas criadas antes desta versão)
window.CARGOS_LEGADO = { coordenacao: 'coordm1', direcao: 'dir', corredor: 'agente' };
