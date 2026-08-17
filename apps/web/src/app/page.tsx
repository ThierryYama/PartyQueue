import { LoginActions } from '../features/auth/login-actions';
import { GameTitleLoop } from './game-title-loop';
import styles from './page.module.css';

const avatars = ['AL', 'BR', 'CA', 'DI'];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ authError?: string | string[] }>;
}) {
  const { authError } = await searchParams;

  return (
    <main className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.grain} />

      <div className={styles.wrap}>
        <section className={styles.brand}>
          <div className={styles.wordmark}>
            <span aria-hidden="true" className={styles.dotMark}>
              <span />
              <span />
              <span />
            </span>
            PartyQueue
          </div>

          <h1 className={styles.title}>
            O grupo tá online.
            <br />
            Ninguém sabe <em>o que jogar</em>.
          </h1>

          <p className={styles.subhead}>
            PartyQueue olha as bibliotecas de todo mundo, o tempo que vocês têm
            e o clima da sessão — e devolve 5 jogos que fazem sentido agora.
          </p>

          <div aria-hidden="true" className={styles.signature}>
            <div className={styles.queueTrack}>
              {avatars.map((avatar) => (
                <span className={styles.avatar} key={avatar}>
                  {avatar}
                </span>
              ))}
            </div>
            <span className={styles.connector} />
            <div className={styles.pickTile}>
              <span className={styles.gameCover} />
              <GameTitleLoop />
            </div>
          </div>
        </section>

        <aside
          className={`${styles.loginCard} rounded-3xl border border-line bg-surface/90 p-7 shadow-2xl shadow-black/35 sm:p-9`}
        >
          <span className="font-mono text-[0.68rem] tracking-[0.15em] text-muted uppercase">
            entrar no lobby
          </span>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight">
            Sua biblioteca é o ponto de partida.
          </h2>
          <p className="mt-3 leading-7 text-muted">
            Use sua conta Steam para identificar você e, na próxima etapa,
            sincronizar apenas os jogos necessários para o grupo.
          </p>

          <LoginActions hasError={Boolean(authError)} />

          <div className="mt-7 border-t border-line pt-5">
            <p className="text-sm leading-6 text-muted">
              <span aria-hidden="true" className="mr-2 text-steam-blue">
                ◇
              </span>
              Login via OpenID. Sua senha continua somente com a Steam — nós
              nunca pedimos nem armazenamos ela.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
