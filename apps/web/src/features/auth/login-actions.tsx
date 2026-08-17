import Link from 'next/link';

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api/v1';

function SteamMark() {
  return (
    <svg aria-hidden="true" className="size-6" viewBox="0 0 24 24">
      <path
        d="M12 2a10 10 0 0 0-9.9 8.6l5.3 2.2a3.1 3.1 0 0 1 1.7-.5l2.4-3.5a4.1 4.1 0 1 1 4 4.9l-3.7 2.6a3.1 3.1 0 0 1-6.1.8L2.6 16A10 10 0 1 0 12 2Zm-3.4 16.5a2.1 2.1 0 0 1-1.1-3.9l1.7.7a1.5 1.5 0 1 1-1.1 2.8l-1.7-.7a2.1 2.1 0 0 0 2.2 1.1Zm6.8-6.1a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function LoginActions({ hasError }: { hasError: boolean }) {
  return (
    <div className="mt-8 space-y-3">
      {hasError ? (
        <p
          className="rounded-lg border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          A Steam não confirmou o login. Tente novamente em alguns instantes.
        </p>
      ) : null}

      <a
        className="flex min-h-13 w-full items-center justify-center gap-3 rounded-xl bg-steam-navy px-5 py-3.5 font-semibold text-steam-blue ring-1 ring-steam-blue/35 transition hover:-translate-y-0.5 hover:bg-[#22354a] hover:ring-steam-blue/60 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-steam-blue"
        href={`${apiUrl}/auth/steam`}
      >
        <SteamMark />
        Entrar com Steam
      </a>
      <Link
        className="flex min-h-12 w-full items-center justify-center rounded-xl border border-line px-5 py-3 text-sm font-medium text-foreground transition hover:border-decision/60 hover:text-decision focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-decision"
        href="/demo"
      >
        Explorar uma party de demonstração
      </Link>
    </div>
  );
}
