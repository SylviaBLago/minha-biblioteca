import { useMemo } from 'react';
import type { Livro, HistoricoLeitura } from '../types/livro';
import { formatosDoLivro } from '../types/livro';

export default function EstatisticasLiterarias({ livros }: { livros: Livro[] }) {
  const resumo = useMemo(() => {
    const colecao = livros.filter(l => formatosDoLivro(l).length > 0);
    const registros = livros.flatMap(l => (l.historico?.length
      ? l.historico
      : [{ id: l.id, status: l.status, nota: l.nota, dataFim: l.dataFim ?? null } as HistoricoLeitura]
    ).map(leitura => ({ livro: l, leitura })))
      .filter(({ leitura }) => leitura.status !== 'quero_ler');
    const concluidas = registros.filter(({ leitura }) => leitura.status === 'concluido');
    const notas = registros.map(({ leitura }) => leitura.nota).filter((nota): nota is number => nota !== null && Number.isFinite(nota));
    const generos = new Map<string, number>();
    for (const { livro } of concluidas) {
      const genero = livro.genero.trim() || 'Não informado';
      generos.set(genero, (generos.get(genero) ?? 0) + 1);
    }
    const anos = new Map<string, number>();
    for (const { leitura } of concluidas) {
      const ano = leitura.dataFim?.slice(0, 4);
      if (ano && /^\d{4}$/.test(ano)) anos.set(ano, (anos.get(ano) ?? 0) + 1);
    }
    return {
      livros: colecao.length,
      concluidas: concluidas.length,
      unicos: new Set(concluidas.map(({ livro }) => livro.id)).size,
      andamento: registros.filter(({ leitura }) => leitura.status === 'lendo').length,
      avaliadas: notas.length,
      notaMedia: notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—',
      generos: [...generos].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR')).slice(0, 7),
      anos: [...anos].sort((a, b) => a[0].localeCompare(b[0])),
    };
  }, [livros]);

  const maxGenero = Math.max(1, ...resumo.generos.map(([, valor]) => valor));
  const maxAno = Math.max(1, ...resumo.anos.map(([, valor]) => valor));
  return <div className="estatisticas-painel">
    <div className="estatisticas-intro"><span className="subtitulo">SUA VIDA ENTRE LIVROS</span><h3>Suas histórias em números</h3><p>Um retrato das leituras registradas na sua biblioteca.</p></div>
    <section className="estatisticas-resumo" aria-label="Indicadores de leitura">
      <div className="estatistica-card"><span>Livros na estante</span><strong>{resumo.livros}</strong><small>Títulos que você possui</small></div>
      <div className="estatistica-card"><span>Leituras concluídas</span><strong>{resumo.concluidas}</strong><small>{resumo.unicos} {resumo.unicos === 1 ? 'título diferente' : 'títulos diferentes'} · inclui releituras</small></div>
      <div className="estatistica-card"><span>Lendo atualmente</span><strong>{resumo.andamento}</strong><small>Leituras em andamento</small></div>
      <div className="estatistica-card"><span>Nota média</span><strong>{resumo.notaMedia}</strong><small>{resumo.avaliadas} {resumo.avaliadas === 1 ? 'avaliação' : 'avaliações'} · escala de 0 a 10</small></div>
    </section>
    <div className="estatisticas-secoes">
      <section className="estatisticas-bloco"><h4>Gêneros mais lidos</h4><p>Contagem de leituras concluídas por gênero, incluindo releituras.</p>
        {resumo.generos.length ? <div className="estatisticas-barras">{resumo.generos.map(([nome, valor]) => <div className="estatisticas-barra" key={nome}>
          <div className="estatisticas-barra-label"><span>{nome}</span><strong>{valor}</strong></div>
          <div className="estatisticas-trilho"><div style={{ width: `${100 * valor / maxGenero}%` }} /></div>
        </div>)}</div> : <div className="estatisticas-vazio">Os gêneros aparecerão aqui quando você concluir suas primeiras leituras.</div>}
      </section>
      <section className="estatisticas-bloco"><h4>Leituras por ano</h4><p>Ano de conclusão informado em cada leitura.</p>
        {resumo.anos.length ? <div className="estatisticas-barras">{resumo.anos.map(([ano, valor]) => <div className="estatisticas-barra" key={ano}>
          <div className="estatisticas-barra-label"><span>{ano}</span><strong>{valor}</strong></div>
          <div className="estatisticas-trilho"><div style={{ width: `${100 * valor / maxAno}%` }} /></div>
        </div>)}</div> : <div className="estatisticas-vazio">Registre uma data de término para acompanhar suas leituras ao longo dos anos.</div>}
      </section>
    </div>
    <p className="estatisticas-nota">Os indicadores são calculados a partir dos seus registros; leituras sem data de término não entram no gráfico anual.</p>
  </div>;
}
