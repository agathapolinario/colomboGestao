/* Início · se já houver sessão ativa, mostra um atalho para voltar ao perfil dela */
(() => {
  const pages = {
    aluno: 'aluno.html',
    responsavel: 'responsavel.html',
    professor: 'professor.html',
    gestao: 'painel-gestao.html',
    equipe: 'painel-equipe.html',
  };
  const labels = {
    aluno: 'Aluno',
    responsavel: 'Responsável',
    professor: 'Professor',
    gestao: 'Coordenação / Direção',
    equipe: 'Equipe',
  };

  document.addEventListener('DOMContentLoaded', () => {
    const s = Colombo.session.get();
    if (!s || !pages[s.role]) return;

    const hint = document.querySelector('.hub-body .hint');
    const note = document.createElement('div');
    note.className = 'badge badge--back';
    note.innerHTML = `Sessão ativa como ${labels[s.role]}. <a href="${pages[s.role]}">Continuar</a>`;
    hint.before(note);
    note.style.marginTop = '16px';
  });
})();
