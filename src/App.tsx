import { useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { BookOpen, LibraryBig, Heart, BookMarked, ChartNoAxesColumn, Sparkles, Plus, Search, LogOut, Download, Pencil, Trash2 } from 'lucide-react';
import Login from './components/Login';
import RecuperarSenha from './components/RecuperarSenha';
import FormularioLivro from './components/FormularioLivro';
import AvisoDuplicidade from './components/AvisoDuplicidade';
import { supabase } from './services/supabase';
import { carregarLivros, exportarLivros, novoLivro, salvarLivros } from './services/livrosLocais';
import { cadastrarLivroSupabase, listarLivrosSupabase, CadastroParcialError, editarLivroSupabase } from './services/livrosSupabase';
import { buscarDuplicatasSupabase, encontrarDuplicatas } from './services/verificarDuplicatas';
import type { DadosLivro, Livro } from './types/livro';
import { ROTULOS_STATUS, formatosDoLivro } from './types/livro';

type Pagina = 'inicio' | 'fisicos' | 'ebooks' | 'desejos' | 'diario' | 'estatisticas' | 'descobrir';

export default function App() {
  const [pagina, setPagina] = useState<Pagina>('inicio');
  const [sessao, setSessao] = useState<Session | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);
  const [modoLocal, setModoLocal] = useState(() => sessionStorage.getItem('biblioteca_modo_local') === 'true');
  const [livros, setLivros] = useState<Livro[]>([]);
  const [carregandoLivros, setCarregandoLivros] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const salvandoRef = useRef(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Livro | null>(null);
  const [detalhes, setDetalhes] = useState<Livro | null>(null);
  const [aviso, setAviso] = useState<import('./services/verificarDuplicatas').Duplicata[]>([]);
  const [pendente, setPendente] = useState<DadosLivro | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [erroArmazenamento, setErroArmazenamento] = useState('');

  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!ativo) return;
      if (error) { console.error('Erro ao verificar sessão:', error); setSessao(null); }
      else setSessao(data.session);
      setVerificando(false);
    }).catch(error => {
      console.error('Erro de autenticação:', error);
      if (ativo) { setSessao(null); setVerificando(false); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, novaSessao) => {
      if (!ativo) return;
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true);
      setSessao(novaSessao);
      setVerificando(false);
    });
    return () => { ativo = false; subscription.unsubscribe(); };
  }, []);

  const usuarioId = sessao?.user.id;
  useEffect(() => {
    let ativo = true;
    setLivros([]);
    setErroArmazenamento('');
    if (modoLocal) {
      setLivros(carregarLivros());
      setCarregandoLivros(false);
    } else if (usuarioId) {
      setCarregandoLivros(true);
      listarLivrosSupabase(usuarioId).then(resultado => {
        if (ativo) setLivros(resultado);
      }).catch(erro => {
        console.error('Erro ao carregar estante:', erro);
        if (ativo) setErroArmazenamento('Não foi possível carregar a estante do Supabase. Nenhum dado foi apagado. ' + String(erro.message ?? erro));
      }).finally(() => { if (ativo) setCarregandoLivros(false); });
    } else {
      setCarregandoLivros(false);
    }
    return () => { ativo = false; };
  }, [modoLocal, usuarioId]);

  function entrarModoLocal() {
    sessionStorage.setItem('biblioteca_modo_local', 'true');
    setModoLocal(true);
    setPagina('inicio');
  }

  async function sair() {
    if (modoLocal) {
      sessionStorage.removeItem('biblioteca_modo_local');
      setModoLocal(false);
      setPagina('inicio');
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) window.alert('Não foi possível encerrar a sessão. Tente novamente.');
  }

  function persistirLocal(proximos: Livro[]): boolean {
    try {
      salvarLivros(proximos);
      setLivros(proximos);
      setErroArmazenamento('');
      return true;
    } catch (erro) {
      console.error('Erro ao salvar livros no navegador:', erro);
      setErroArmazenamento('Não foi possível salvar os livros neste navegador.');
      return false;
    }
  }

  async function salvarCadastro(dados: DadosLivro, confirmado = false) {
    if (salvandoRef.current) return;
    salvandoRef.current = true;
    setSalvando(true);
    setErroArmazenamento('');
    try {
      if (modoLocal) {
        if (!editando) {
          const duplicatas = encontrarDuplicatas(dados, livros);
          if (duplicatas.length && !confirmado) { setAviso(duplicatas); setPendente(dados); return; }
        }
        const proximos = editando
          ? livros.map(livro => livro.id === editando.id ? { ...livro, ...dados } : livro)
          : [novoLivro(dados), ...livros];
        if (persistirLocal(proximos)) { setModalAberto(false); setEditando(null); }
        return;
      }
      if (!usuarioId) return;
      if (editando) {
        await editarLivroSupabase(editando.id, usuarioId, dados);
        const atualizados = await listarLivrosSupabase(usuarioId);
        setLivros(atualizados);
        setModalAberto(false);
        setEditando(null);
        return;
      }
      // Consulta atualizada antes de inserir; não depende só da estante em memória.
      const duplicatas = await buscarDuplicatasSupabase(dados, usuarioId);
      if (duplicatas.length && !confirmado) { setAviso(duplicatas); setPendente(dados); return; }
      await cadastrarLivroSupabase(dados, usuarioId);
      const atualizados = await listarLivrosSupabase(usuarioId);
      setLivros(atualizados);
      setModalAberto(false);
      setEditando(null);
      setAviso([]);
      setPendente(null);
    } catch (erro) {
      console.error('Erro ao cadastrar livro:', erro);
      setErroArmazenamento(erro instanceof CadastroParcialError
        ? erro.message
        : `Não foi possível concluir o cadastro ou atualizar a estante: ${String(erro instanceof Error ? erro.message : erro)}. Confira a estante antes de repetir.`);
    } finally {
      salvandoRef.current = false;
      setSalvando(false);
    }
  }

  function excluirLivro(livro: Livro) {
    if (!modoLocal) return;
    if (!window.confirm(`Excluir “${livro.titulo}” da biblioteca local?`)) return;
    persistirLocal(livros.filter(item => item.id !== livro.id));
  }

  const menu = [
    { id: 'inicio', nome: 'Início', icone: BookOpen },
    { id: 'fisicos', nome: 'Biblioteca física', icone: LibraryBig },
    { id: 'ebooks', nome: 'Ebooks', icone: BookMarked },
    { id: 'desejos', nome: 'Lista de desejos', icone: Heart },
    { id: 'diario', nome: 'Diário de leitura', icone: BookOpen },
    { id: 'estatisticas', nome: 'Estatísticas', icone: ChartNoAxesColumn },
    { id: 'descobrir', nome: 'Descobrir', icone: Sparkles },
  ] as const;
  const titulos: Record<Pagina, string> = {
    inicio: 'Seu cantinho literário', fisicos: 'Biblioteca física', ebooks: 'Biblioteca digital',
    desejos: 'Lista de desejos', diario: 'Diário de leitura', estatisticas: 'Estatísticas literárias',
    descobrir: 'Descubra sua próxima leitura',
  };
  const livrosExibidos = useMemo(() => {
    let selecionados = livros;
    if (pagina === 'fisicos') selecionados = livros.filter(l => formatosDoLivro(l).includes('fisico'));
    if (pagina === 'ebooks') selecionados = livros.filter(l => formatosDoLivro(l).includes('ebook'));
    if (pagina === 'desejos') selecionados = livros.filter(l => l.desejo);
    if (pagina === 'inicio') selecionados = livros.filter(l => formatosDoLivro(l).length > 0);
    if (pagina === 'diario') selecionados = livros.filter(l => ['lendo', 'concluido', 'pausado', 'abandonado'].includes(l.status));
    if (pagina === 'descobrir') selecionados = livros.filter(l => l.status === 'quero_ler');
    if (pagina === 'estatisticas') selecionados = livros.filter(l => l.status === 'concluido');
    const busca = termoBusca.trim().toLocaleLowerCase('pt-BR');
    if (busca) selecionados = selecionados.filter(l => `${l.titulo} ${l.autor} ${l.genero}`.toLocaleLowerCase('pt-BR').includes(busca));
    return selecionados;
  }, [livros, pagina, termoBusca]);

  if (verificando && !modoLocal) return <div className="tela-carregamento"><p>📚 Abrindo sua biblioteca...</p></div>;
  if (recuperandoSenha && !modoLocal) return <RecuperarSenha aoConcluir={() => { setRecuperandoSenha(false); setSessao(null); }} />;
  if (!sessao && !modoLocal) return <Login aoEntrarLocal={entrarModoLocal} />;

  return (
    <div className="aplicativo">
      <aside className="barra-lateral">
        <div className="marca"><span className="marca-icone">📚</span><div><h1>Minha Biblioteca</h1><p>Um universo de histórias</p></div></div>
        <nav className="menu">{menu.map(item => { const Icone = item.icone; return <button key={item.id} className={`menu-item ${pagina === item.id ? 'ativo' : ''}`} onClick={() => { setPagina(item.id); setBuscando(false); setTermoBusca(''); }}><Icone size={19} /><span>{item.nome}</span></button>; })}</nav>
        <div className="rodape-menu"><button className="botao-sair" onClick={sair}><LogOut size={18} />{modoLocal ? 'Sair do modo local' : 'Sair da biblioteca'}</button><p>🍂 Um livro de cada vez.</p></div>
      </aside>
      <main className="conteudo">
        <header className="cabecalho">
          <div><span className="subtitulo">{modoLocal ? 'MINHA BIBLIOTECA · MODO LOCAL' : 'MINHA BIBLIOTECA · SUPABASE'}</span><h2>{titulos[pagina]}</h2></div>
          <div className="cabecalho-acoes"><button className="botao-secundario" onClick={() => exportarLivros(livros)} title="Exportar cópia de segurança da estante exibida"><Download size={17} /> Exportar backup</button><button className="botao-primario" disabled={carregandoLivros || salvando || !!erroArmazenamento && !modoLocal} onClick={() => { setEditando(null); setModalAberto(true); }}><Plus size={18} /> Adicionar livro</button></div>
        </header>
        {erroArmazenamento && <p className="aviso-armazenamento" role="alert">{erroArmazenamento}</p>}
        <p className="aviso-local">{modoLocal ? 'Seus livros estão armazenados somente neste navegador. Exporte um backup regularmente.' : 'Estante da sua conta Supabase. Livros antigos do navegador continuam preservados separadamente; nenhuma importação automática foi realizada. Edição remota disponível para livros com um exemplar e uma leitura; exclusão remota permanece desabilitada.'}</p>
        {carregandoLivros && <p role="status">Carregando livros da sua conta...</p>}
        {pagina === 'inicio' && <>
          <section className="boas-vindas"><span className="etiqueta">🍃 SUA JORNADA LITERÁRIA</span><h3>Todo livro é uma nova descoberta.</h3><p>Organize suas leituras, guarde suas impressões e descubra histórias que combinam com você.</p><button className="botao-secundario" onClick={() => setPagina('fisicos')}>Explorar minha estante →</button></section>
          <section className="indicadores">
            <div className="indicador"><span>Livros na biblioteca</span><strong>{livros.filter(l => formatosDoLivro(l).length > 0).length}</strong><small>Sua coleção começa aqui</small></div>
            <div className="indicador"><span>Livros concluídos</span><strong>{livros.filter(l => l.status === 'concluido' && formatosDoLivro(l).length > 0).length}</strong><small>Histórias vividas</small></div>
            <div className="indicador"><span>Lendo atualmente</span><strong>{livros.filter(l => l.status === 'lendo' && formatosDoLivro(l).length > 0).length}</strong><small>Em andamento</small></div>
            <div className="indicador"><span>Lista de desejos</span><strong>{livros.filter(l => l.desejo).length}</strong><small>Próximas descobertas</small></div>
          </section>
        </>}
        <section className="secao-estante">
          <div className="secao-titulo"><div><span className="subtitulo">SUA COLEÇÃO</span><h3>{pagina === 'inicio' ? 'Minha estante' : titulos[pagina]}</h3></div><button className="botao-busca" onClick={() => { setBuscando(!buscando); setTermoBusca(''); }}><Search size={18} /> Buscar</button></div>
          {buscando && <div className="busca-livros"><Search size={18} /><input autoFocus aria-label="Pesquisar livros" placeholder="Buscar por título, autor ou gênero..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)} /></div>}
          {!carregandoLivros && !erroArmazenamento && livrosExibidos.length === 0 ? <div className="estado-vazio"><div className="estado-vazio-icone">📖</div><h3>{termoBusca ? 'Nenhum livro encontrado' : 'Uma estante esperando histórias...'}</h3><p>{termoBusca ? 'Tente outro título, autor ou gênero.' : 'Ainda não há livros nesta seção. Que tal começar adicionando um livro especial?'}</p><button className="botao-primario" onClick={() => { setEditando(null); setModalAberto(true); }}><Plus size={18} /> Adicionar livro</button></div>
          : <div className="grade-livros">{livrosExibidos.map(livro => (
            <article className="cartao-livro cartao-livro-compacto" key={livro.id}>
              <div className="capa-livro capa-livro-compacta">
                <button type="button" className="capa-abrir" onClick={() => setDetalhes(livro)} aria-label={`Consultar ficha de ${livro.titulo}`} title="Ver ficha completa">
                  {livro.capa ? <img src={livro.capa} alt={`Capa de ${livro.titulo}`} onError={e => { e.currentTarget.style.display = 'none'; }} /> : <BookOpen size={45} />}
                </button>
                <button type="button" className="capa-editar" title="Editar livro" aria-label={`Editar ${livro.titulo}`} onClick={() => { setEditando(livro); setModalAberto(true); }}><Pencil size={17} /></button>
                <span className={`capa-status cartao-status--${livro.status}`}>{ROTULOS_STATUS[livro.status]}</span>
                {(livro.nota !== null || livro.favorito) && (
                  <div className="capa-avaliacao">
                    {livro.nota !== null && <span className="capa-nota" title={`Nota ${livro.nota} de 10`}>★ {livro.nota.toLocaleString('pt-BR')}</span>}
                    {livro.favorito && <Heart size={17} fill="currentColor" aria-label="Favorito" className="capa-coracao" />}
                  </div>
                )}
              </div>
              <div className="cartao-livro-corpo cartao-livro-corpo-compacto">
                <h4 title={livro.titulo}>{livro.titulo}</h4>
                <p title={livro.autor}>{livro.autor}</p>
              </div>
            </article>
          ))}</div>}
        </section>
      </main>
      {detalhes && (
        <div className="modal-fundo" onMouseDown={evento => { if (evento.target === evento.currentTarget) setDetalhes(null); }}>
          <section className="modal-livro ficha-livro" role="dialog" aria-modal="true" aria-labelledby="ficha-titulo">
            <header className="modal-cabecalho">
              <div><span className="subtitulo">SUA COLEÇÃO</span><h2 id="ficha-titulo">Ficha do livro</h2></div>
              <button type="button" className="botao-icone" aria-label="Fechar ficha" onClick={() => setDetalhes(null)}>✕</button>
            </header>
            <div className="ficha-conteudo">
              <div className="ficha-capa">{detalhes.capa ? <img src={detalhes.capa} alt={`Capa de ${detalhes.titulo}`} /> : <BookOpen size={56} />}</div>
              <div className="ficha-informacoes">
                <h3>{detalhes.titulo}</h3>
                <p className="ficha-autor">{detalhes.autor}</p>
                <dl>
                  <dt>Exemplares</dt><dd>{formatosDoLivro(detalhes).length ? formatosDoLivro(detalhes).map(f => f === 'fisico' ? 'Físico' : 'Ebook').join(' e ') : 'Ainda não possui'}</dd>
                  <dt>Status</dt><dd>{ROTULOS_STATUS[detalhes.status]}</dd>
                  <dt>Gênero</dt><dd>{detalhes.genero || 'Não informado'}</dd>
                  <dt>Páginas</dt><dd>{detalhes.paginas ?? 'Não informado'}</dd>
                  <dt>Nota pessoal</dt><dd>{detalhes.nota === null ? 'Sem avaliação' : `${detalhes.nota.toLocaleString('pt-BR')} / 10`}</dd>
                  <dt>Favorito</dt><dd>{detalhes.favorito ? 'Sim ♥' : 'Não'}</dd>
                  <dt>Lista de desejos</dt><dd>{detalhes.desejo ? 'Sim' : 'Não'}</dd>
                  <dt>Cadastrado em</dt><dd>{detalhes.criadoEm && !Number.isNaN(Date.parse(detalhes.criadoEm)) ? new Date(detalhes.criadoEm).toLocaleDateString('pt-BR') : 'Não informado'}</dd>
                </dl>
              </div>
            </div>
            {(() => {
              const realizadas = (detalhes.historico ?? []).filter(leitura =>
                leitura.status !== 'quero_ler' || leitura.dataInicio !== null ||
                leitura.dataFim !== null || leitura.paginaAtual > 0
              );
              return realizadas.length > 0 ? (
                <section className="ficha-historico" aria-label="Histórico de leituras">
                  <h3>Histórico de leituras</h3>
                  {realizadas.map((leitura, indice) => (
                    <div className="ficha-leitura" key={leitura.id}>
                      <div className="ficha-leitura-topo">
                        <strong>{indice === realizadas.length - 1 ? 'Primeira leitura' : `Leitura ${realizadas.length - indice}`}</strong>
                        <span>{ROTULOS_STATUS[leitura.status]}</span>
                      </div>
                      <p>Início: {leitura.dataInicio ? leitura.dataInicio.split('-').reverse().join('/') : 'Não informado'} · Término: {leitura.dataFim ? leitura.dataFim.split('-').reverse().join('/') : 'Não informado'}</p>
                      <p>{leitura.status === 'lendo' ? `Página atual: ${leitura.paginaAtual} · ` : ''}Nota: {leitura.nota === null ? 'Sem avaliação' : `${leitura.nota.toLocaleString('pt-BR')}/10`}{leitura.favorito ? ' · ♥ Favorito' : ''}</p>
                      {leitura.resenha && <p className="ficha-resenha">{leitura.resenha}</p>}
                    </div>
                  ))}
                </section>
              ) : (
                <div className="ficha-sem-historico">
                  <button type="button" className="botao-secundario" onClick={() => {
                    setEditando({ ...detalhes, status: 'lendo', paginaAtual: 0, dataInicio: null, dataFim: null });
                    setDetalhes(null);
                    setModalAberto(true);
                  }}><Plus size={17} /> Adicionar leitura</button>
                </div>
              );
            })()}
            <div className="modal-acoes ficha-acoes">
              {modoLocal && <button type="button" className="botao-secundario" onClick={() => { const livro = detalhes; setDetalhes(null); excluirLivro(livro); }}><Trash2 size={16} /> Excluir livro local</button>}
              <button type="button" className="botao-secundario" onClick={() => setDetalhes(null)}>Fechar</button>
              <button type="button" className="botao-primario" onClick={() => { setEditando(detalhes); setDetalhes(null); setModalAberto(true); }}><Pencil size={16} /> Editar livro</button>
            </div>
          </section>
        </div>
      )}
      {aviso.length > 0 && pendente && <AvisoDuplicidade correspondencias={aviso} livros={livros} aoVoltar={() => setAviso([])} aoContinuar={() => { const dados = pendente; setAviso([]); setPendente(null); void salvarCadastro(dados, true); }} aoEditar={(livro) => { setAviso([]); setPendente(null); setEditando(livro); setModalAberto(true); }} />}
      {modalAberto && <FormularioLivro key={editando?.id ?? 'novo'} livro={editando} aoSalvar={salvarCadastro} aoFechar={() => { if (!salvando) { setModalAberto(false); setEditando(null); } }} />}
    </div>
  );
}
