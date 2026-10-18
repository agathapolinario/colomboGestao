/* Colombo · tela inicial de cada cargo + dados de demonstração */
(() => {
  'use strict';
  const O = window.ORG, { V, esc, ic, ld, sv, id, now, hoje, dt, pill, vazio } = O;
  const hora = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
  const ult = (l, n = 5) => l.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, n);
  const pend = (m) => O.pedidos.abertos().filter((p) => p.setor === m.setor || p.por === m.uid);
  const bd = (k) => (O.BADGE[k] ? O.BADGE[k]() : 0);

  const kpisDe = (m) => {
    const h = hoje(), ped = O.pedidos.abertos(), atras = ped.filter(O.pedidos.atrasado).length, susp = O.susp.ativas().length;
    const chamFeitas = O.cham.list().filter((c) => c.data === h).length, nT = O.turmaOpts().length;
    const k = [];
    if (m.ehGestao) {
      k.push(O.kpi('Suspensões em curso', susp, `${O.susp.futuras().length} agendada(s)`, susp ? 'warn' : '', 'suspensoes'));
      k.push(O.kpi('Ocorrências (7 dias)', O.ocorr.list().filter((o) => (o.data || '') >= O.antes(7)).length, 'lançadas', '', 'ocorrencias'));
      k.push(O.kpi('Pedidos abertos', ped.length, atras ? `${atras} atrasado(s)` : 'em dia', atras ? 'bad' : 'ok', 'pedidos'));
      k.push(O.kpi('Chamadas de hoje', `${chamFeitas}/${nT}`, 'turmas', chamFeitas < nT ? 'warn' : 'ok', 'acompanhamento'));
    } else if (m.grupo === 'secretaria') {
      k.push(O.kpi('Fila agora', bd('fila'), 'aguardando', bd('fila') ? 'warn' : 'ok', 'fila'));
      k.push(O.kpi('Chamadas de hoje', `${chamFeitas}/${nT}`, 'turmas', chamFeitas < nT ? 'warn' : 'ok', 'chamada'));
      k.push(O.kpi('Pedidos de alunos', bd('pedidosAluno'), 'a atender', bd('pedidosAluno') ? 'warn' : '', 'pedidosAluno'));
      k.push(O.kpi('Meus pedidos abertos', pend(m).length, '', '', 'pedidos'));
    } else if (m.grupo === 'goe') {
      k.push(O.kpi('Pedidos do setor', O.pedidos.doSetor('goe').length, `${O.pedidos.doSetor('goe').filter(O.pedidos.atrasado).length} atrasado(s)`, '', 'pedidos'));
      k.push(O.kpi('Estoque baixo', bd('estoque'), 'itens', bd('estoque') ? 'bad' : 'ok', 'estoque'));
      k.push(O.kpi('Equipe ativa', ld('goe_func', []).filter((f) => f.st === 'Ativo').length, '', '', 'pessoal'));
      k.push(O.kpi('Professores ausentes', ld('falta_prof', []).filter((f) => f.data === h).length, 'hoje', '', 'profausentes'));
    } else if (m.grupo === 'seguranca') {
      k.push(O.kpi('Visitantes dentro', bd('visitantes'), '', bd('visitantes') ? 'warn' : 'ok', 'visitantes'));
      k.push(O.kpi('Saídas autorizadas', ld('saidas', []).filter((s) => s.data === h && s.st === 'autorizada').length, 'hoje', '', 'saidas'));
      k.push(O.kpi('Suspensos hoje', susp, 'não podem entrar', susp ? 'warn' : '', 'suspensoes'));
      k.push(O.kpi('Chamados para mim', bd('chamados'), '', '', 'chamados'));
    } else if (m.grupo === 'limpeza') {
      const t = (ld('limpeza_dia', {})[h] || {});
      k.push(O.kpi('Áreas feitas hoje', Object.values(t).filter(Boolean).length, 'de 24 marcações', '', 'limpezaDia'));
      k.push(O.kpi('Chamados para mim', bd('chamados'), '', bd('chamados') ? 'warn' : 'ok', 'chamados'));
    } else if (m.grupo === 'cuidadora') {
      k.push(O.kpi('Registros de hoje', ld('cui_reg', []).filter((r) => r.data === h).length, '', '', 'cuidado'));
      k.push(O.kpi('Chamados para mim', bd('chamados'), '', '', 'chamados'));
    } else if (m.grupo === 'aee') {
      k.push(O.kpi('Atendimentos (7 dias)', ld('aee_reg', []).filter((r) => r.data >= O.antes(7)).length, '', '', 'aeeAlunos'));
      k.push(O.kpi('Chamados para mim', bd('chamados'), '', '', 'chamados'));
    } else { // agente
      k.push(O.kpi('Fora de sala hoje', ld('agt_fora', []).filter((r) => r.data === h).length, '', '', 'foraSala'));
      k.push(O.kpi('Atrasos hoje', ld('agt_atrasos', []).filter((r) => r.data === h).length, '', '', 'atrasos'));
      k.push(O.kpi('Chamados para mim', bd('chamados'), '', bd('chamados') ? 'warn' : 'ok', 'chamados'));
      k.push(O.kpi('Suspensos hoje', susp, '', '', 'suspensoes'));
    }
    return k.join('');
  };

  V.inicio = {
    t: 'Início', i: 'home',
    r() {
      const m = O.me(), ks = O.navDe(m.cargo).flatMap(([, l]) => l).filter((k) => k !== 'inicio' && k !== 'perfil' && V[k]);
      const sus = O.susp.ativas().slice(0, 4), ped = ult(pend(m), 5), av = ult(ld('avisos', []), 3);
      return `<section class="card hero"><div><span class="eyebrow">${esc(m.cargoNome)}</span><h2>${hora()}, ${esc(m.nome.split(' ')[0])}!</h2><p>E.E. Colombo de Almeida · ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div></section>
      <div class="kpis">${kpisDe(m)}</div>
      <div class="card"><h2>Atalhos</h2><div class="grid tiles">${ks.slice(0, 12).map((k) => O.tile(k, V[k].i || 'list', V[k].n || V[k].t, '', bd(k))).join('')}</div></div>
      <div class="grid">
        <div class="card"><h2>Pedidos do meu setor</h2>${ped.length ? `<ul class="list">${ped.map((p) => `<li><span><b>${esc(p.titulo)}</b><br><small class="muted">${esc(p.num)} · prazo ${dt(p.prazo)}</small></span>${pill(O.pedidos.atrasado(p) ? 'bad' : 'warn', O.pedidos.atrasado(p) ? 'Atrasado' : (O.PED_ST[p.st] || [p.st])[0] || p.st)}</li>`).join('')}</ul><button class="btn ghost sm" data-go="pedidos">Ver todos</button>` : vazio('Nenhum pedido aberto.')}</div>
        <div class="card"><h2>Suspensões em curso</h2>${sus.length ? `<ul class="list">${sus.map((s) => `<li><span><b>${esc(O.alunoNome(s.ra))}</b> · ${esc(O.alunoTurma(s.ra))}<br><small class="muted">até ${dt(s.fim)} · ${esc(s.motivo)}</small></span>${pill('bad', 'Suspenso')}</li>`).join('')}</ul>` : vazio('Nenhum aluno suspenso hoje.')}</div>
      </div>
      ${av.length ? `<div class="card"><h2>Mural</h2><ul class="list">${av.map((a) => `<li><span><b>${esc(a.titulo || a.t || '')}</b><br><small class="muted">${esc(a.texto || a.msg || '')}</small></span></li>`).join('')}</ul></div>` : ''}`;
    },
  };

  /* ---------- demonstração ---------- */
  const STORES = ['ocorr', 'susp', 'convoc', 'org_ped', 'goe_func', 'goe_estoque', 'seg_visit', 'agt_atrasos', 'agt_fora', 'sec_proto', 'goe_patr', 'goe_fin', 'cui_reg', 'aee_reg', 'achados', 'seg_incid', 'justif', 'sec_matric'];
  O.seed = {
    ligar() {
      const L = window.TURMAS.lista, a = (i) => L[i * 37 % L.length], m = O.me(), h = hoje(), add = (k, l) => sv(k, [...ld(k, []), ...l.map((x) => ({ id: id(), ts: now(), seed: true, por: 'Demonstração', ...x }))]);
      add('ocorr', [{ aluno: a(1).ra, tipo: 'Desrespeito a colega', data: h, hora: '09:40', local: 'Pátio', obs: 'Discussão durante o intervalo.', prof: 'Coordenação', st: 'registrada', interno: false }, { aluno: a(2).ra, tipo: 'Uso de celular em sala', data: h, hora: '10:20', local: 'Sala', obs: 'Reincidência.', prof: 'Coordenação', st: 'registrada', interno: false }]);
      add('susp', [{ ra: a(3).ra, inicio: h, fim: O.fimPorDias(h, 2), dias: 2, motivo: 'Agressão física a colega', detalhe: 'Demonstração.', atividades: 'Lista de exercícios enviada.', cancelada: false, cienciaResp: null, cienciaAluno: null, cargoNome: m.cargoNome }]);
      add('org_ped', [{ num: 'PED-DEMO-0001', titulo: 'Lâmpada queimada na sala 2º B', desc: 'Sala escura no fundo.', cat: 'manut', prio: 'normal', local: 'Sala 2º B', setor: 'goe', por: 'demo', porNome: 'Professor(a) demo', st: 'aberto', atualizado: now(), prazo: O.somaDias(h, 5), hist: [{ ts: now(), por: 'Demonstração', t: 'Pedido aberto' }] }, { num: 'PED-DEMO-0002', titulo: 'Projetor da sala 8 não liga', cat: 'ti', prio: 'alta', local: 'Sala 8', setor: 'goe', por: 'demo', porNome: 'Professor(a) demo', st: 'aberto', atualizado: now(), prazo: O.somaDias(h, -1), hist: [{ ts: now(), por: 'Demonstração', t: 'Pedido aberto' }] }]);
      add('goe_func', [{ nome: 'Maria das Dores', funcao: 'Limpeza', turno: 'Manhã', st: 'Ativo', vinculo: 'Terceirizado' }, { nome: 'José Carlos', funcao: 'Segurança', turno: 'Integral', st: 'Ativo', vinculo: 'Terceirizado' }, { nome: 'Aparecida Lima', funcao: 'Agente escolar', turno: 'Tarde', st: 'Ativo', vinculo: 'Efetivo' }]);
      add('goe_estoque', [{ item: 'Papel higiênico', cat: 'Limpeza', un: 'fardos', qtd: 2, min: 5 }, { item: 'Sabonete líquido', cat: 'Limpeza', un: 'L', qtd: 12, min: 6 }, { item: 'Papel sulfite A4', cat: 'Papelaria', un: 'resmas', qtd: 3, min: 10 }]);
      add('seg_visit', [{ nome: 'Carlos Menezes', doc: '12.345.678-9', destino: 'Secretaria', quem: 'Secretaria', cracha: '7', data: h, ent: now() - 36e5, sai: 0 }]);
      add('agt_atrasos', [{ ra: a(4).ra, data: h, hora: '07:25', motivo: 'Transporte', acao: 'Entrou na sala' }]);
      add('sec_proto', [{ numero: '001/' + new Date().getFullYear(), tipo: 'Ofício recebido', assunto: 'Calendário de avaliações externas', origem: 'Diretoria de Ensino', data: h, prazo: O.somaDias(h, 10), local: 'Pasta 3', st: 'Em andamento' }]);
      sv('cardapio', { Segunda: 'Arroz, feijão, frango assado e salada', 'Terça': 'Macarronada com carne moída e legumes', Quarta: 'Arroz, feijão, omelete e couve', Quinta: 'Risoto de frango com cenoura', Sexta: 'Arroz, feijão, peixe assado e purê' });
    },
    limpar() {
      STORES.forEach((k) => { const l = ld(k, []); if (Array.isArray(l)) sv(k, l.filter((x) => !x.seed)); });
    },
  };
})();
