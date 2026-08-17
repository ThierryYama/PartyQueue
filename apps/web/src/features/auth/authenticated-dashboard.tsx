'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type User = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  steam: { id: string; profileUrl: string | null };
};

type LoadState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'ready'; user: User }
  | { status: 'error' };

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api/v1';

export function AuthenticatedDashboard() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    void fetch(`${apiUrl}/me`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          setState({ status: 'anonymous' });
          return;
        }
        if (!response.ok) throw new Error('Could not load the session.');

        const payload = (await response.json()) as { user: User };
        setState({ status: 'ready', user: payload.user });
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
    return (
      <main className="mx-auto grid min-h-screen w-full max-w-3xl place-items-center px-6 py-12">
        <div className="w-full rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">
            {state.status === 'loading' ? 'validando sessão' : 'sessão ausente'}
          </p>
          <h1 className="font-display mt-4 text-3xl font-semibold">
            {state.status === 'loading'
              ? 'Preparando seu lobby…'
              : 'Entre com a Steam para abrir seu lobby.'}
          </h1>
          {state.status !== 'loading' ? (
            <Link
              className="mt-7 inline-flex rounded-xl bg-decision px-5 py-3 font-semibold text-[#16120a]"
              href="/"
            >
              Voltar para o login
            </Link>
          ) : null}
        </div>
      </main>
    );
  }

  const { user } = state;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-7 sm:px-10">
      <header className="flex items-center justify-between border-b border-line pb-6">
        <Link
          className="font-display font-semibold tracking-[0.16em] uppercase"
          href="/"
        >
          Party<span className="text-decision">Queue</span>
        </Link>
        <button
          className="font-mono text-xs text-muted transition hover:text-foreground disabled:opacity-50"
          disabled={isLoggingOut}
          onClick={() => void logout()}
          type="button"
        >
          {isLoggingOut ? 'saindo…' : 'sair'}
        </button>
      </header>

      <section className="py-12 sm:py-16">
        <p className="font-mono text-xs tracking-[0.14em] text-decision uppercase">
          identidade confirmada
        </p>
        <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Seu lugar na party está reservado.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
          A Steam já identifica você. A biblioteca será a próxima peça para
          descobrir o que o grupo consegue jogar.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-center gap-4">
              {user.avatarUrl ? (
                <Image
                  alt={`Avatar de ${user.displayName}`}
                  className="size-16 rounded-xl border border-steam-blue/25"
                  height={64}
                  src={user.avatarUrl}
                  width={64}
                />
              ) : (
                <span className="grid size-16 place-items-center rounded-xl bg-surface-raised font-display text-xl">
                  {user.displayName.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="font-display truncate text-xl font-semibold">
                  {user.displayName}
                </p>
                <p className="mt-1 font-mono text-[0.68rem] text-muted">
                  SteamID · {user.steam.id}
                </p>
              </div>
            </div>
            {user.steam.profileUrl ? (
              <a
                className="mt-6 inline-flex text-sm text-steam-blue hover:underline"
                href={user.steam.profileUrl}
                rel="noreferrer"
                target="_blank"
              >
                Ver perfil na Steam ↗
              </a>
            ) : null}
          </article>

          <article className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
            <p className="font-mono text-[0.68rem] tracking-[0.14em] text-muted uppercase">
              onboarding · 1 de 3
            </p>
            <ol className="mt-6 space-y-5">
              <Step done label="Conectar identidade Steam" />
              <Step label="Sincronizar biblioteca" />
              <Step label="Montar a primeira party" />
            </ol>
            <div className="mt-7 rounded-xl border border-decision/25 bg-decision/[0.06] p-4 text-sm leading-6 text-muted">
              Próxima etapa: importar seus jogos com privacidade e tratar
              bibliotecas privadas como um estado normal.
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

function Step({ done = false, label }: { done?: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`grid size-7 place-items-center rounded-full border font-mono text-xs ${
          done
            ? 'border-decision bg-decision text-[#16120a]'
            : 'border-line text-muted'
        }`}
      >
        {done ? '✓' : '·'}
      </span>
      <span className={done ? 'text-foreground' : 'text-muted'}>{label}</span>
    </li>
  );
}
