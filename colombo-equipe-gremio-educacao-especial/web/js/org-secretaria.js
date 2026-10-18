/* Colombo · Secretaria: chamada, justificativas, cadastro e documentos, matrículas,
   declarações, pedidos dos alunos, fila de atendimento e protocolo. */
(() => {
  'use strict';
  const O = window.ORG, D = O.D;
  const { V, A, F, C, I, BADGE, esc, ic, ld, sv, id, now, hoje, dt, hm, pill, toast, vazio, optHtml, alunoNome, alunoDe, alunoTurma, alunoPicker, norm } = O;
  const me = () => O.me();
  const S = O.S;

  const porAluno = (sufixo) => { // lê chaves colombo.aluno.<uid>.<sufixo> de todos os alunos
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '', m = new RegExp(`^colombo\\.aluno\\.(.+)\\.${sufixo}$`).exec(k); if (!m) continue;
      let v; try { v = JSON.parse(localStorage.getItem(k)); } catch { continue; }
      out.push({ key: k, uid: m[1], ra: m[1].replace(/\D/g, ''), v });
    }
    return out;
  };

  /* ---------- chamada diária ---------- */
  const ch = { turma: '', data: hoje() };
  V.chamada = {
    t: 'Chamada diária', i: 'checkc',
    r() {
      const feitas = O.cham.list().filter((c) => c.data === ch.data), todas = O.turmaOpts();
      const alun = ch.turma ? D.alunosDa(ch.turma) : [], reg = ch.turma ? O.cham.de(ch.turma, ch.data) : null;
      const totAus = feitas.reduce((s, c) => s + c.ausentes.length, 0), totAl = feitas.reduce((s, c) => s + D.alunosDa(c.turma).length, 0);
      const topo = `<div class="kpis">${O.kpi('Turmas com chamada', `${feitas.length}/${todas.length}`, dt(ch.data), feitas.length < todas.length ? 'warn' : 'ok')}${O.kpi('Faltas no dia', totAus, 'nas turmas já chamadas', totAus ? 'warn' : '')}${O.kpi('Presença', totAl ? (100 - (totAus / totAl) * 100).toFixed(1).replace('.', ',') + '%' : '—', 'nas turmas já chamadas', 'ok')}</div>`;
      const sel = `<div class="card"><div class="filtros"><select data-ch="ch" data-n="turma" aria-label="Turma"><option value="">Escolha a turma…</option>${optHtml(todas.map(([k, n]) => [k, n + (feitas.some((c) => c.turma === k) ? ' ✔' : '')]), ch.turma)}</select><input type="date" data-ch="ch" data-n="data" value="${ch.data}" aria-label="Data" style="max-width:190px"><button class="btn ghost sm" data-act="chamCsv">${ic('download')} Planilha do dia</button></div>
        ${todas.length - feitas.length ? `<p class="muted">Faltam: ${todas.filter(([k]) => !feitas.some((c) => c.turma === k)).slice(0, 40).map(([k, n]) => `<button class="chip-btn" data-act="chamTurma" data-t="${esc(k)}">${esc(n.split(' · ')[0])}</button>`).join(' ')}</p>` : '<p>' + pill('ok', 'Todas as turmas já fizeram a chamada hoje.') + '</p>'}</div>`;
      if (!ch.turma) return `${topo}${sel}`;
      const linhas = alun.map((a, i) => {
        const aus = reg ? reg.ausentes.includes(a.ra) : !!O.susp.suspensoNo(a.ra, ch.data), atr = reg ? (reg.atrasos || []).includes(a.ra) : false;
        const su = O.susp.suspensoNo(a.ra, ch.data), ju = O.justif.cobre(a.ra, ch.data), sa = ld('saidas', []).find((x) => x.ra === a.ra && x.data === ch.data && x.st !== 'cancelada');
        return `<tr><td>${i + 1}</td><td>${esc(a.nome)}${a.gremio ? ' ' + pill('info', 'Grêmio') : ''}</td><td><label class="switch" style="padding:4px 8px"><input type="checkbox" name="f_${a.ra}" value="1"${aus ? ' checked' : ''} aria-label="Falta de ${esc(a.nome)}"></label></td><td><input type="checkbox" name="a_${a.ra}" value="1"${atr ? ' checked' : ''} aria-label="Atraso de ${esc(a.nome)}" style="width:auto"></td><td>${su ? pill('bad', 'Suspenso') : ''} ${ju ? pill('ok', 'Falta justificada') : ''} ${sa ? pill('warn', 'Saída antecipada') : ''}</td></tr>`;
      }).join('');
      return `${topo}${sel}<form class="card form" style="max-width:none" data-f="chamSalva"><h2>${esc(D.turmaNome(ch.turma))} · ${dt(ch.data)} ${reg ? pill('ok', 'chamada feita às ' + hm(reg.ts) + ' por ' + esc(reg.por)) : pill('warn', 'ainda não feita')}</h2>
        <div class="row-btns"><button type="button" class="btn ghost sm" data-act="chamTodos">Marcar todos presentes</button></div>
        <div class="tscroll"><table><thead><tr><th>Nº</th><th>Aluno</th><th>Falta</th><th>Atraso</th><th>Situação</th></tr></thead><tbody>${linhas}</tbody></table></div>
        <p class="muted">Alunos suspensos já vêm marcados com falta (e a falta não conta para a busca ativa). Faltas com atestado cadastrado em Justificativas também ficam justificadas.</p>
        <button class="btn" style="justify-self:start">Salvar chamada</button></form>`;
    },
  };
  BADGE.chamada = () => { if (!['secretaria'].includes(me().grupo)) return 0; const h = hoje(); if (!O.ehUtil(h)) return 0; return O.turmaOpts().length - O.cham.list().filter((c) => c.data === h).length; };
  C.ch = (el) => { ch[el.dataset.n] = el.value; };
  A.chamTurma = (el) => { ch.turma = el.dataset.t; };
  A.chamTodos = () => { O.$$('form[data-f="chamSalva"] input[name^="f_"]').forEach((i) => { i.checked = false; }); return false; };
  F.chamSalva = (d) => {
    const alun = D.alunosDa(ch.turma), aus = alun.filter((a) => d['f_' + a.ra]).map((a) => a.ra), atr = alun.filter((a) => d['a_' + a.ra]).map((a) => a.ra);
    O.cham.salvar(ch.turma, ch.data, aus, atr); toast(`Chamada salva: ${aus.length} falta(s), ${atr.length} atraso(s).`);
    const prox = O.turmaOpts().find(([k]) => !O.cham.de(k, ch.data)); if (prox) ch.turma = prox[0];
  };
  A.chamCsv = () => { const l = O.cham.list().filter((c) => c.data === ch.data), rows = [['Turma', 'Aluno', 'Situação']]; l.forEach((c) => D.alunosDa(c.turma).forEach((a) => { if (c.ausentes.includes(a.ra) || (c.atrasos || []).includes(a.ra)) rows.push([D.turmaNome(c.turma), a.nome, c.ausentes.includes(a.ra) ? 'Falta' : 'Atraso']); })); O.csv('chamada-' + ch.data, rows); return false; };

  /* ---------- justificativas de faltas ---------- */
  O.crud({
    key: 'justificativas', t: 'Justificativas de faltas e atestados', n: 'Justificativas', i: 'file', store: 'justif', edit: true, csv: true, novo: 'Registrar justificativa',
    intro: 'Atestado médico, declaração ou outro documento que justifica faltas. As faltas desse período ficam justificadas na chamada e na busca ativa.',
    campos: [{ n: 'ra', l: 'Aluno', tipo: 'aluno', req: 1 }, { n: 'de', l: 'De', tipo: 'date', def: 'hoje', req: 1 }, { n: 'ate', l: 'Até', tipo: 'date', def: 'hoje', req: 1 }, { n: 'tipo', l: 'Documento', tipo: 'sel', op: ['Atestado médico', 'Declaração de comparecimento', 'Falecimento na família', 'Declaração dos responsáveis', 'Outro'] }, { n: 'st', l: 'Situação', tipo: 'sel', op: ['Deferida', 'Pendente', 'Indeferida'] }, { n: 'obs', l: 'Observação', larg: 1 }],
    cols: [['de', 'Período', (v, r) => `${dt(v)} a ${dt(r.ate)}`], ['ra', 'Aluno', (v) => `${esc(alunoNome(v))}<br><small>${esc(alunoTurma(v))}</small>`], ['tipo', 'Documento'], ['obs', 'Obs.'], ['st', 'Situação', (v) => pill(v === 'Deferida' ? 'ok' : v === 'Indeferida' ? 'bad' : 'warn', v)]],
    busca: ['ra', 'obs'], filtros: [{ n: 'st', l: 'Situação', op: ['Deferida', 'Pendente', 'Indeferida'] }], ordem: (a, b) => b.de.localeCompare(a.de),
    valida: (r) => (r.ate < r.de ? 'A data final não pode ser antes da inicial.' : null),
  });

  /* ---------- cadastro do aluno e documentos ---------- */
  const DOCS_BASE = ['Certidão de nascimento ou casamento', 'RG do aluno', 'CPF do aluno', 'RG do responsável', 'CPF do responsável', 'Comprovante de residência', 'Cartão de vacina', 'Foto 3x4', 'Cartão SUS', 'Histórico escolar (se veio de outra escola)', 'Declaração de transferência', 'Termo de autorização de uso de imagem'];
  const docsDe = (a, f) => { const l = DOCS_BASE.slice(); if (a.curso) l.push('Termo de compromisso do curso técnico'); if (f.dados && f.dados.nee) l.push('Laudo médico / relatório (necessidades específicas)'); return l; };
  const CAMPOS_DADOS = [['nasc', 'Nascimento', 'date'], ['mae', 'Mãe'], ['pai', 'Pai'], ['resp', 'Responsável legal'], ['parent', 'Parentesco do responsável'], ['tel1', 'Telefone principal'], ['tel2', 'Telefone recado'], ['email', 'E-mail'], ['rg', 'RG do aluno'], ['cpf', 'CPF do aluno'], ['nis', 'NIS / Bolsa Família'], ['end', 'Endereço'], ['bairro', 'Bairro'], ['cidade', 'Cidade'], ['cep', 'CEP'], ['natur', 'Naturalidade'], ['transp', 'Transporte', 'sel', ['Nenhum / a pé', 'Transporte escolar', 'Transporte público', 'Carro / carona']], ['saude', 'Saúde (alergias, medicamentos, plano)']];
  const cd = { ra: '' };
  const fichaDe = (ra) => ld('sec_ficha', {})[ra] || { dados: {}, docs: {} };
  V.cadastro = {
    t: 'Cadastro e documentos do aluno', i: 'folder', n: 'Cadastro e documentos',
    r() {
      if (S.params.ra) { cd.ra = S.params.ra; S.params = {}; }
      const pick = `<form class="card form" style="max-width:none" data-f="cadSel"><h2>Procurar aluno</h2>${alunoPicker('aluno', { ra: cd.ra })}<button class="btn" style="justify-self:start">Abrir cadastro</button></form>`;
      const a = cd.ra ? alunoDe(cd.ra) : null; if (!a) return `<p class="muted intro">Ficha completa de cada aluno: dados da família, endereço, saúde e a conferência de todos os documentos, com o local onde está o papel no arquivo.</p>${pick}`;
      const f = fichaDe(a.ra), docs = docsDe(a, f), dd = f.dados || {};
      const ent = docs.filter((n) => (f.docs[n] || {}).st === 'Entregue').length, pend = docs.filter((n) => (f.docs[n] || {}).st === 'Pendente').length;
      const campo = ([n, l, t, op]) => t === 'sel' ? `<label>${l}<select name="d_${n}">${optHtml(op, dd[n])}</select></label>` : `<label>${l}<input name="d_${n}" type="${t || 'text'}" value="${esc(dd[n] || '')}" maxlength="120"></label>`;
      return `${pick}<form class="card form" style="max-width:none" data-f="fichaSalva"><div class="aluno-head"><span class="cav" style="background:linear-gradient(135deg,${O.corDe(a.nome)},#0b1240)">${esc(O.iniciais(a.nome))}</span><div style="flex:1"><h2 style="margin:0">${esc(a.nome)}</h2><p class="muted" style="margin:2px 0">RA ${a.ra} · matrícula ${a.matricula} · ${esc(TURMAS.rotulo(a))}${TURMAS.cursoDe(a) ? ' · ' + esc(TURMAS.cursoDe(a).nome) : ''}</p><p>${pill(pend ? 'warn' : 'ok', `${ent} de ${docs.length} documentos entregues`)} ${pend ? pill('bad', pend + ' pendente(s)') : ''}</p></div>
        <div class="row-btns"><button type="button" class="btn ghost sm" data-act="fichaPrint">${ic('print')} Imprimir ficha</button><button type="button" class="btn ghost sm" data-act="importAluno">Importar dados do aluno</button></div></div>
        <h3 style="margin-top:16px">Dados cadastrais</h3><div class="fields">${CAMPOS_DADOS.map(campo).join('')}<label class="switch"><input type="checkbox" name="d_nee" value="1"${dd.nee ? ' checked' : ''}><span>Tem necessidade específica / laudo</span></label></div>
        <h3 style="margin-top:16px">Conferência de documentos</h3><div class="row-btns"><button type="button" class="btn ghost sm" data-act="docTodos">Marcar todos como entregues</button></div>
        <div>${docs.map((n, i) => { const x = f.docs[n] || {}; return `<div class="doc-row"><span>${esc(n)}</span><select name="s_${i}" aria-label="Situação de ${esc(n)}">${optHtml(['Não conferido', 'Entregue', 'Pendente', 'Não se aplica'], x.st || 'Não conferido')}</select><input name="l_${i}" placeholder="Onde está no arquivo (pasta / gaveta)" value="${esc(x.local || '')}" maxlength="60" aria-label="Local do documento"></div>`; }).join('')}</div>
        <label>Observações do cadastro<textarea name="obs" rows="2" maxlength="500">${esc(f.obs || '')}</textarea></label>
        <div class="row-btns"><button class="btn">Salvar cadastro</button>${pend ? `<button type="button" class="btn ghost" data-act="docAviso" data-ra="${a.ra}">Avisar a família sobre as pendências</button>` : ''}</div></form>`;
    },
  };
  F.cadSel = (d) => { cd.ra = d.aluno; };
  F.fichaSalva = (d) => {
    const a = alunoDe(cd.ra), all = ld('sec_ficha', {}), f = all[cd.ra] || { dados: {}, docs: {} };
    CAMPOS_DADOS.forEach(([n]) => { f.dados[n] = d['d_' + n] || ''; }); f.dados.nee = !!d.d_nee; f.obs = d.obs || '';
    docsDe(a, f).forEach((n, i) => { f.docs[n] = { st: d['s_' + i] || 'Não conferido', local: d['l_' + i] || '', data: (f.docs[n] && f.docs[n].data) || (d['s_' + i] === 'Entregue' ? hoje() : '') }; });
    f.atualizado = now(); f.por = me().nome; all[cd.ra] = f; sv('sec_ficha', all); toast('Cadastro salvo.');
  };
  A.docTodos = () => { O.$$('form[data-f="fichaSalva"] select[name^="s_"]').forEach((s) => { s.value = 'Entregue'; }); return false; };
  A.importAluno = () => {
    const x = porAluno('dados').find((r) => r.ra === cd.ra); if (!x || !x.v) { toast('Esse aluno ainda não preencheu os dados no app dele.'); return false; }
    const all = ld('sec_ficha', {}), f = all[cd.ra] || { dados: {}, docs: {} }, v = x.v;
    Object.assign(f.dados, { nasc: v.nascimento || f.dados.nasc || '', rg: v.rg || f.dados.rg || '', cpf: v.cpf || f.dados.cpf || '', end: v.endereco || f.dados.end || '', bairro: v.bairro || f.dados.bairro || '', cidade: v.cidade || f.dados.cidade || '', mae: v.mae || f.dados.mae || '', pai: v.pai || f.dados.pai || '', tel1: v.respTel || f.dados.tel1 || '', tel2: v.tel || f.dados.tel2 || '', email: v.email || f.dados.email || '' });
    all[cd.ra] = f; sv('sec_ficha', all); toast('Dados importados do app do aluno. Confira e salve.');
  };
  A.fichaPrint = () => {
    const a = alunoDe(cd.ra), f = fichaDe(cd.ra), docs = docsDe(a, f), d = f.dados || {};
    O.imprimir('Ficha do aluno', `${O.cabecalho()}<h2 style="text-align:center">FICHA DO ALUNO</h2><table><tr><td><b>Nome</b></td><td colspan="3">${esc(a.nome)}</td></tr><tr><td><b>RA</b></td><td>${a.ra}</td><td><b>Matrícula</b></td><td>${a.matricula}</td></tr><tr><td><b>Turma</b></td><td colspan="3">${esc(TURMAS.rotulo(a))}</td></tr>${CAMPOS_DADOS.map(([n, l]) => `<tr><td><b>${l}</b></td><td colspan="3">${esc(d[n] || '')}</td></tr>`).join('')}</table>
    <h3>Documentos</h3><table>${docs.map((n) => `<tr><td>${esc(n)}</td><td>${esc((f.docs[n] || {}).st || 'Não conferido')}</td><td>${esc((f.docs[n] || {}).local || '')}</td></tr>`).join('')}</table><div class="rod">Emitido em ${dt(hoje())} por ${esc(O.quem())}</div>`); return false;
  };
  A.docAviso = (el) => { const ra = el.dataset.ra, f = fichaDe(ra), a = alunoDe(ra), pend = docsDe(a, f).filter((n) => (f.docs[n] || {}).st === 'Pendente'); const n = O.avisarFamilia(ra, `Secretaria: faltam os seguintes documentos de ${a.nome}: ${pend.join('; ')}. Pedimos que entregue na secretaria (seg. a sex., 7h às 17h).`, 'secretaria'); toast(n ? 'Família avisada no chat.' : 'Nenhum responsável vinculado no app. Avise por telefone.'); return false; };

  /* ---------- pendências de documentos ---------- */
  const dp = { turma: '', mostrar: 'pend' };
  function resumoDocs() {
    const all = ld('sec_ficha', {}), out = { completos: 0, pend: 0, naoConf: 0, linhas: [] };
    window.TURMAS.lista.forEach((a) => {
      const f = all[a.ra]; if (!f || !Object.keys(f.docs || {}).length) { out.naoConf++; out.linhas.push({ a, pend: [], nao: true }); return; }
      const docs = docsDe(a, f), pend = docs.filter((n) => ['Pendente', 'Não conferido'].includes((f.docs[n] || { st: 'Não conferido' }).st) && (f.docs[n] || {}).st === 'Pendente');
      if (pend.length) out.pend++; else out.completos++;
      out.linhas.push({ a, pend, nao: false });
    });
    return out;
  }
  V.docpend = {
    t: 'Pendências de documentos', i: 'alert', n: 'Documentos pendentes',
    r() {
      const r = resumoDocs(); let l = r.linhas.filter((x) => (!dp.turma || D.turmaKey(x.a) === dp.turma) && (dp.mostrar === 'pend' ? x.pend.length : dp.mostrar === 'nao' ? x.nao : true));
      return `<div class="kpis">${O.kpi('Cadastros completos', r.completos, 'sem pendência', 'ok')}${O.kpi('Com pendência', r.pend, 'faltam documentos', r.pend ? 'warn' : '')}${O.kpi('Ainda não conferidos', r.naoConf, 'sem ficha de documentos', '')}</div>
      <div class="card"><div class="filtros"><select data-ch="dp" data-n="turma"><option value="">Todas as turmas</option>${optHtml(O.turmaOpts(), dp.turma)}</select><select data-ch="dp" data-n="mostrar">${optHtml([['pend', 'Com pendência'], ['nao', 'Não conferidos'], ['todos', 'Todos']], dp.mostrar)}</select><button class="btn ghost sm" data-act="dpCsv">${ic('download')} Planilha</button></div><p class="muted">${l.length} aluno(s)</p>
      ${l.length ? `<div class="tscroll"><table><thead><tr><th>Aluno</th><th>Turma</th><th>Situação</th><th></th></tr></thead><tbody>${l.slice(0, 120).map((x) => `<tr><td>${esc(x.a.nome)}</td><td>${esc(x.a.serie)} ${esc(x.a.letra)}</td><td>${x.nao ? pill('', 'Não conferido') : x.pend.length ? x.pend.map((n) => pill('warn', n)).join(' ') : pill('ok', 'Completo')}</td><td class="acoes"><button class="btn ghost sm" data-go="cadastro" data-ra="${x.a.ra}">Abrir</button>${x.pend.length ? `<button class="btn ghost sm" data-act="docAviso" data-ra="${x.a.ra}">Avisar</button>` : ''}</td></tr>`).join('')}</tbody></table></div>${l.length > 120 ? '<p class="muted">Mostrando 120. Filtre por turma para ver o resto.</p>' : ''}` : vazio('Nada por aqui.')}</div>`;
    },
  };
  C.dp = (el) => { dp[el.dataset.n] = el.value; };
  A.dpCsv = () => { O.csv('documentos-pendentes', [['Aluno', 'Turma', 'Situação', 'Pendências']].concat(resumoDocs().linhas.filter((x) => x.pend.length || x.nao).map((x) => [x.a.nome, x.a.serie + ' ' + x.a.letra, x.nao ? 'Não conferido' : 'Pendente', x.pend.join('; ')]))); return false; };

  /* ---------- matrículas e transferências ---------- */
  O.crud({
    key: 'matriculas', t: 'Matrículas e transferências', i: 'users', store: 'sec_matric', edit: true, csv: true, novo: 'Novo processo',
    campos: [{ n: 'tipo', l: 'Tipo', tipo: 'sel', op: ['Matrícula nova', 'Rematrícula', 'Transferência recebida', 'Transferência expedida'] }, { n: 'nome', l: 'Nome do aluno', req: 1 }, { n: 'nasc', l: 'Nascimento', tipo: 'date' }, { n: 'serie', l: 'Série pretendida', tipo: 'sel', op: ['6º ano', '7º ano', '8º ano', '9º ano', '1º ano EM', '2º ano EM', '3º ano EM'] }, { n: 'turno', l: 'Turno', tipo: 'sel', op: ['Manhã', 'Tarde'] }, { n: 'resp', l: 'Responsável' }, { n: 'tel', l: 'Telefone' }, { n: 'esc', l: 'Escola de origem / destino' }, { n: 'st', l: 'Situação', tipo: 'sel', op: ['Em andamento', 'Aguardando documentos', 'Concluída', 'Cancelada'] }, { n: 'obs', l: 'Documentos que faltam / observações', tipo: 'area' }],
    cols: [['ts', 'Aberto em', (v) => O.fdt(v).split(' ')[0]], ['tipo', 'Tipo'], ['nome', 'Aluno', (v, r) => `${esc(v)}<br><small>${esc(r.serie || '')} ${esc(r.turno || '')}</small>`], ['resp', 'Responsável', (v, r) => `${esc(v || '')}<br><small>${esc(r.tel || '')}</small>`], ['esc', 'Escola'], ['st', 'Situação', (v) => pill(v === 'Concluída' ? 'ok' : v === 'Cancelada' ? 'bad' : 'warn', v)], ['obs', 'Obs.']],
    busca: ['nome', 'resp', 'esc'], filtros: [{ n: 'tipo', l: 'Tipo', op: ['Matrícula nova', 'Rematrícula', 'Transferência recebida', 'Transferência expedida'] }, { n: 'st', l: 'Situação', op: ['Em andamento', 'Aguardando documentos', 'Concluída', 'Cancelada'] }],
    acoes: [{ k: 'ok', l: 'Concluir', se: (r) => !['Concluída', 'Cancelada'].includes(r.st), fn: (r) => ({ ...r, st: 'Concluída' }) }],
    resumo: (l) => `<div class="kpis">${O.kpi('Em andamento', l.filter((r) => r.st === 'Em andamento').length, '', '')}${O.kpi('Aguardando documentos', l.filter((r) => r.st === 'Aguardando documentos').length, '', 'warn')}${O.kpi('Concluídas', l.filter((r) => r.st === 'Concluída').length, '', 'ok')}</div>`,
  });

  /* ---------- declarações e documentos emitidos ---------- */
  const TIPOS_DEC = ['Declaração de matrícula / escolaridade', 'Declaração de comparecimento', 'Declaração de frequência', 'Declaração de transferência', 'Boletim / ficha individual'];
  const dc = { ra: '' };
  const docHtml = (r) => {
    const a = alunoDe(r.ra) || { nome: r.ra, ra: r.ra, serie: '', letra: '' }, rodape = `<div class="ass"><div>Secretaria</div><div>Direção</div></div><div class="rod">Protocolo ${esc(r.protocolo)} · Código de autenticação ${O.codigoAut(r.protocolo + r.ra)} · Emitido em ${O.fdt(r.ts)} por ${esc(r.por)}</div>`;
    const ident = `<b>${esc(a.nome)}</b>, RA ${esc(a.ra)}, ${a.serie ? `turma <b>${esc(a.serie)} ${esc(a.letra)}</b> (${esc(a.turno || '')})` : ''}`;
    let corpo = '';
    if (r.tipo.startsWith('Declaração de matrícula')) corpo = `<p>Declaramos, para os devidos fins${r.fin ? ' (' + esc(r.fin) + ')' : ''}, que ${ident}, está regularmente matriculado(a) nesta unidade escolar no ano letivo de ${new Date().getFullYear()}.</p>`;
    else if (r.tipo === 'Declaração de comparecimento') corpo = `<p>Declaramos que ${esc(r.resp || 'o(a) responsável pelo(a) aluno(a)')} compareceu a esta unidade escolar em <b>${dt(r.dataC || hoje())}</b>${r.horario ? ', no horário ' + esc(r.horario) : ''}${r.fin ? ', para ' + esc(r.fin) : ''}, referente ao(à) aluno(a) ${ident}.</p>`;
    else if (r.tipo === 'Declaração de frequência') { const bol = TURMAS.boletim(a), fr = D.freqDe(a, bol.freq); let au = 0, fa = 0; Object.values(fr).forEach(([x, y]) => { au += x; fa += y; }); corpo = `<p>Declaramos que ${ident}, frequenta regularmente esta unidade, com frequência de <b>${au ? (((au - fa) / au) * 100).toFixed(1).replace('.', ',') : '100'}%</b> até a data de hoje (${fa} falta(s) em ${au} aulas).</p>`; }
    else if (r.tipo === 'Declaração de transferência') corpo = `<p>Declaramos que foi solicitada nesta unidade a transferência do(a) aluno(a) ${ident}, ${r.fin ? 'para ' + esc(r.fin) + ', ' : ''}estando a documentação em trâmite. O histórico escolar será entregue no prazo regulamentar.</p>`;
    else { const bol = TURMAS.boletim(a), notas = D.notasDe(a, bol.notas); corpo = `<h3>Boletim — ${new Date().getFullYear()}</h3><p>${ident}</p><table><tr><th>Disciplina</th><th>1º</th><th>2º</th><th>3º</th><th>4º</th></tr>${Object.entries(notas).map(([d, n]) => `<tr><td>${esc(d)}</td>${n.map((v) => `<td>${v === null ? '–' : v}</td>`).join('')}</tr>`).join('')}</table>`; }
    return `${O.cabecalho()}<h2 style="text-align:center">${esc(r.tipo.toUpperCase())}</h2>${corpo}<p style="margin-top:40px">São Paulo, ${new Date(r.ts).toLocaleDateString('pt-BR', { dateStyle: 'long' })}.</p>${rodape}`;
  };
  V.declaracoes = {
    t: 'Declarações e documentos', i: 'print', n: 'Declarações',
    r() {
      if (S.params.ra) { dc.ra = S.params.ra; S.params = {}; }
      const hist = ld('sec_emit', []).sort((a, b) => b.ts - a.ts).slice(0, 30);
      return `<form class="card form" style="max-width:none" data-f="decEmite"><h2>Emitir documento</h2><div class="fields">${alunoPicker('aluno', { ra: dc.ra })}<label>Documento<select name="tipo">${optHtml(TIPOS_DEC)}</select></label>
        <label>Finalidade / destino<input name="fin" maxlength="100" placeholder="Ex.: estágio, passe escolar, outra escola"></label><label>Data do comparecimento<input type="date" name="dataC" value="${hoje()}"></label><label>Horário (comparecimento)<input name="horario" maxlength="30" placeholder="08h às 09h"></label><label>Quem compareceu<input name="resp" maxlength="80"></label></div>
        <button class="btn" style="justify-self:start">${ic('print')} Gerar e imprimir</button></form>
      <div class="card"><h2>Emitidos recentemente</h2>${hist.length ? `<ul class="list">${hist.map((r) => `<li><span><b>${esc(r.tipo)}</b> · ${esc(alunoNome(r.ra))}<br><small class="muted">${esc(r.protocolo)} · ${O.fdt(r.ts)} · ${esc(r.por)}</small></span><button class="btn ghost sm" data-act="decRe" data-id="${r.id}">${ic('print')} Reimprimir</button></li>`).join('')}</ul>` : vazio('Nenhum documento emitido ainda.')}</div>`;
    },
  };
  F.decEmite = (d) => {
    if (!d.aluno) { toast('Escolha o aluno.'); return false; } const seq = ld('org_seq', {}); seq.doc = (seq.doc || 0) + 1; sv('org_seq', seq);
    const r = { id: id(), protocolo: `DOC-${new Date().getFullYear()}-${String(seq.doc).padStart(4, '0')}`, ra: d.aluno, tipo: d.tipo, fin: d.fin, dataC: d.dataC, horario: d.horario, resp: d.resp, ts: now(), por: O.quem() };
    sv('sec_emit', [...ld('sec_emit', []), r]); dc.ra = d.aluno; O.imprimir(r.tipo, docHtml(r)); toast('Documento gerado: ' + r.protocolo);
  };
  A.decRe = (el) => { const r = ld('sec_emit', []).find((x) => x.id === el.dataset.id); O.imprimir(r.tipo, docHtml(r)); return false; };

  /* ---------- pedidos de documentos feitos pelos alunos ---------- */
  const pa = { st: '' };
  V.pedidosAluno = {
    t: 'Pedidos de documentos dos alunos', i: 'download', n: 'Pedidos dos alunos',
    r() {
      let l = []; porAluno('pedidos').forEach((x) => (x.v || []).forEach((p) => l.push({ ...p, ra: x.ra, key: x.key })));
      l = l.filter((p) => !pa.st || p.st === pa.st).sort((a, b) => (b.id > a.id ? 1 : -1));
      const ST = { pedido: ['warn', 'Solicitado'], analise: ['', 'Em preparo'], pronto: ['ok', 'Pronto'] };
      return `<p class="muted intro">Os alunos pedem declarações, histórico e outros documentos pelo app. Mude o andamento aqui e eles acompanham.</p><div class="card"><div class="filtros"><select data-ch="pa" data-n="st"><option value="">Todos</option>${optHtml([['pedido', 'Solicitados'], ['analise', 'Em preparo'], ['pronto', 'Prontos']], pa.st)}</select></div>
      ${l.length ? `<div class="tscroll"><table><thead><tr><th>Aluno</th><th>Documento</th><th>Entrega</th><th>Situação</th><th></th></tr></thead><tbody>${l.map((p) => `<tr><td>${esc(alunoNome(p.ra))}<br><small>${esc(alunoTurma(p.ra))}</small></td><td>${esc(p.doc)}${p.obs ? `<br><small>${esc(p.obs)}</small>` : ''}</td><td>${esc(p.entrega || '')}<br><small>${esc(p.at || '')}</small></td><td>${pill(...ST[p.st])}</td><td class="acoes"><select data-ch="paSt" data-key="${esc(p.key)}" data-id="${p.id}" aria-label="Andamento">${optHtml(Object.entries(ST).map(([k, v]) => [k, v[1]]), p.st)}</select> <button class="btn ghost sm" data-go="declaracoes" data-ra="${p.ra}">Emitir</button></td></tr>`).join('')}</tbody></table></div>` : vazio('Nenhum pedido dos alunos.')}</div>`;
    },
  };
  BADGE.pedidosAluno = () => porAluno('pedidos').reduce((n, x) => n + (x.v || []).filter((p) => p.st === 'pedido').length, 0);
  C.pa = (el) => { pa[el.dataset.n] = el.value; };
  C.paSt = (el) => { try { const v = JSON.parse(localStorage.getItem(el.dataset.key)) || []; localStorage.setItem(el.dataset.key, JSON.stringify(v.map((p) => (p.id == el.dataset.id ? { ...p, st: el.value } : p)))); } catch { /* ignora */ } toast('Andamento atualizado para o aluno.'); };

  /* ---------- fila de atendimento ---------- */
  const filaHoje = () => ld('sec_fila', []).filter((t) => t.dia === hoje());
  V.fila = {
    t: 'Fila de atendimento', i: 'ticket',
    r() {
      const l = filaHoje(), esp = l.filter((t) => t.st === 'aguardando').sort((a, b) => (b.prio === 'P') - (a.prio === 'P') || a.ts - b.ts), at = l.filter((t) => t.st === 'atendendo'), fim = l.filter((t) => t.st === 'concluido'), atual = at.sort((a, b) => b.chamTs - a.chamTs)[0];
      const espera = fim.concat(at).filter((t) => t.chamTs); const medio = espera.length ? Math.round(espera.reduce((s, t) => s + (t.chamTs - t.ts), 0) / espera.length / 60000) : 0;
      return `<div class="grid"><div class="senha"><small>${atual ? 'Chamando agora' : 'Ninguém sendo atendido'}</small><b>${atual ? esc(atual.num) : '—'}</b>${atual ? `<span>${esc(atual.nome)} · ${esc(atual.assunto)}</span>` : ''}<div class="row-btns" style="margin-top:14px;justify-content:center"><button class="btn" style="background:#fff;color:var(--h1)" data-act="filaProx">Chamar próxima senha</button>${atual ? `<button class="btn ghost" style="color:#fff;border-color:#fff" data-act="filaFim" data-id="${atual.id}">Concluir atendimento</button>` : ''}</div></div>
        <form class="card form" data-f="filaNova"><h2>Emitir senha</h2><input name="nome" required maxlength="60" placeholder="Nome da pessoa"><select name="assunto">${optHtml(['Matrícula / rematrícula', 'Documentos e declarações', 'Atendimento da direção', 'Atendimento da coordenação', 'Entrega de documentos', 'Informações gerais', 'Outro'])}</select><label class="switch"><input type="checkbox" name="prio" value="P"><span>Atendimento prioritário<small>Idosos, gestantes, pessoas com deficiência…</small></span></label><button class="btn">Emitir senha</button></form></div>
      <div class="kpis">${O.kpi('Aguardando', esp.length, '', esp.length > 5 ? 'warn' : '')}${O.kpi('Atendidos hoje', fim.length, '', 'ok')}${O.kpi('Espera média', medio + ' min', 'até ser chamado', '')}</div>
      <div class="card"><h2>Na fila (${esp.length})</h2>${esp.length ? `<ul class="list">${esp.map((t) => `<li><span><b>${esc(t.num)}</b> ${t.prio === 'P' ? pill('info', 'Prioritário') : ''} ${esc(t.nome)}<br><small class="muted">${esc(t.assunto)} · chegou ${hm(t.ts)}</small></span><button class="btn ghost sm" data-act="filaNo" data-id="${t.id}">Desistiu</button></li>`).join('')}</ul>` : vazio('Fila vazia. 🎉')}</div>`;
    },
  };
  BADGE.fila = () => filaHoje().filter((t) => t.st === 'aguardando').length;
  const filaSet = (i, p) => sv('sec_fila', ld('sec_fila', []).map((t) => (t.id === i ? { ...t, ...p } : t)));
  F.filaNova = (d) => { const hojeL = filaHoje(), pre = d.prio ? 'P' : 'N', n = hojeL.filter((t) => t.prio === pre || (!d.prio && t.prio !== 'P')).length + 1; const num = pre + String(n).padStart(3, '0'); sv('sec_fila', [...ld('sec_fila', []), { id: id(), num, nome: d.nome, assunto: d.assunto, prio: pre, dia: hoje(), ts: now(), st: 'aguardando', por: me().nome }]); toast('Senha ' + num + ' emitida.'); };
  A.filaProx = () => { const l = filaHoje(); l.filter((t) => t.st === 'atendendo').forEach((t) => filaSet(t.id, { st: 'concluido', fimTs: now() })); const prox = filaHoje().filter((t) => t.st === 'aguardando').sort((a, b) => (b.prio === 'P') - (a.prio === 'P') || a.ts - b.ts)[0]; if (!prox) { toast('Não há ninguém na fila.'); return; } filaSet(prox.id, { st: 'atendendo', chamTs: now(), guiche: me().nome }); toast('Chamando ' + prox.num); };
  A.filaFim = (el) => { filaSet(el.dataset.id, { st: 'concluido', fimTs: now() }); };
  A.filaNo = (el) => { filaSet(el.dataset.id, { st: 'desistiu' }); };

  /* ---------- protocolo e arquivo ---------- */
  O.crud({
    key: 'protocolo', t: 'Protocolo e arquivo (ofícios, atas, requerimentos)', n: 'Protocolo e arquivo', i: 'folder', store: 'sec_proto', edit: true, csv: true, novo: 'Novo registro de protocolo',
    intro: 'Livro de protocolo digital: tudo que entra e sai da escola ganha um número e um endereço no arquivo físico (pasta ou gaveta).',
    campos: [{ n: 'tipo', l: 'Tipo', tipo: 'sel', op: ['Ofício recebido', 'Ofício expedido', 'Memorando', 'Requerimento', 'Ata', 'Circular', 'Declaração', 'Processo / outro'] }, { n: 'assunto', l: 'Assunto', req: 1, larg: 1 }, { n: 'origem', l: 'Origem / destino', ph: 'Ex.: Diretoria de Ensino' }, { n: 'data', l: 'Data', tipo: 'date', def: 'hoje' }, { n: 'prazo', l: 'Prazo de resposta', tipo: 'date' }, { n: 'local', l: 'Onde está no arquivo', ph: 'Pasta 12 / gaveta 3' }, { n: 'st', l: 'Situação', tipo: 'sel', op: ['Em andamento', 'Respondido', 'Arquivado'] }, { n: 'obs', l: 'Observações', tipo: 'area' }],
    cols: [['numero', 'Nº'], ['data', 'Data', (v) => dt(v)], ['tipo', 'Tipo'], ['assunto', 'Assunto', (v, r) => `${esc(v)}<br><small>${esc(r.origem || '')}</small>`], ['prazo', 'Prazo', (v, r) => v ? `${dt(v)}${r.st === 'Em andamento' && v < hoje() ? ' ' + pill('bad', 'vencido') : ''}` : ''], ['local', 'Arquivo'], ['st', 'Situação', (v) => pill(v === 'Em andamento' ? 'warn' : 'ok', v)]],
    busca: ['numero', 'assunto', 'origem', 'tipo', 'local'], filtros: [{ n: 'tipo', l: 'Tipo', op: ['Ofício recebido', 'Ofício expedido', 'Memorando', 'Requerimento', 'Ata', 'Circular', 'Declaração', 'Processo / outro'] }, { n: 'st', l: 'Situação', op: ['Em andamento', 'Respondido', 'Arquivado'] }],
    ordem: (a, b) => (b.numero || '').localeCompare(a.numero || ''),
    pre: (r, v) => { if (v && v.numero) return r; const s = ld('org_seq', {}); s.prot = (s.prot || 0) + 1; sv('org_seq', s); return { ...r, numero: `${String(s.prot).padStart(3, '0')}/${new Date().getFullYear()}` }; },
    acoes: [{ k: 'ok', l: 'Respondido', se: (r) => r.st === 'Em andamento', fn: (r) => ({ ...r, st: 'Respondido' }) }, { k: 'arq', l: 'Arquivar', se: (r) => r.st !== 'Arquivado', fn: (r) => ({ ...r, st: 'Arquivado' }) }],
  });
})();
