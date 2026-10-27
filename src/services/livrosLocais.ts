import type { DadosLivro, Livro } from '../types/livro';

const CHAVE = 'minha_biblioteca_livros_v1';

export function carregarLivros(): Livro[] {
  try {
    const texto = localStorage.getItem(CHAVE);
    if (!texto) return [];
    const dados: unknown = JSON.parse(texto);
    if (!Array.isArray(dados)) throw new Error('Formato inválido');
    return dados.filter((item): item is Livro =>
      typeof item === 'object' && item !== null &&
      typeof item.id === 'string' && typeof item.titulo === 'string' &&
      typeof item.autor === 'string' &&
      (item.formato === 'fisico' || item.formato === 'ebook')
    );
  } catch (erro) {
    console.error('Não foi possível ler os livros locais:', erro);
    return [];
  }
}

export function salvarLivros(livros: Livro[]): void {
  localStorage.setItem(CHAVE, JSON.stringify(livros));
}

export function novoLivro(dados: DadosLivro): Livro {
  return { ...dados, id: crypto.randomUUID(), criadoEm: new Date().toISOString() };
}

export function exportarLivros(livros: Livro[]): void {
  const conteudo = JSON.stringify({ versao: 1, exportadoEm: new Date().toISOString(), livros }, null, 2);
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `minha-biblioteca-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
