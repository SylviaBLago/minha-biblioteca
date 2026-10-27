import { useState, type FormEvent } from 'react';
import { BookOpen, LockKeyhole } from 'lucide-react';
import { supabase } from '../services/supabase';

type Props = {
  aoConcluir: () => void;
};

export default function RecuperarSenha({ aoConcluir }: Props) {
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  async function redefinir(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro('');

    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (senha !== confirmacao) {
      setErro('As senhas informadas não coincidem.');
      return;
    }

    setCarregando(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: senha,
      });

      if (error) {
        setErro('Não foi possível atualizar a senha. Solicite um novo link.');
        return;
      }

      setSucesso(true);
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  async function finalizar() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setErro('Não foi possível encerrar a sessão. Tente novamente.');
      return;
    }

    aoConcluir();
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

        <h1>Nova senha</h1>

        {sucesso ? (
          <>
            <p className="login-descricao">
              Sua senha foi atualizada com sucesso!
              Agora você pode entrar na sua biblioteca.
            </p>

            <button
              className="botao-primario login-botao"
              onClick={finalizar}
            >
              Voltar ao login
            </button>

            {erro && <p className="login-erro" role="alert">{erro}</p>}
          </>
        ) : (
          <>
            <p className="login-descricao">
              Escolha uma nova senha para continuar
              sua jornada entre histórias.
            </p>

            <form
              onSubmit={redefinir}
              className="login-formulario"
            >
              <label htmlFor="nova-senha">
                Nova senha
              </label>

              <div className="login-campo">
                <LockKeyhole size={18} />

                <input
                  id="nova-senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <label htmlFor="confirmar-senha">
                Confirmar nova senha
              </label>

              <div className="login-campo">
                <LockKeyhole size={18} />

                <input
                  id="confirmar-senha"
                  type="password"
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                  placeholder="Repita sua nova senha"
                  autoComplete="new-password"
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
                {carregando
                  ? 'Atualizando...'
                  : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}

        <p className="login-rodape">
          🍂 Um cantinho especial para suas histórias.
        </p>
      </div>
    </div>
  );
}