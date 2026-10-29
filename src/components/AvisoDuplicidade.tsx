import { useEffect, useState } from 'react';
import { BookOpen, Pencil, X } from 'lucide-react';
import type { Livro } from '../types/livro';
import type { Duplicata } from '../services/verificarDuplicatas';

type Props = {
  correspondencias: Duplicata[];
  livros: Livro[];
  aoVoltar: () => void;
  aoContinuar: () => void;
  aoEditar: (livro: Livro) => void;
};

export default function AvisoDuplicidade({ correspondencias, livros, aoVoltar, aoContinuar, aoEditar }: Props) {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  useEffect(() => {
    function tecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') aoVoltar();
    }
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [aoVoltar]);

  const atual = correspondencias.find(d => d.livro.id === selecionado);
  const completo = atual ? livros.find(l => l.id === atual.livro.id) : undefined;

  return (
    <div className="modal-fundo aviso-duplicidade-fundo">
      <section className="aviso-duplicidade" role="dialog" aria-modal="true" aria-labelledby="aviso-duplicidade-titulo">
        <header className="modal-cabecalho">
          <div>
            <span className="subtitulo">SUA COLEÇÃO</span>
            <h2 id="aviso-duplicidade-titulo">Este livro pode já estar na sua biblioteca</h2>
          </div>
          <button className="botao-icone" type="button" aria-label="Voltar ao cadastro" onClick={aoVoltar}><X size={20} /></button>
        </header>
        <p>Encontramos {correspondencias.length} cadastro(s) semelhante(s). Confira antes de criar outro registro.</p>
        <div className="duplicatas-lista">
          {correspondencias.map(({ livro, tipo }) => (
            <article className="duplicata-item" key={livro.id}>
              <BookOpen size={28} aria-hidden="true" />
              <div className="duplicata-info">
                <strong>{livro.titulo}</strong>
                <span>{livro.autor}</span>
                <small>{tipo === 'exata' ? 'Mesmo título e autor' : 'Título semelhante'}</small>
              </div>
              <button type="button" className="botao-secundario" onClick={() => setSelecionado(livro.id)}>Consultar</button>
            </article>
          ))}
        </div>
        {atual && (
          <div className="duplicata-detalhes">
            <h3>Livro existente</h3>
            <p><strong>{atual.livro.titulo}</strong> — {atual.livro.autor}</p>
            {completo ? (
              <>
                <p>Gênero: {completo.genero || 'Não informado'} · Páginas: {completo.paginas ?? 'Não informadas'}</p>
                <p>Formato: {completo.formato === 'fisico' ? 'Físico' : 'Ebook'} · Status: {completo.status}</p>
                <button type="button" className="botao-primario" onClick={() => aoEditar(completo)}><Pencil size={16} /> Editar este registro</button>
              </>
            ) : (
              <p>Este registro não está disponível na estante carregada. Atualize a página antes de editar.</p>
            )}
          </div>
        )}
        <div className="duplicata-acoes">
          <button type="button" className="botao-secundario" onClick={aoVoltar}>Voltar ao cadastro</button>
          <button type="button" className="botao-primario" onClick={aoContinuar}>Cadastrar mesmo assim</button>
        </div>
      </section>
    </div>
  );
}
