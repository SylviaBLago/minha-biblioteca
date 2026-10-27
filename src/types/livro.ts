export type FormatoLivro = 'fisico' | 'ebook';
export type StatusLivro = 'quero_ler' | 'lendo' | 'concluido' | 'pausado' | 'abandonado';

export interface Livro {
  id: string;
  titulo: string;
  autor: string;
  genero: string;
  paginas: number | null;
  capa: string;
  formato: FormatoLivro;
  status: StatusLivro;
  desejo: boolean;
  favorito: boolean;
  nota: number | null;
  criadoEm: string;
}

export type DadosLivro = Omit<Livro, 'id' | 'criadoEm'>;

export const ROTULOS_STATUS: Record<StatusLivro, string> = {
  quero_ler: 'Quero ler',
  lendo: 'Lendo',
  concluido: 'Concluído',
  pausado: 'Pausado',
  abandonado: 'Abandonado',
};
