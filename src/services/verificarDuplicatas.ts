import { supabase } from './supabase';
import type { DadosLivro, Livro } from '../types/livro';

type Comparavel = Pick<Livro, 'id' | 'titulo' | 'autor'>;
export type Duplicata = { livro: Comparavel; tipo: 'exata' | 'semelhante' };

function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function distancia(a: string, b: string, limite: number): number {
  if (Math.abs(a.length - b.length) > limite) return limite + 1;
  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    let minimo = i;
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(atual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + custo);
      minimo = Math.min(minimo, atual[j]);
    }
    if (minimo > limite) return limite + 1;
    anterior = atual;
  }
  return anterior[b.length];
}

export function encontrarDuplicatas(
  dados: Pick<DadosLivro, 'titulo' | 'autor'>,
  existentes: Comparavel[],
): Duplicata[] {
  const titulo = normalizar(dados.titulo);
  const autor = normalizar(dados.autor);
  if (!titulo || !autor) return [];
  const resultado: Duplicata[] = [];
  for (const livro of existentes) {
    const t = normalizar(livro.titulo);
    const a = normalizar(livro.autor);
    if (titulo === t && autor === a) {
      resultado.push({ livro, tipo: 'exata' });
    } else {
      const limite = titulo.length < 8 ? 1 : titulo.length < 18 ? 2 : 3;
      const autorProximo = a === autor ||
        (a.length >= 8 && autor.length >= 8 && distancia(a, autor, 1) <= 1);
      if (autorProximo && distancia(titulo, t, limite) <= limite) {
        resultado.push({ livro, tipo: 'semelhante' });
      }
    }
  }
  return resultado.sort((a, b) => Number(b.tipo === 'exata') - Number(a.tipo === 'exata'));
}

export async function buscarDuplicatasSupabase(
  dados: Pick<DadosLivro, 'titulo' | 'autor'>,
  usuarioId: string,
): Promise<Duplicata[]> {
  const existentes: Comparavel[] = [];
  const tamanho = 500;
  for (let inicio = 0; ; inicio += tamanho) {
    const { data, error } = await supabase.from('livros')
      .select('id,titulo,autor').eq('usuario_id', usuarioId)
      .order('id', { ascending: true }).range(inicio, inicio + tamanho - 1);
    if (error) throw new Error('Não foi possível verificar duplicatas: ' + error.message);
    const lote = (data ?? []).map(item => ({
      id: String(item.id), titulo: String(item.titulo ?? ''), autor: String(item.autor ?? ''),
    }));
    existentes.push(...lote);
    if (lote.length < tamanho) break;
  }
  return encontrarDuplicatas(dados, existentes);
}

export function mensagemDuplicatas(duplicatas: Duplicata[]): string {
  const resumo = duplicatas.slice(0, 5).map(({ livro, tipo }) =>
    '• ' + livro.titulo + ' — ' + livro.autor +
    (tipo === 'exata' ? ' (mesmo título e autor)' : ' (nome semelhante)')
  ).join('\n');
  const adicionais = duplicatas.length > 5 ? '\nE mais ' + (duplicatas.length - 5) + ' correspondências.' : '';
  return 'Possível livro já cadastrado:\n\n' + resumo + adicionais +
    '\n\nConfira se é uma edição ou exemplar diferente.\n\n' +
    'OK: cadastrar mesmo assim.\nCancelar: voltar ao formulário sem salvar.';
}
