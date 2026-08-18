'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './authenticated-dashboard.module.css';

type User = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  steam: { id: string; profileUrl: string | null };
};

type LibrarySyncSummary = {
  status:
    | 'NOT_CONNECTED'
    | 'SYNC_PENDING'
    | 'SYNCING'
    | 'SYNCED'
    | 'PRIVATE'
    | 'FAILED'
    | 'STALE';
  lastSyncedAt: string | null;
  isStale: boolean;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'ready'; user: User; library: LibrarySyncSummary | null }
  | { status: 'error' };

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api/v1';

export function AuthenticatedDashboard() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    void Promise.all([
      fetch(`${apiUrl}/me`, {
        credentials: 'include',
        signal: controller.signal,
      }),
      fetch(`${apiUrl}/me/library/sync-status`, {
        credentials: 'include',
        signal: controller.signal,
      }),
    ])
      .then(async ([sessionResponse, libraryResponse]) => {
        if (sessionResponse.status === 401) {
          setState({ status: 'anonymous' });
          return;
        }
        if (!sessionResponse.ok) throw new Error('Could not load the session.');
        if (!libraryResponse.ok && libraryResponse.status !== 404)
          throw new Error('Could not load the library status.');

        const payload = (await sessionResponse.json()) as { user: User };
        const library = libraryResponse.ok
          ? ((await libraryResponse.json()) as LibrarySyncSummary)
          : null;
        setState({ status: 'ready', user: payload.user, library });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setState({ status: 'error' });
      });

    return () => controller.abort();
  }, []);

  async function logout() {
    setIsLoggingOut(true);
    try {
      await fetch(`${apiUrl}/auth/logout`, {
        credentials: 'include',
        method: 'POST',
      });
    } finally {
      window.location.assign('/');
    }
  }

  if (state.status !== 'ready') {
    return <SessionState state={state.status} />;
  }

  const { library, user } = state;
  const firstName = user.displayName.trim().split(/\s+/)[0] || user.displayName;
  const libraryComplete = Boolean(
    library?.lastSyncedAt && ['SYNCED', 'STALE'].includes(library.status),
  );
  const completedSteps = libraryComplete ? 2 : 1;

  return (
    <div className={styles.page}>
      <div aria-hidden="true" className={styles.glow} />

      <header className={styles.header}>
        <Link
          aria-label="PartyQueue — início"
          className={styles.wordmark}
          href="/"
        >
          <span aria-hidden="true" className={styles.dotMark}>
            <span />
            <span />
            <span />
          </span>
          <span>Party</span>
          <span className={styles.queue}>Queue</span>
        </Link>

        <div className={styles.headerRight}>
          <button
            className={styles.headerLink}
            disabled={isLoggingOut}
            onClick={() => void logout()}
            type="button"
          >
            {isLoggingOut ? 'Saindo…' : 'Sair'}
          </button>
          <Avatar
            className={styles.miniAvatar}
            name={user.displayName}
            src={user.avatarUrl}
            size={30}
          />
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>Dashboard // {firstName}</p>
          <h1 className={styles.pageTitle}>
            Boa noite. Vamos deixar tudo pronto pra primeira party.
          </h1>
          <p className={styles.pageSub}>
            {libraryComplete
              ? 'Sua biblioteca está pronta. Falta montar a primeira party para receber recomendações.'
              : 'Faltam 2 passos pra você conseguir montar um grupo e receber as primeiras recomendações.'}
          </p>
        </section>

        <div className={styles.cardGrid}>
          <article className={`${styles.card} ${styles.profileCard}`}>
            <div className={styles.profileTop}>
              <Avatar
                className={styles.avatarLarge}
                name={user.displayName}
                src={user.avatarUrl}
                size={56}
              />
              <div className={styles.profileIdentity}>
                <h2 className={styles.profileName}>{user.displayName}</h2>
                <p className={styles.profileMeta}>
                  SteamID <span aria-hidden="true">·</span> {user.steam.id}
                </p>
              </div>
            </div>

            <p className={styles.statusPill}>
              <span aria-hidden="true" className={styles.statusDot} />
              Identidade Conectada
            </p>

            {user.steam.profileUrl ? (
              <a
                className={styles.profileLink}
                href={user.steam.profileUrl}
                rel="noreferrer"
                target="_blank"
              >
                Ver perfil na Steam ↗
              </a>
            ) : null}
          </article>

          <article className={`${styles.card} ${styles.onboardingCard}`}>
            <p className={styles.eyebrow}>Onboarding · {completedSteps} de 3</p>

            <div
              aria-label={`Progresso do onboarding: ${completedSteps} de 3 etapas concluídas`}
              aria-valuemax={3}
              aria-valuemin={0}
              aria-valuenow={completedSteps}
              className={styles.progressTrack}
              role="progressbar"
            >
              <span
                className={`${styles.progressFill} ${libraryComplete ? styles.progressTwoThirds : ''}`}
              />
            </div>

            <ol className={styles.stepList}>
              <Step done label="Conectar identidade Steam" number={1} />
              <Step
                actionHref="/library"
                actionLabel={libraryComplete ? 'Revisar' : 'Sincronizar'}
                active={!libraryComplete}
                done={libraryComplete}
                label="Sincronizar e conferir biblioteca"
                number={2}
              />
              <Step
                actionLabel={libraryComplete ? 'Semana 3' : undefined}
                active={libraryComplete}
                label="Montar a primeira party"
                number={3}
              />
            </ol>

            <p className={styles.hintBox}>
              {libraryComplete
                ? 'Próxima etapa: criar ou entrar em um grupo. Esse é o início da Semana 3 definida no MVP.'
                : 'Próxima etapa: importar seus jogos com privacidade e tratar bibliotecas privadas como um estado normal, não um erro.'}
            </p>
          </article>
        </div>
      </main>

      <footer className={styles.footer}>
        <span>steam-first · decisão em grupo</span>
        <span>onboarding · {completedSteps} de 3 concluídos</span>
      </footer>
    </div>
  );
}

