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

type DocumentoOpenLibrary = {
  key?: string; title?: string; author_name?: string[]; cover_i?: number;
  number_of_pages_median?: number; subject?: string[]; isbn?: string[];
  publisher?: string[]; first_publish_year?: number;
};

async function consultarGoogle(busca: string, porIsbn: boolean, signal?: AbortSignal): Promise<LivroEncontrado[]> {
  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', porIsbn ? 'isbn:' + busca : busca);
  url.searchParams.set('maxResults', '10');
  url.searchParams.set('printType', 'books');
  const resposta = await fetch(url.toString(), { signal });
  if (!resposta.ok) throw new Error('Google Books: HTTP ' + resposta.status);
  const json = await resposta.json() as { items?: VolumeGoogle[] };
  return (json.items ?? []).flatMap((item): LivroEncontrado[] => {
    const v = item.volumeInfo;
    if (!v?.title || !item.id) return [];
    const ids = v.industryIdentifiers ?? [];
    return [{
      id: 'google:' + item.id, titulo: v.title, autor: (v.authors ?? []).join(', '),
      paginas: typeof v.pageCount === 'number' && v.pageCount > 0 ? v.pageCount : null,
      genero: v.categories?.[0] ?? '',
      capa: (v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail ?? '').replace(/^http:\/\//, 'https://'),
      isbn: ids.find(x => x.type === 'ISBN_13')?.identifier ?? ids.find(x => x.type === 'ISBN_10')?.identifier ?? '',
      editora: v.publisher ?? '', ano: v.publishedDate ?? '',
    }];
  });
}

async function consultarOpenLibrary(busca: string, porIsbn: boolean, signal?: AbortSignal): Promise<LivroEncontrado[]> {
  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set(porIsbn ? 'isbn' : 'q', busca);
  url.searchParams.set('limit', '10');
  url.searchParams.set('fields', 'key,title,author_name,cover_i,number_of_pages_median,subject,isbn,publisher,first_publish_year');
  const resposta = await fetch(url.toString(), { signal });
  if (!resposta.ok) throw new Error('Open Library: HTTP ' + resposta.status);
  const json = await resposta.json() as { docs?: DocumentoOpenLibrary[] };
  return (json.docs ?? []).flatMap((item): LivroEncontrado[] => {
    if (!item.title || !item.key) return [];
    return [{
      id: 'openlibrary:' + item.key, titulo: item.title, autor: (item.author_name ?? []).join(', '),
      paginas: item.number_of_pages_median && item.number_of_pages_median > 0 ? item.number_of_pages_median : null,
      genero: item.subject?.[0] ?? '',
      capa: item.cover_i ? 'https://covers.openlibrary.org/b/id/' + item.cover_i + '-M.jpg' : '',
      isbn: porIsbn ? busca : item.isbn?.[0] ?? '',
      editora: item.publisher?.[0] ?? '', ano: item.first_publish_year?.toString() ?? '',
    }];
  });
}

export async function buscarLivrosInternet(termo: string, signal?: AbortSignal): Promise<LivroEncontrado[]> {
  const busca = termo.trim();
  if (busca.length < 3) return [];
  const isbn = busca.replace(/[\s-]/g, '');
  const porIsbn = /^(?:\d{10}|\d{13}|\d{9}[\dXx])$/.test(isbn);
  const consulta = porIsbn ? isbn : busca;

  // Falhas de rede, bloqueios de origem ou limites do Google não impedem a busca alternativa.
  try {
    const resultados = await consultarGoogle(consulta, porIsbn, signal);
    if (resultados.length > 0) return resultados;
  } catch (erro) {
    if (signal?.aborted) throw erro;
    console.warn('Busca Google Books indisponível; tentando Open Library:', erro);
  }
  try {
    return await consultarOpenLibrary(consulta, porIsbn, signal);
  } catch (erro) {
    if (signal?.aborted) throw erro;
    console.error('Falha também na busca Open Library:', erro);
    throw new Error('Os catálogos estão indisponíveis. Confira sua conexão e tente novamente.');
  }
}
