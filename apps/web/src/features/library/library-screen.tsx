'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import styles from './library-screen.module.css';

type SyncStatus =
  | 'NOT_CONNECTED'
  | 'SYNC_PENDING'
  | 'SYNCING'
  | 'SYNCED'
  | 'PRIVATE'
  | 'FAILED'
  | 'STALE';

type LibraryPayload = {
  games: Array<{
    id: string;
    steamAppId: string;
    title: string;
    coverUrl: string | null;
    fallbackCoverUrl: string | null;
    playtimeMinutes: number;
    lastPlayedAt: string | null;
    syncedAt: string;
  }>;
  sync: {
    status: SyncStatus;
    lastSyncedAt: string | null;
    isStale: boolean;
  };
};

type LoadState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'error' }
  | { status: 'ready'; data: LibraryPayload };

type SortOrder = 'most-played' | 'recent' | 'alphabetical';

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api/v1';

export function LibraryScreen() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [isRequestingSync, setIsRequestingSync] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('most-played');

  const loadLibrary = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`${apiUrl}/me/library`, {
        credentials: 'include',
        signal,
      });
      if (response.status === 401) {
        setState({ status: 'anonymous' });
        return;
      }
      if (!response.ok) throw new Error('Could not load the library.');

      setState({
        status: 'ready',
        data: (await response.json()) as LibraryPayload,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setState({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => void loadLibrary(controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [loadLibrary]);

  const syncStatus = state.status === 'ready' ? state.data.sync.status : null;
  useEffect(() => {
    if (!['SYNC_PENDING', 'SYNCING'].includes(syncStatus ?? '')) return;

    const interval = window.setInterval(() => void loadLibrary(), 1_500);
    return () => window.clearInterval(interval);
  }, [loadLibrary, syncStatus]);

  useEffect(() => {
    const updateVisibility = () => setShowBackToTop(window.scrollY > 640);
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  async function requestSync() {
    setIsRequestingSync(true);
    try {
      const response = await fetch(`${apiUrl}/me/library/sync`, {
        credentials: 'include',
        method: 'POST',
      });
      if (!response.ok) throw new Error('Could not request a library sync.');
      await loadLibrary();
    } catch {
      setState({ status: 'error' });
    } finally {
      setIsRequestingSync(false);
    }
  }

  if (state.status !== 'ready')
    return <LibraryFallback status={state.status} />;

  const { games, sync } = state.data;
  const syncing = ['SYNC_PENDING', 'SYNCING'].includes(sync.status);
  const visibleGames = filterAndSortGames(games, searchQuery, sortOrder);
  const libraryReady = ['SYNCED', 'STALE'].includes(sync.status);

  return (
    <div className={styles.page}>
      <div aria-hidden="true" className={styles.glow} />
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/dashboard">
          <span aria-hidden="true" className={styles.dotMark}>
            <span />
            <span />
            <span />
          </span>
          <span>Party</span>
          <span className={styles.queue}>Queue</span>
        </Link>
        <Link className={styles.headerLink} href="/dashboard">
          Voltar ao lobby
        </Link>
      </header>

      <main className={styles.main}>
        <nav aria-label="Navegação estrutural" className={styles.breadcrumb}>
          <Link href="/dashboard">
            <span aria-hidden="true">←</span> Dashboard
          </Link>
          <span aria-hidden="true">/</span>
          <strong>Biblioteca</strong>
        </nav>

        <section className={styles.titleRow}>
          <div>
            <h1>
              {syncing
                ? 'Buscando seus jogos na Steam'
                : libraryReady
                  ? 'Sua biblioteca está pronta'
                  : 'Sua biblioteca Steam'}
            </h1>
            <p>
              {syncing
                ? 'Isso roda em segundo plano — você pode acompanhar enquanto preparamos tudo.'
                : 'Estes são os jogos que a Steam nos deixou ver. Quando o grupo existir, cruzaremos as bibliotecas dos membros.'}
            </p>
          </div>
        </section>

        <SyncCard
          gameCount={games.length}
          isRequestingSync={isRequestingSync}
          onSync={() => void requestSync()}
          sync={sync}
        />

        <aside className={styles.privacyNote}>
          <svg
            aria-hidden="true"
            className={styles.lockIcon}
            fill="none"
            viewBox="0 0 24 24"
          >
            <rect height="10" rx="2" width="16" x="4" y="10" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <p>
            Usamos só a lista de jogos e o tempo jogado. Não acessamos amigos,
            conquistas ou mensagens.
          </p>
        </aside>

        {games.length ? (
          <section
            aria-label="Filtros da biblioteca"
            className={styles.filters}
          >
            <label className={styles.searchField}>
              <span className={styles.visuallyHidden}>Buscar jogo</span>
              <input
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar na sua biblioteca…"
                type="search"
                value={searchQuery}
              />
            </label>
            <label>
              <span className={styles.visuallyHidden}>Ordenar jogos</span>
              <select
                onChange={(event) =>
                  setSortOrder(event.target.value as SortOrder)
                }
                value={sortOrder}
              >
                <option value="most-played">Mais jogado</option>
                <option value="recent">Jogado recentemente</option>
                <option value="alphabetical">Ordem alfabética</option>
              </select>
            </label>
          </section>
        ) : null}

        {visibleGames.length ? (
          <section aria-label="Jogos da biblioteca" className={styles.grid}>
            {visibleGames.map((game, index) => (
              <article
                className={styles.gameCard}
                key={game.id}
                style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
              >
                <div className={styles.cover}>
                  <GameCover
                    fallbackUrl={game.fallbackCoverUrl}
                    key={`${game.coverUrl}-${game.fallbackCoverUrl}`}
                    primaryUrl={game.coverUrl}
                    title={game.title}
                  />
                  <span className={styles.coverShade} />
                  <h2 className={styles.coverLabel}>{game.title}</h2>
                </div>
                <div className={styles.gameMeta}>
                  <p className={styles.playtime}>
                    {formatPlaytime(game.playtimeMinutes)}
                  </p>
                  <p className={styles.lastPlayed}>
                    {formatLastPlayed(game.lastPlayedAt)}
                  </p>
                </div>
              </article>
            ))}
          </section>
        ) : games.length && searchQuery ? (
          <section className={styles.emptyState}>
            <p className={styles.eyebrow}>Nenhum resultado</p>
            <h2>Não encontramos “{searchQuery}” nesta biblioteca.</h2>
            <button onClick={() => setSearchQuery('')} type="button">
              Limpar busca
            </button>
          </section>
        ) : libraryReady ? (
          <section className={styles.emptyState}>
            <p className={styles.eyebrow}>Biblioteca vazia</p>
            <h2>Nenhum jogo apareceu nesta conta.</h2>
            <p>Você pode atualizar novamente depois de adicionar jogos.</p>
          </section>
        ) : null}

        {libraryReady ? (
          <section className={styles.ctaBar}>
            <p>
              <strong>
                {games.length}{' '}
                {games.length === 1 ? 'jogo pronto' : 'jogos prontos'}
              </strong>{' '}
              para as decisões do grupo.
            </p>
            <button
              aria-label="Montar party — disponível em breve"
              className={styles.ctaButton}
              disabled
              title="Disponível na próxima etapa"
              type="button"
            >
              Montar party →
            </button>
          </section>
        ) : null}
      </main>

      <footer className={styles.footer}>
        <span>steam-first · decisão em grupo</span>
        <span>onboarding · passo 2 de 3</span>
      </footer>

      {showBackToTop ? (
        <button
          aria-label="Voltar ao topo da biblioteca"
          className={styles.backToTop}
          onClick={() => {
            const reducedMotion = window.matchMedia(
              '(prefers-reduced-motion: reduce)',
            ).matches;
            window.scrollTo({
              behavior: reducedMotion ? 'auto' : 'smooth',
              top: 0,
            });
          }}
          title="Voltar ao topo"
          type="button"
        >
          ↑
        </button>
      ) : null}
    </div>
  );
}

function GameCover({
  fallbackUrl,
  primaryUrl,
  title,
}: {
  fallbackUrl: string | null;
  primaryUrl: string | null;
  title: string;
}) {
  const [source, setSource] = useState<'primary' | 'fallback' | 'none'>(
    primaryUrl ? 'primary' : fallbackUrl ? 'fallback' : 'none',
  );

  if (source === 'primary' && primaryUrl) {
    return (
      <Image
        alt={`Capa de ${title}`}
        fill
        onError={() => setSource(fallbackUrl ? 'fallback' : 'none')}
        sizes="(max-width: 620px) 100vw, (max-width: 980px) 50vw, 33vw"
        src={primaryUrl}
      />
    );
  }

  if (source === 'fallback' && fallbackUrl) {
    return (
      <span className={styles.iconFallback}>
        <Image
          alt={`Ícone de ${title}`}
          height={64}
          onError={() => setSource('none')}
          src={fallbackUrl}
          width={64}
        />
        <small>arte alternativa</small>
      </span>
    );
  }

  return (
    <span
      aria-label={`Capa indisponível para ${title}`}
      className={styles.coverFallback}
      role="img"
    >
      <strong aria-hidden="true">{gameInitials(title)}</strong>
      <small>capa indisponível</small>
    </span>
  );
}

function SyncCard({
  gameCount,
  isRequestingSync,
  onSync,
  sync,
}: {
  gameCount: number;
  isRequestingSync: boolean;
  onSync: () => void;
  sync: LibraryPayload['sync'];
}) {
  const content: Record<SyncStatus, { title: string; detail: string }> = {
    NOT_CONNECTED: {
      title: 'Steam não conectada',
      detail: 'Volte ao login e conecte sua identidade Steam.',
    },
    SYNC_PENDING: {
      title: 'Sincronização na fila',
      detail: 'Seu pedido foi recebido e começará em instantes.',
    },
    SYNCING: {
      title: 'Importando jogos',
      detail:
        'Estamos lendo a biblioteca com segurança. Esta tela atualiza sozinha.',
    },
    SYNCED: {
      title: `${gameCount} ${gameCount === 1 ? 'jogo importado' : 'jogos importados'}`,
      detail: sync.lastSyncedAt
        ? `Última sincronização ${formatRelativeDate(sync.lastSyncedAt)}.`
        : 'Biblioteca pronta para o PartyQueue.',
    },
    PRIVATE: {
      title: 'Sua biblioteca está privada',
      detail:
        'Ajuste “Detalhes de jogos” para Público na Steam e tente novamente. Seus dados anteriores não foram apagados.',
    },
    FAILED: {
      title: 'A Steam não respondeu desta vez',
      detail:
        'As tentativas automáticas terminaram. Você pode tentar novamente.',
    },
    STALE: {
      title: 'Sua biblioteca pode estar desatualizada',
      detail: sync.lastSyncedAt
        ? `Última sincronização ${formatRelativeDate(sync.lastSyncedAt)}. Os jogos continuam disponíveis.`
        : 'Atualize para buscar os jogos mais recentes.',
    },
  };
  const notice = content[sync.status];

  const syncing = ['SYNC_PENDING', 'SYNCING'].includes(sync.status);
  const successful = ['SYNCED', 'STALE'].includes(sync.status);

  return (
    <section className={`${styles.syncCard} ${styles[`sync${sync.status}`]}`}>
      <span
        aria-hidden="true"
        className={syncing ? styles.spinner : styles.syncIcon}
      >
        {syncing ? null : successful ? '✓' : '!'}
      </span>
      <div className={styles.syncText}>
        <h2>{notice.title}</h2>
        <p>{notice.detail}</p>
      </div>
      {syncing ? (
        <div aria-hidden="true" className={styles.syncProgress}>
          <span className={styles.miniTrack}>
            <span />
          </span>
          <small>aguarde</small>
        </div>
      ) : (
        <button
          className={styles.refreshButton}
          disabled={isRequestingSync}
          onClick={onSync}
          type="button"
        >
          ↻ {gameCount ? 'Atualizar biblioteca' : 'Sincronizar agora'}
        </button>
      )}
    </section>
  );
}

function LibraryFallback({
  status,
}: {
  status: Exclude<LoadState['status'], 'ready'>;
}) {
  const loading = status === 'loading';
  return (
    <main className={styles.fallbackPage}>
      <div className={styles.fallbackCard}>
        <p className={styles.eyebrow}>
          {loading ? 'Carregando' : 'Acesso interrompido'}
        </p>
        <h1>
          {loading
            ? 'Abrindo sua biblioteca…'
            : status === 'anonymous'
              ? 'Entre com a Steam para ver sua biblioteca.'
              : 'Não foi possível carregar sua biblioteca.'}
        </h1>
        {!loading ? (
          <Link
            className={styles.fallbackLink}
            href={status === 'anonymous' ? '/' : '/dashboard'}
          >
            {status === 'anonymous' ? 'Ir para o login' : 'Voltar ao lobby'}
          </Link>
        ) : null}
      </div>
    </main>
  );
}

function formatPlaytime(minutes: number) {
  if (minutes < 60)
    return minutes ? `${minutes} min na Steam` : 'Ainda não jogado';
  return `${Math.round(minutes / 60)} h na Steam`;
}

function formatLastPlayed(value: string | null) {
  if (!value) return 'Nunca aberto';

  const elapsedMs = Math.max(0, Date.now() - new Date(value).getTime());
  const days = Math.floor(elapsedMs / 86_400_000);
  if (days === 0) return 'Jogado hoje';
  if (days === 1) return 'Jogado ontem';
  if (days < 30) return `Jogado há ${days} dias`;

  const months = Math.floor(days / 30);
  if (months < 12)
    return `Jogado há ${months} ${months === 1 ? 'mês' : 'meses'}`;

  const years = Math.floor(months / 12);
  return `Jogado há ${years} ${years === 1 ? 'ano' : 'anos'}`;
}

function filterAndSortGames(
  games: LibraryPayload['games'],
  query: string,
  sortOrder: SortOrder,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
  const filtered = normalizedQuery
    ? games.filter((game) =>
        game.title.toLocaleLowerCase('pt-BR').includes(normalizedQuery),
      )
    : games;

  return [...filtered].sort((left, right) => {
    if (sortOrder === 'most-played')
      return right.playtimeMinutes - left.playtimeMinutes;
    if (sortOrder === 'recent') {
      const rightTime = right.lastPlayedAt
        ? new Date(right.lastPlayedAt).getTime()
        : 0;
      const leftTime = left.lastPlayedAt
        ? new Date(left.lastPlayedAt).getTime()
        : 0;
      return rightTime - leftTime;
    }
    return left.title.localeCompare(right.title, 'pt-BR');
  });
}

function gameInitials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatRelativeDate(value: string) {
  const elapsedMs = Date.now() - new Date(value).getTime();
  const hours = Math.max(0, Math.floor(elapsedMs / 3_600_000));
  if (hours < 1) return 'há poucos minutos';
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
}
