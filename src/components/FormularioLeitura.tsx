import { useState, type FormEvent } from 'react';
import { X, Save } from 'lucide-react';
import type { HistoricoLeitura, StatusLivro } from '../types/livro';
import { ROTULOS_STATUS } from '../types/livro';

export type DadosLeitura = {
  status: StatusLivro; paginaAtual: number; dataInicio: string | null;
  dataFim: string | null; nota: number | null; favorito: boolean;
};
type Props = { titulo: string; paginas: number | null; leitura?: HistoricoLeitura | null;
  aoSalvar: (dados: DadosLeitura) => Promise<void>; aoFechar: () => void; salvando: boolean };
export default function FormularioLeitura({ titulo, paginas, leitura, aoSalvar, aoFechar, salvando }: Props) {
  const [dados, setDados] = useState<DadosLeitura>({
    status: leitura?.status === 'quero_ler' ? 'lendo' : leitura?.status ?? 'lendo',
    paginaAtual: leitura?.paginaAtual ?? 0, dataInicio: leitura?.dataInicio ?? null,
    dataFim: leitura?.dataFim ?? null, nota: leitura?.nota ?? null, favorito: leitura?.favorito ?? false,
  });
  const [paginaTexto, setPaginaTexto] = useState(String(leitura?.paginaAtual ?? 0));
  function enviar(e: FormEvent) {
    e.preventDefault();
    if (dados.status === 'concluido' && dados.dataInicio && dados.dataFim && dados.dataFim < dados.dataInicio) {
      window.alert('A conclusão não pode ser anterior ao início.'); return;
    }
    if (paginas !== null && dados.status === 'lendo' && Number(paginaTexto || 0) > paginas) {
      window.alert('A página atual não pode superar o total de páginas.'); return;
    }
    void aoSalvar({ ...dados, paginaAtual: Number(paginaTexto || 0) });
  }
  return <div className="modal-fundo">
    <section className="modal-livro" role="dialog" aria-modal="true" aria-labelledby="titulo-leitura">
      <header className="modal-cabecalho"><div><span className="subtitulo">HISTÓRICO DE LEITURAS</span>
        <h2 id="titulo-leitura">{leitura ? 'Editar leitura' : 'Nova leitura'}</h2>
        <p>{titulo}</p>
        {leitura && <p className="identificador-leitura">Registro selecionado: {leitura.id}</p>}</div>
        <button type="button" className="botao-icone" disabled={salvando} onClick={aoFechar} aria-label="Fechar"><X size={20}/></button>
      </header>
      <form className="formulario-livro" onSubmit={enviar}>
        <div className="campo-livro"><label htmlFor="status-leitura">Status</label>
          <select id="status-leitura" value={dados.status} onChange={e => setDados(v => ({ ...v, status: e.target.value as StatusLivro }))}>
            {(['lendo','concluido','pausado','abandonado'] as StatusLivro[]).map(k => <option key={k} value={k}>{ROTULOS_STATUS[k]}</option>)}
          </select></div>
        <div className="formulario-grade">
          <div className="campo-livro"><label htmlFor="inicio-leitura">Data de início</label><input id="inicio-leitura" type="date" value={dados.dataInicio ?? ''} onChange={e => setDados(v => ({ ...v, dataInicio: e.target.value || null }))}/></div>
          {dados.status === 'concluido' && <div className="campo-livro"><label htmlFor="fim-leitura">Data de conclusão</label><input id="fim-leitura" type="date" value={dados.dataFim ?? ''} onChange={e => setDados(v => ({ ...v, dataFim: e.target.value || null }))}/></div>}
          {dados.status !== 'concluido' && <div className="campo-livro"><label htmlFor="pagina-leitura">Página atual</label><input id="pagina-leitura" type="number" min="0" max={paginas ?? undefined} value={paginaTexto} onChange={e => setPaginaTexto(e.target.value)}/></div>}
          <div className="campo-livro"><label htmlFor="nota-leitura">Nota pessoal (0 a 10)</label><input id="nota-leitura" type="number" min="0" max="10" step="0.5" value={dados.nota ?? ''} onChange={e => setDados(v => ({ ...v, nota: e.target.value === '' ? null : Number(e.target.value) }))}/></div>
        </div>
        <div className="formulario-opcoes"><label><input type="checkbox" checked={dados.favorito} onChange={e => setDados(v => ({ ...v, favorito: e.target.checked }))}/> Favorito nesta leitura</label></div>
        <div className="modal-acoes"><button type="button" className="botao-secundario" disabled={salvando} onClick={aoFechar}>Cancelar</button><button type="submit" className="botao-primario" disabled={salvando}><Save size={17}/> {salvando ? 'Salvando...' : 'Salvar leitura'}</button></div>
      </form>
    </section>
  </div>;
}
