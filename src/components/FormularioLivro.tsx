import { useEffect, useState, type FormEvent } from 'react';
import { X, Save } from 'lucide-react';
import type { DadosLivro, Livro, FormatoLivro, StatusLivro } from '../types/livro';
import { ROTULOS_STATUS, formatosDoLivro } from '../types/livro';

interface Props {
  livro?: Livro | null;
  aoSalvar: (dados: DadosLivro) => void;
  aoFechar: () => void;
}

function dadosIniciais(livro?: Livro | null): DadosLivro {
  return {
    titulo: livro?.titulo ?? '',
    autor: livro?.autor ?? '',
    genero: livro?.genero ?? '',
    paginas: livro?.paginas ?? null,
    capa: livro?.capa ?? '',
    formato: livro?.formato ?? 'fisico',
    formatos: livro ? formatosDoLivro(livro) : [],
    possui: livro ? formatosDoLivro(livro).length > 0 : false,
    status: livro?.status ?? 'quero_ler',
    desejo: livro?.desejo ?? false,
    favorito: livro?.favorito ?? false,
    nota: livro?.nota ?? null,
    paginaAtual: livro?.paginaAtual ?? livro?.historico?.[0]?.paginaAtual ?? 0,
    dataInicio: livro?.dataInicio ?? livro?.historico?.[0]?.dataInicio ?? null,
    dataFim: livro?.dataFim ?? livro?.historico?.[0]?.dataFim ?? null,
  };
}

