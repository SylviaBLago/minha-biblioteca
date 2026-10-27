import { useState, type FormEvent } from 'react';
import { BookOpen, LockKeyhole, Mail } from 'lucide-react';
import { supabase } from '../services/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    setCarregando(true);
    setErro('');

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

  return (
    <div className="login-pagina">
      <div className="login-cartao">
        <div className="login-icone">
          <BookOpen size={32} />
        </div>

        <span className="subtitulo">SEU REFÚGIO LITERÁRIO</span>

        <h1>Minha Biblioteca</h1>

        <p className="login-descricao">
          Entre, acomode-se e continue sua jornada entre histórias.
        </p>

        <form onSubmit={entrar} className="login-formulario">
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

          {erro && (
            <p className="login-erro" role="alert">
              {erro}
            </p>
          )}

          <button
            type="submit"
            className="botao-primario login-botao"
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar na minha biblioteca'}
          </button>
        </form>

        <p className="login-rodape">
          🍂 Um cantinho especial para suas histórias.
        </p>
      </div>
    </div>
  );
}