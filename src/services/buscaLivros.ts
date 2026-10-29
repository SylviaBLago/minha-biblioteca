export interface LivroEncontrado {
  id: string;
  titulo: string;
  autor: string;
  paginas: number | null;
  genero: string;
  capa: string;
  isbn: string;
  editora: string;
  ano: string;
}

type VolumeGoogle = {
  id?: string;
  volumeInfo?: {
    title?: string; authors?: string[]; pageCount?: number;
    categories?: string[]; imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    industryIdentifiers?: { type: string; identifier: string }[];
    publisher?: string; publishedDate?: string;
  };
};

export async function buscarLivrosInternet(termo: string, signal?: AbortSignal): Promise<LivroEncontrado[]> {
  const busca = termo.trim();
  if (busca.length < 3) return [];
  const isbn = busca.replace(/[\s-]/g, '');
  const porIsbn = /^(?:\d{10}|\d{13}|\d{9}[\dXx])$/.test(isbn);
  const q = porIsbn ? 'isbn:' + isbn : busca;
  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', q);
  url.searchParams.set('maxResults', '10');
  url.searchParams.set('printType', 'books');
  const resposta = await fetch(url.toString(), { signal });
  if (!resposta.ok) throw new Error('Não foi possível consultar o catálogo. Tente novamente.');
  const json = await resposta.json() as { items?: VolumeGoogle[] };
  const resultados = (json.items ?? []).flatMap((item): LivroEncontrado[] => {
    const v = item.volumeInfo;
    if (!v?.title || !item.id) return [];
    const ids = v.industryIdentifiers ?? [];
    const isbnEncontrado = ids.find(x => x.type === 'ISBN_13')?.identifier
      ?? ids.find(x => x.type === 'ISBN_10')?.identifier ?? '';
    return [{
      id: item.id, titulo: v.title, autor: (v.authors ?? []).join(', '),
      paginas: typeof v.pageCount === 'number' && v.pageCount > 0 ? v.pageCount : null,
      genero: v.categories?.[0] ?? '',
      capa: (v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail ?? '').replace(/^http:\/\//, 'https://'),
      isbn: isbnEncontrado, editora: v.publisher ?? '', ano: v.publishedDate ?? '',
    }];
  });
  return resultados;
}
