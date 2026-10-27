import { useState, type FormEvent } from 'react';
import {
  BookOpen,
  LockKeyhole,
  Mail,
  LibraryBig,
} from 'lucide-react';

import { supabase } from '../services/supabase';

interface LoginProps {
  aoEntrarLocal: () => void;
}

export default function Login({
  aoEntrarLocal,
}: LoginProps) {

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [carregando, setCarregando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);

  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  // ==========================================
  // LOGIN SUPABASE
  // ==========================================

  async function entrar(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    setCarregando(true);
    setErro('');
    setMensagem('');

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });

      if (error) {
        console.error('Erro de login:', {
          codigo: error.code,
          status: error.status,
        });

        setErro(
          'Não foi possível entrar. Verifique seu email e senha.'
        );
      }

    } catch (error) {
      console.error('Erro inesperado no login:', error);

      setErro(
        'Erro de conexão. Tente novamente.'
      );

    } finally {
      setCarregando(false);
    }
  }

  // ==========================================
  // RECUPERAÇÃO DE SENHA
  // ==========================================

  async function solicitarRecuperacao(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    setCarregando(true);
    setErro('');
    setMensagem('');

    try {
      const enderecoRetorno =
        `${window.location.origin}${import.meta.env.BASE_URL}`;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: enderecoRetorno,
          }
        );

      if (error) {
        console.error('Erro de recuperação:', {
          mensagem: error.message,
          codigo: error.code,
          status: error.status,
        });

        setErro(
          'Não foi possível enviar o email. Consulte o erro no console.'
        );

      } else {
        setMensagem(
          'Se o email estiver cadastrado, você receberá um link para redefinir sua senha. Verifique também a pasta de spam.'
        );
      }

    } catch (error) {
      console.error(
        'Erro inesperado na recuperação:',
        error
      );

      setErro(
        'Erro de conexão. Tente novamente.'
      );

    } finally {
      setCarregando(false);
    }
  }

  // ==========================================
  // ALTERNAR LOGIN / RECUPERAÇÃO
  // ==========================================

  function alternarRecuperacao() {
    setRecuperando((anterior) => !anterior);

    setErro('');
    setMensagem('');
    setSenha('');
  }

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <div className="login-pagina">

      <div className="login-cartao">

        <div className="login-icone">
          <BookOpen size={32} />
        </div>

        <span className="subtitulo">
          SEU REFÚGIO LITERÁRIO
        </span>

        <h1>
          {recuperando
            ? 'Recuperar acesso'
            : 'Minha Biblioteca'}
        </h1>

        <p className="login-descricao">
          {recuperando
            ? 'Informe seu email para receber um link de recuperação.'
            : 'Entre, acomode-se e continue sua jornada entre histórias.'}
        </p>

        <form
          className="login-formulario"
          onSubmit={
            recuperando
              ? solicitarRecuperacao
              : entrar
          }
        >

          <label htmlFor="login-email">
            Email
          </label>

          <div className="login-campo">
            <Mail size={18} />

            <input
              id="login-email"
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(evento) =>
                setEmail(evento.target.value)
              }
              autoComplete="email"
              required
            />
          </div>

          {!recuperando && (
            <>
              <label htmlFor="login-senha">
                Senha
              </label>

              <div className="login-campo">
                <LockKeyhole size={18} />

                <input
                  id="login-senha"
                  type="password"
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(evento) =>
                    setSenha(evento.target.value)
                  }
                  autoComplete="current-password"
                  required
                />
              </div>
            </>
          )}

          {erro && (
            <p className="login-erro" role="alert">
              {erro}
            </p>
          )}

          {mensagem && (
            <p className="login-sucesso" role="status">
              {mensagem}
            </p>
          )}

          <button
            type="submit"
            className="botao-primario login-botao"
            disabled={carregando}
          >
            {carregando
              ? 'Aguarde...'
              : recuperando
                ? 'Enviar link de recuperação'
                : 'Entrar na minha biblioteca'}
          </button>

        </form>

        <button
          type="button"
          className="login-link"
          onClick={alternarRecuperacao}
          disabled={carregando}
        >
          {recuperando
            ? '← Voltar ao login'
            : 'Esqueci minha senha'}
        </button>

        {/* ACESSO LOCAL */}

        {!recuperando && (
          <>
            <div
              style={{
                margin: '24px 0 16px',
                textAlign: 'center',
                color: '#777',
                fontSize: '13px',
              }}
            >
              ────── ou ──────
            </div>

            <button
              type="button"
              className="botao-secundario"
              onClick={aoEntrarLocal}
              disabled={carregando}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              <LibraryBig size={18} />
              Continuar no modo local
            </button>

            <p
              style={{
                fontSize: '12px',
                textAlign: 'center',
                color: '#777',
                marginTop: '12px',
                lineHeight: '1.6',
              }}
            >
              Acesse sua biblioteca sem conexão com o
              Supabase. Os livros serão armazenados
              neste navegador.
            </p>
          </>
        )}

        <p className="login-rodape">
          🍂 Um cantinho especial para suas histórias.
        </p>

      </div>

    </div>
  );
}