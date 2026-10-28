import { supabase } from './supabase';
import type { DadosLivro, Livro, FormatoLivro, StatusLivro } from '../types/livro';

type Linha = Record<string, unknown>;
const erroDe = (erro: unknown) => erro instanceof Error ? erro.message : String(erro);

// Uma chamada por tabela torna os relacionamentos explícitos e evita joins ambíguos
// quando há mais de uma chave estrangeira entre as mesmas tabelas.
async function todasAsLinhas(tabela: string, usuarioId: string): Promise<Linha[]> {
  const saida: Linha[] = [];
  const pagina = 500;
  for (let inicio = 0; ; inicio += pagina) {
    const { data, error } = await supabase.from(tabela)
      .select('*').eq('usuario_id', usuarioId)
      .range(inicio, inicio + pagina - 1);
    if (error) throw new Error(`Erro ao consultar ${tabela}: ${error.message}`);
    const lote = (data ?? []) as Linha[];
    saida.push(...lote);
    if (lote.length < pagina) break;
  }
  return saida;
}

export async function listarLivrosSupabase(usuarioId: string): Promise<Livro[]> {
  // Promise.all falha se qualquer tabela falhar: não exibe uma estante incompleta como correta.
  const [livros, exemplares, leituras, avaliacoes, desejos] = await Promise.all([
    todasAsLinhas('livros', usuarioId),
    todasAsLinhas('exemplares', usuarioId),
    todasAsLinhas('leituras', usuarioId),
    todasAsLinhas('avaliacoes', usuarioId),
    todasAsLinhas('lista_desejos', usuarioId),
  ]);
  const porCriacao = (a: Linha, b: Linha) => String(b.criado_em ?? '').localeCompare(String(a.criado_em ?? ''));
  const formatoPorLivro = new Map<string, FormatoLivro>();
  for (const e of [...exemplares].sort(porCriacao)) {
    const id = String(e.livro_id);
    if (!formatoPorLivro.has(id)) formatoPorLivro.set(id, e.formato === 'ebook' ? 'ebook' : 'fisico');
  }
  const leituraPorLivro = new Map<string, Linha>();
  for (const l of [...leituras].sort(porCriacao)) {
    const id = String(l.livro_id);
    if (!leituraPorLivro.has(id)) leituraPorLivro.set(id, l);
  }
  const avaliacaoPorLeitura = new Map<string, Linha>();
  for (const a of [...avaliacoes].sort(porCriacao)) {
    const id = String(a.leitura_id);
    if (!avaliacaoPorLeitura.has(id)) avaliacaoPorLeitura.set(id, a);
  }
  const idsDesejados = new Set(desejos.map(d => String(d.livro_id)));
  const statusPermitidos: StatusLivro[] = ['quero_ler', 'lendo', 'pausado', 'concluido', 'abandonado'];
  return livros.map(l => {
    const id = String(l.id);
    const leitura = leituraPorLivro.get(id);
    const avaliacao = leitura ? avaliacaoPorLeitura.get(String(leitura.id)) : undefined;
    const status = String(leitura?.status ?? 'quero_ler');
    return {
      id,
      titulo: String(l.titulo ?? ''),
      autor: String(l.autor ?? ''),
      genero: String(l.genero ?? ''),
      paginas: l.paginas == null ? null : Number(l.paginas),
      capa: String(l.capa_url ?? ''),
      formato: formatoPorLivro.get(id) ?? 'fisico',
      status: statusPermitidos.includes(status as StatusLivro) ? status as StatusLivro : 'quero_ler',
      desejo: idsDesejados.has(id),
      favorito: avaliacao?.favorito === true,
      nota: avaliacao?.nota == null ? null : Number(avaliacao.nota),
      criadoEm: String(l.criado_em ?? ''),
    };
  }).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export class CadastroParcialError extends Error {
  constructor(public readonly livroId: string, etapa: string, causa: unknown) {
    super(`O livro foi criado no Supabase (ID ${livroId}), mas não foi possível concluir ${etapa}: ${erroDe(causa)}. Atualize a estante antes de tentar novamente para evitar duplicatas.`);
    this.name = 'CadastroParcialError';
  }
}

export async function cadastrarLivroSupabase(dados: DadosLivro, usuarioId: string): Promise<void> {
  // ID gerado no cliente possibilita identificar cadastros parciais sem apagar dados.
  const livroId = crypto.randomUUID();
  const { error: erroLivro } = await supabase.from('livros').insert({
    id: livroId, usuario_id: usuarioId,
    titulo: dados.titulo, autor: dados.autor || null,
    genero: dados.genero || null, paginas: dados.paginas,
    capa_url: dados.capa || null,
  });
  if (erroLivro) throw new Error(`Cadastro não realizado: ${erroLivro.message}`);

  const inserir = async (tabela: string, valores: Record<string, unknown>, etapa: string) => {
    const { error } = await supabase.from(tabela).insert(valores);
    if (error) throw new CadastroParcialError(livroId, etapa, error.message);
  };
  await inserir('exemplares', { usuario_id: usuarioId, livro_id: livroId, formato: dados.formato }, 'o formato do exemplar');
  const leituraId = crypto.randomUUID();
  await inserir('leituras', { id: leituraId, usuario_id: usuarioId, livro_id: livroId, status: dados.status }, 'o status de leitura');
  if (dados.nota !== null || dados.favorito) {
    await inserir('avaliacoes', { usuario_id: usuarioId, leitura_id: leituraId, nota: dados.nota, favorito: dados.favorito }, 'a avaliação');
  }
  if (dados.desejo) {
    await inserir('lista_desejos', { usuario_id: usuarioId, livro_id: livroId }, 'a lista de desejos');
  }
}

export class EdicaoParcialError extends Error {
  constructor(etapa: string, causa: unknown) {
    super('Uma parte das alterações pode ter sido salva, mas houve erro em ' + etapa + ': ' + erroDe(causa) + '. Recarregue a estante antes de tentar novamente.');
    this.name = 'EdicaoParcialError';
  }
}

export async function editarLivroSupabase(id: string, usuarioId: string, dados: DadosLivro): Promise<void> {
  const obter = async (tabela: string, chave: string, valor: string) => {
    const { data, error } = await supabase.from(tabela).select('*')
      .eq('usuario_id', usuarioId).eq(chave, valor).limit(100);
    if (error) throw new Error('Erro ao consultar ' + tabela + ': ' + error.message);
    return (data ?? []) as Linha[];
  };
  const [livros, exemplares, leituras, desejos] = await Promise.all([
    obter('livros', 'id', id), obter('exemplares', 'livro_id', id),
    obter('leituras', 'livro_id', id), obter('lista_desejos', 'livro_id', id),
  ]);
  if (livros.length !== 1) throw new Error('Livro não encontrado na sua conta.');
  if (exemplares.length !== 1 || leituras.length !== 1)
    throw new Error('Este livro tem múltiplos ou nenhum exemplar/leitura. Para preservar o histórico, a edição deste caso ficará para uma etapa específica.');
  const exemplar = exemplares[0], leitura = leituras[0];
  const avaliacoes = await obter('avaliacoes', 'leitura_id', String(leitura.id));
  if (avaliacoes.length > 1 || desejos.length > 1)
    throw new Error('Foram encontrados registros relacionados ambíguos. Nenhuma alteração foi iniciada.');
  const alterar = async (tabela: string, registroId: string, valores: Record<string, unknown>, etapa: string) => {
    const { error } = await supabase.from(tabela).update(valores)
      .eq('usuario_id', usuarioId).eq('id', registroId);
    if (error) throw new EdicaoParcialError(etapa, error);
  };
  await alterar('livros', id, {
    titulo: dados.titulo, autor: dados.autor || null, genero: dados.genero || null,
    paginas: dados.paginas, capa_url: dados.capa || null,
  }, 'dados bibliográficos');
  await alterar('exemplares', String(exemplar.id), { formato: dados.formato }, 'formato');
  await alterar('leituras', String(leitura.id), { status: dados.status }, 'status');
  if (avaliacoes.length) {
    await alterar('avaliacoes', String(avaliacoes[0].id),
      { nota: dados.nota, favorito: dados.favorito }, 'avaliação');
  } else if (dados.nota !== null || dados.favorito) {
    const { error } = await supabase.from('avaliacoes').insert({
      usuario_id: usuarioId, leitura_id: leitura.id, nota: dados.nota, favorito: dados.favorito,
    });
    if (error) throw new EdicaoParcialError('avaliação', error);
  }
  if (dados.desejo && !desejos.length) {
    const { error } = await supabase.from('lista_desejos').insert({ usuario_id: usuarioId, livro_id: id });
    if (error) throw new EdicaoParcialError('lista de desejos', error);
  } else if (!dados.desejo && desejos.length) {
    const { error } = await supabase.from('lista_desejos').delete()
      .eq('usuario_id', usuarioId).eq('id', String(desejos[0].id));
    if (error) throw new EdicaoParcialError('lista de desejos', error);
  }
}