export default function FormularioLivro({ livro, aoSalvar, aoFechar }: Props) {
  const [dados, setDados] = useState<DadosLivro>(() => dadosIniciais(livro));

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') aoFechar();
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  function atualizar<K extends keyof DadosLivro>(campo: K, valor: DadosLivro[K]) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!dados.titulo.trim() || !dados.autor.trim()) return;
    if (dados.dataInicio && dados.dataFim && dados.status === 'concluido' && dados.dataFim < dados.dataInicio) {
      window.alert('A data de conclusão não pode ser anterior à data de início.');
      return;
    }
    aoSalvar({ ...dados, desejo: (dados.formatos ?? []).length === 0 && dados.desejo, titulo: dados.titulo.trim(), autor: dados.autor.trim(), genero: dados.genero.trim(), capa: dados.capa.trim() });
  }

  return (
    <div className="modal-fundo" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) aoFechar(); }}>
      <section className="modal-livro" role="dialog" aria-modal="true" aria-labelledby="titulo-modal">
        <header className="modal-cabecalho">
          <div><span className="subtitulo">SUA COLEÇÃO</span><h2 id="titulo-modal">{livro ? 'Editar livro' : 'Adicionar livro'}</h2></div>
          <button type="button" className="botao-icone" onClick={aoFechar} aria-label="Fechar cadastro"><X size={21} /></button>
        </header>
        <form className="formulario-livro" onSubmit={enviar}>
          <div className="campo-livro"><label htmlFor="livro-titulo">Título *</label><input id="livro-titulo" required autoFocus maxLength={200} value={dados.titulo} onChange={(e) => atualizar('titulo', e.target.value)} placeholder="Ex.: Matéria Escura" /></div>
          <div className="campo-livro"><label htmlFor="livro-autor">Autor(a) *</label><input id="livro-autor" required maxLength={160} value={dados.autor} onChange={(e) => atualizar('autor', e.target.value)} placeholder="Ex.: Blake Crouch" /></div>
          <div className="formulario-grade">
            <div className="campo-livro"><label htmlFor="livro-genero">Gênero</label><input id="livro-genero" maxLength={100} value={dados.genero} onChange={(e) => atualizar('genero', e.target.value)} placeholder="Ficção científica" /></div>
            <div className="campo-livro"><label htmlFor="livro-paginas">Páginas</label><input id="livro-paginas" type="number" min="1" max="100000" value={dados.paginas ?? ''} onChange={(e) => atualizar('paginas', e.target.value === '' ? null : Number(e.target.value))} /></div>
            <div className="campo-livro"><label>Exemplares que possuo</label>
              <div className="formulario-opcoes formulario-posse">
                {(['fisico', 'ebook'] as FormatoLivro[]).map(formato => {
                  const marcado = (dados.formatos ?? []).includes(formato);
                  return <label key={formato}><input type="checkbox" checked={marcado}
                    onChange={e => {
                      const formatos = e.target.checked
                        ? [...new Set([...(dados.formatos ?? []), formato])]
                        : (dados.formatos ?? []).filter(f => f !== formato);
                      setDados(atual => ({ ...atual, formatos, possui: formatos.length > 0, formato: formatos[0] ?? 'fisico', desejo: formatos.length > 0 ? false : atual.desejo }));
                    }} />
                    {formato === 'fisico' ? 'Livro físico' : 'Ebook'}
                  </label>;
                })}
              </div>
            </div>
            <div className="campo-livro"><label htmlFor="livro-status">Status de leitura</label><select id="livro-status" value={dados.status} onChange={(e) => atualizar('status', e.target.value as StatusLivro)}>{(Object.entries(ROTULOS_STATUS) as [StatusLivro, string][]).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}</select></div>
          </div>
          {(dados.status === 'lendo' || dados.status === 'concluido') && (
            <fieldset className="secao-informacoes-leitura">
              <legend>Informações da leitura</legend>
              <div className="formulario-grade">
                <div className="campo-livro"><label htmlFor="leitura-inicio">Data de início</label><input id="leitura-inicio" type="date" value={dados.dataInicio ?? ''} onChange={e => atualizar('dataInicio', e.target.value || null)} /></div>
                {dados.status === 'concluido' && <div className="campo-livro"><label htmlFor="leitura-fim">Data de conclusão</label><input id="leitura-fim" type="date" value={dados.dataFim ?? ''} onChange={e => atualizar('dataFim', e.target.value || null)} /></div>}
                {dados.status === 'lendo' && <div className="campo-livro"><label htmlFor="leitura-pagina">Página atual</label><input id="leitura-pagina" type="number" min="0" max={dados.paginas ?? undefined} value={dados.paginaAtual ?? 0} onChange={e => atualizar('paginaAtual', e.target.value === '' ? 0 : Number(e.target.value))} /></div>}
              </div>
              <small>Preencha as datas conforme sua leitura. Nenhuma data é definida automaticamente.</small>
            </fieldset>
          )}
          <p className="observacao-exemplares">Deixe as duas opções desmarcadas se ainda não possui o livro. Ao marcar um exemplar, o livro sai automaticamente da lista de desejos.</p>
          <div className="campo-livro"><label htmlFor="livro-capa">Endereço da capa (URL)</label><input id="livro-capa" type="url" value={dados.capa} onChange={(e) => atualizar('capa', e.target.value)} placeholder="https://..." /><small>Opcional. Por enquanto, use o endereço de uma imagem disponível na internet.</small></div>
          <div className="formulario-grade">
            <div className="campo-livro"><label htmlFor="livro-nota">Nota pessoal (0 a 10)</label><input id="livro-nota" type="number" min="0" max="10" step="0.5" value={dados.nota ?? ''} onChange={(e) => atualizar('nota', e.target.value === '' ? null : Number(e.target.value))} /></div>
            <div className="formulario-opcoes"><label><input type="checkbox" checked={dados.desejo && (dados.formatos ?? []).length === 0} disabled={(dados.formatos ?? []).length > 0} onChange={(e) => atualizar('desejo', e.target.checked)} /> Na lista de desejos</label><label><input type="checkbox" checked={dados.favorito} onChange={(e) => atualizar('favorito', e.target.checked)} /> Livro favorito</label></div>
          </div>
          <div className="modal-acoes"><button type="button" className="botao-secundario" onClick={aoFechar}>Cancelar</button><button type="submit" className="botao-primario"><Save size={17} /> {livro ? 'Salvar alterações' : 'Salvar livro'}</button></div>
        </form>
      </section>
    </div>
  );
}
