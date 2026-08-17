import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Party de demonstração' };

const games = [
  { name: 'Deep Rock Galactic', owners: '4/4', fit: 'ótimo para 90 min' },
  { name: 'Overcooked! 2', owners: '4/4', fit: 'sessão curta' },
  { name: 'Valheim', owners: '3/4', fit: '1 pessoa precisa entrar' },
];

export default function DemoPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-8 sm:px-10">
      <header className="flex items-center justify-between border-b border-line pb-6">
        <Link
          className="font-display font-semibold tracking-[0.16em] uppercase"
          href="/"
        >
          Party<span className="text-decision">Queue</span>
        </Link>
        <span className="font-mono text-[0.68rem] text-muted uppercase">
          modo demo
        </span>
      </header>

      <section className="py-12">
        <p className="font-mono text-xs tracking-[0.14em] text-steam-blue uppercase">
          party://sexta-à-noite
        </p>
        <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Quatro pessoas. Três caminhos possíveis.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
          Esta prévia usa dados fictícios para mostrar a direção do produto sem
          exigir uma conta Steam.
        </p>

        <div className="mt-10 space-y-4">
          {games.map((game, index) => (
            <article
              className={`grid gap-4 rounded-2xl border p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center ${
                index === 0
                  ? 'border-decision/45 bg-decision/[0.06]'
                  : 'border-line bg-surface'
              }`}
              key={game.name}
            >
              <span className="font-mono text-sm text-muted">0{index + 1}</span>
              <div>
                <h2 className="font-display text-xl font-semibold">
                  {game.name}
                </h2>
                <p className="mt-1 text-sm text-muted">{game.fit}</p>
              </div>
              <span className="font-mono text-xs text-steam-blue">
                {game.owners} possuem
              </span>
            </article>
          ))}
        </div>

        <Link
          className="mt-8 inline-flex rounded-xl border border-line px-5 py-3 text-sm hover:border-decision/60 hover:text-decision"
          href="/"
        >
          Voltar para o login
        </Link>
      </section>
    </main>
  );
}
