import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import Login from './components/Login';
import { supabase } from './services/supabase';
import {
  BookOpen,
  LibraryBig,
  Heart,
  BookMarked,
  ChartNoAxesColumn,
  Sparkles,
  Plus,
  Search,
} from 'lucide-react';

type Pagina =
  | 'inicio'
  | 'fisicos'
  | 'ebooks'
  | 'desejos'
  | 'diario'
  | 'estatisticas'
  | 'descobrir';

export default function App() {
  const [pagina, setPagina] = useState<Pagina>('inicio');
  const [sessao, setSessao] = useState<Session | null>(null);
const [verificando, setVerificando] = useState(true);

useEffect(() => {
  let ativo = true;

  supabase.auth.getSession().then(({ data }) => {
    if (ativo) {
      setSessao(data.session);
      setVerificando(false);
    }
  }).catch(() => {
    if (ativo) setVerificando(false);
  });

  const { data: { subscription } } =
    supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      if (ativo) {
        setSessao(novaSessao);
        setVerificando(false);
      }
    });

  return () => {
    ativo = false;
    subscription.unsubscribe();
  };
}, []);

async function sair() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    window.alert('Não foi possível encerrar a sessão.');
  }
}

  const menu = [
    { id: 'inicio', nome: 'Início', icone: BookOpen },
    { id: 'fisicos', nome: 'Biblioteca física', icone: LibraryBig },
    { id: 'ebooks', nome: 'Ebooks', icone: BookMarked },
    { id: 'desejos', nome: 'Lista de desejos', icone: Heart },
    { id: 'diario', nome: 'Diário de leitura', icone: BookOpen },
    {
      id: 'estatisticas',
      nome: 'Estatísticas',
      icone: ChartNoAxesColumn,
    },
    { id: 'descobrir', nome: 'Descobrir', icone: Sparkles },
  ] as const;

  const titulos: Record<Pagina, string> = {
    inicio: 'Seu cantinho literário',
    fisicos: 'Biblioteca física',
    ebooks: 'Biblioteca digital',
    desejos: 'Lista de desejos',
    diario: 'Diário de leitura',
    estatisticas: 'Estatísticas literárias',
    descobrir: 'Descubra sua próxima leitura',
  };

  return (
    if (verificando) {
  return (
    <div className="tela-carregamento">
      <p>📚 Abrindo sua biblioteca...</p>
    </div>
  );
}

if (!sessao) {
  return <Login />;
}
    <div className="aplicativo">
      <aside className="barra-lateral">
        <div className="marca">
          <span className="marca-icone">📚</span>
          <div>
            <h1>Minha Biblioteca</h1>
            <p>Um universo de histórias</p>
          </div>
        </div>

        <nav className="menu">
          {menu.map((item) => {
            const Icone = item.icone;

            return (
              <button
                key={item.id}
                className={`menu-item ${
                  pagina === item.id ? 'ativo' : ''
                }`}
                onClick={() => setPagina(item.id)}
              >
                <Icone size={19} />
                <span>{item.nome}</span>
              </button>
            );
          })}
        </nav>

        <div className="rodape-menu">
  <button className="botao-sair" onClick={sair}>
    <LogOut size={18} />
    Sair da biblioteca
  </button>

  <p>🍂 Um livro de cada vez.</p>
</div>

      <main className="conteudo">
        <header className="cabecalho">
          <div>
            <span className="subtitulo">MINHA BIBLIOTECA</span>
            <h2>{titulos[pagina]}</h2>
          </div>

          <button
            className="botao-primario"
            onClick={() =>
              window.alert(
                'Em breve você poderá pesquisar e adicionar livros!'
              )
            }
          >
            <Plus size={18} />
            Adicionar livro
          </button>
        </header>

        {pagina === 'inicio' ? (
          <>
            <section className="boas-vindas">
              <span className="etiqueta">🍃 SUA JORNADA LITERÁRIA</span>

              <h3>Todo livro é uma nova descoberta.</h3>

              <p>
                Organize suas leituras, guarde suas impressões e
                descubra histórias que combinam com você.
              </p>

              <button
                className="botao-secundario"
                onClick={() => setPagina('fisicos')}
              >
                Explorar minha estante →
              </button>
            </section>

            <section className="indicadores">
              <div className="indicador">
                <span>Livros na biblioteca</span>
                <strong>0</strong>
                <small>Sua coleção começa aqui</small>
              </div>

              <div className="indicador">
                <span>Livros concluídos</span>
                <strong>0</strong>
                <small>Histórias vividas</small>
              </div>

              <div className="indicador">
                <span>Lendo atualmente</span>
                <strong>0</strong>
                <small>Em andamento</small>
              </div>

              <div className="indicador">
                <span>Lista de desejos</span>
                <strong>0</strong>
                <small>Próximas descobertas</small>
              </div>
            </section>
          </>
        ) : null}

        <section className="secao-estante">
          <div className="secao-titulo">
            <div>
              <span className="subtitulo">SUA COLEÇÃO</span>
              <h3>
                {pagina === 'inicio'
                  ? 'Minha estante'
                  : titulos[pagina]}
              </h3>
            </div>

            <button className="botao-busca">
              <Search size={18} />
              Buscar
            </button>
          </div>

          <div className="estado-vazio">
            <div className="estado-vazio-icone">📖</div>

            <h3>Uma estante esperando histórias...</h3>

            <p>
              Sua biblioteca ainda está vazia. Que tal começar
              adicionando um livro especial?
            </p>

            <button
              className="botao-primario"
              onClick={() =>
                window.alert(
                  'O cadastro de livros será nossa próxima funcionalidade!'
                )
              }
            >
              <Plus size={18} />
              Adicionar meu primeiro livro
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}