function SessionState({
  state,
}: {
  state: Exclude<LoadState['status'], 'ready'>;
}) {
  const isLoading = state === 'loading';

  return (
    <main className={styles.sessionPage}>
      <div aria-hidden="true" className={styles.glow} />
      <div className={styles.sessionCard}>
        <p className={styles.eyebrow}>
          {isLoading ? 'validando sessão' : 'sessão ausente'}
        </p>
        <h1 className={styles.sessionTitle}>
          {isLoading
            ? 'Preparando seu lobby…'
            : 'Entre com a Steam para abrir seu lobby.'}
        </h1>
        {!isLoading ? (
          <Link className={styles.loginLink} href="/">
            Voltar para o login
          </Link>
        ) : null}
      </div>
    </main>
  );
}

function Avatar({
  className,
  name,
  size,
  src,
}: {
  className: string;
  name: string;
  size: number;
  src: string | null;
}) {
  if (src) {
    return (
      <Image
        alt={`Avatar de ${name}`}
        className={className}
        height={size}
        src={src}
        width={size}
      />
    );
  }

  return (
    <span aria-label={`Avatar de ${name}`} className={className} role="img">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function Step({
  actionHref,
  actionLabel,
  active = false,
  done = false,
  label,
  number,
}: {
  actionHref?: string;
  actionLabel?: string;
  active?: boolean;
  done?: boolean;
  label: string;
  number: number;
}) {
  const stateClass = done
    ? styles.stepDone
    : active
      ? styles.stepActive
      : styles.stepPending;

  return (
    <li className={`${styles.step} ${stateClass}`}>
      <span aria-hidden="true" className={styles.stepIcon}>
        {done ? '✓' : number}
      </span>
      <span className={styles.stepLabel}>{label}</span>
      {actionHref && actionLabel ? (
        <Link className={styles.stepAction} href={actionHref}>
          {actionLabel}
        </Link>
      ) : active && actionLabel ? (
        <span className={styles.stepMeta}>{actionLabel}</span>
      ) : null}
    </li>
  );
}
