export type FormatoLivro = 'fisico' | 'ebook';
export type StatusLivro = 'quero_ler' | 'lendo' | 'concluido' | 'pausado' | 'abandonado';

export interface HistoricoLeitura {
  id: string;
  status: StatusLivro;
  paginaAtual: number;
  dataInicio: string | null;
  dataFim: string | null;
  nota: number | null;
  favorito: boolean;
  resenha: string;
  criadoEm: string;
}

export interface Livro {
  id: string;
  titulo: string;
  autor: string;
  genero: string;
  paginas: number | null;
  capa: string;
  formato: FormatoLivro;
  /** Lista dos formatos que a pessoa possui; ausente nos backups antigos. */
  formatos?: FormatoLivro[];
  /** Ausente nos backups antigos (considera-se que possui o formato antigo). */
  possui?: boolean;
  status: StatusLivro;
  desejo: boolean;
  favorito: boolean;
  nota: number | null;
  criadoEm: string;
  historico?: HistoricoLeitura[];
  paginaAtual?: number;
  dataInicio?: string | null;
  dataFim?: string | null;
}

export type DadosLivro = Omit<Livro, 'id' | 'criadoEm'>;

export const ROTULOS_STATUS: Record<StatusLivro, string> = {
  quero_ler: 'Quero ler',
  lendo: 'Lendo',
  concluido: 'Concluído',
  pausado: 'Pausado',
  abandonado: 'Abandonado',
};

export function formatosDoLivro(livro: Pick<Livro, 'formato' | 'formatos' | 'possui'>): FormatoLivro[] {
  if (livro.formatos) return livro.formatos;
  return livro.possui === false ? [] : [livro.formato];
}
