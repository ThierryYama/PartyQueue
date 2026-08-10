export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-6 py-8 sm:px-10 sm:py-10">
      <header className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-[0.22em] text-lime-300 uppercase">
          PartyQueue
        </span>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
          Fundação do MVP
        </span>
      </header>

      <section className="py-24 sm:py-32">
        <p className="mb-5 font-mono text-sm text-lime-300">
          lobby://aguardando-jogadores
        </p>
        <h1 className="max-w-4xl text-5xl leading-[1.04] font-semibold tracking-tight text-balance sm:text-7xl">
          Menos tempo discutindo. Mais tempo jogando.
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-400 sm:text-xl">
          O PartyQueue combina as bibliotecas e o contexto da sessão para
          responder uma pergunta simples: o que o nosso grupo consegue jogar
          hoje?
        </p>
        <div className="mt-10 flex flex-wrap gap-3 text-sm text-zinc-300">
          {['Next.js', 'NestJS', 'PostgreSQL', 'Prisma', 'Turborepo'].map(
            (technology) => (
              <span
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                key={technology}
              >
                {technology}
              </span>
            ),
          )}
        </div>
      </section>

      <footer className="border-t border-white/10 pt-5 text-sm text-zinc-500">
        Monólito modular · ranking determinístico · Steam-first
      </footer>
    </main>
  );
}
