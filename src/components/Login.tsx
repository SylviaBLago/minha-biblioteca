import { useState, type FormEvent } from 'react';
import {
  BookOpen,
  LockKeyhole,
  Mail,
} from 'lucide-react';

import { supabase } from '../services/supabase';

export default function Login() {

  // ==========================================
  // ESTADOS
  // ==========================================

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [carregando, setCarregando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);

  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  // ==========================================
  // LOGIN
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

      // Endereço do aplicativo no GitHub Pages
      const enderecoRetorno =
        `${window.location.origin}${import.meta.env.BASE_URL}`;

      // Solicitar email de recuperação
      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: enderecoRetorno,
          }
        );

      if (error) {

        // Informações para diagnóstico
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
  // ALTERNAR ENTRE LOGIN E RECUPERAÇÃO
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

        {/* ÍCONE */}

        <div className="login-icone">
          <BookOpen size={32} />
        </div>

        {/* TÍTULO */}

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

        {/* FORMULÁRIO */}

        <form
          className="login-formulario"
          onSubmit={
            recuperando
              ? solicitarRecuperacao
              : entrar
          }
        >

          {/* EMAIL */}

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

          {/* SENHA */}

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

          {/* MENSAGEM DE ERRO */}

          {erro && (
            <p
              className="login-erro"
              role="alert"
            >
              {erro}
            </p>
          )}

          {/* MENSAGEM DE SUCESSO */}

          {mensagem && (
            <p
              className="login-sucesso"
              role="status"
            >
              {mensagem}
            </p>
          )}

          {/* BOTÃO PRINCIPAL */}

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

        {/* ALTERNAR TELA */}

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

        {/* RODAPÉ */}

        <p className="login-rodape">
          🍂 Um cantinho especial para suas histórias.
        </p>

      </div>

    </div>
  );
}