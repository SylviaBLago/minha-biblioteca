import { useState, type FormEvent } from 'react';
import { BookOpen, LockKeyhole, Mail } from 'lucide-react';
import { supabase } from '../services/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    setCarregando(true);
    setErro('');
    setMensagem('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        setErro('Não foi possível entrar. Verifique seu email e senha.');
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

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

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: enderecoRetorno,
        }
      );

      if (error) {
        setErro(
          'Não foi possível enviar a solicitação. Tente novamente mais tarde.'
        );
      } else {
        setMensagem(
          'Se o email estiver cadastrado, você receberá um link para redefinir sua senha. Verifique também a pasta de spam.'
        );
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

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
          {recuperando ? 'Recuperar acesso' : 'Minha Biblioteca'}
        </h1>

        <p className="login-descricao">
          {recuperando
            ? 'Informe seu email para receber um link de recuperação.'
            : 'Entre, acomode-se e continue sua jornada entre histórias.'}
        </p>

        <form
          className="login-formulario"
          onSubmit={
            recuperando ? solicitarRecuperacao : entrar
          }
        >
          <label htmlFor="login-email">Email</label>

          <div className="login-campo">
            <Mail size={18} />

            <input
              id="login-email"
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {!recuperando && (
            <>
              <label htmlFor="login-senha">Senha</label>

              <div className="login-campo">
                <LockKeyhole size={18} />

                <input
                  id="login-senha"
                  type="password"
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
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
          onClick={() => {
            setRecuperando(!recuperando);
            setErro('');
            setMensagem('');
          }}
          disabled={carregando}
        >
          {recuperando
            ? '← Voltar ao login'
            : 'Esqueci minha senha'}
        </button>

        <p className="login-rodape">
          🍂 Um cantinho especial para suas histórias.
        </p>
      </div>
    </div>
  );
}