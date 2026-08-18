import { Injectable } from '@nestjs/common';
import type {
  ExternalOwnedGame,
  GamingPlatformProvider,
  OwnedGamesResult,
} from './library.types';
import { LibrarySyncError } from './library.types';

const OWNED_GAMES_ENDPOINT =
  'https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/';
const DEFAULT_TIMEOUT_MS = 10_000;
const COVER_TIMEOUT_MS = 4_000;
const COVER_CHECK_CONCURRENCY = 12;

type Fetcher = typeof fetch;
type SteamGame = {
  appid?: unknown;
  name?: unknown;
  img_icon_url?: unknown;
  playtime_forever?: unknown;
  rtime_last_played?: unknown;
};

export async function fetchSteamOwnedGames(
  steamId: string,
  apiKey: string,
  fetcher: Fetcher = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<OwnedGamesResult> {
  if (!apiKey) {
    throw new LibrarySyncError(
      'INVALID_CONFIGURATION',
      'STEAM_API_KEY is required by the library worker.',
      false,
    );
  }

  const url = new URL(OWNED_GAMES_ENDPOINT);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('steamid', steamId);
  url.searchParams.set('include_appinfo', 'true');
  url.searchParams.set('include_played_free_games', 'true');
  url.searchParams.set('format', 'json');

  let response: Response;
  try {
    response = await fetcher(url, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      ['AbortError', 'TimeoutError'].includes(error.name);
    throw new LibrarySyncError(
      timedOut ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE',
      timedOut
        ? 'Steam library request timed out.'
        : 'Steam library request could not be completed.',
      true,
      { cause: error },
    );
  }

  if (!response.ok) {
    const retryable = response.status === 429 || response.status >= 500;
    throw new LibrarySyncError(
      'PROVIDER_UNAVAILABLE',
      `Steam library request failed (${response.status}).`,
      retryable,
    );
  }

  const payload = (await response.json()) as {
    response?: { game_count?: unknown; games?: unknown };
  };
  const result = payload.response;
  if (!result || typeof result.game_count !== 'number') {
    throw new LibrarySyncError(
      'PROFILE_PRIVATE',
      'The Steam library is private or unavailable.',
      false,
    );
  }
  if (result.game_count === 0) return { games: [], ignoredEntries: 0 };
  if (!Array.isArray(result.games)) {
    throw new LibrarySyncError(
      'INVALID_PROVIDER_RESPONSE',
      'Steam returned an invalid owned-games response.',
      true,
    );
  }

  return validateSteamCovers(
    parseOwnedGames(result.games as SteamGame[]),
    fetcher,
  );
}

async function validateSteamCovers(
  result: OwnedGamesResult,
  fetcher: Fetcher,
): Promise<OwnedGamesResult> {
  const games = [...result.games];
  let cursor = 0;

  async function checkNext() {
    while (cursor < games.length) {
      const index = cursor++;
      const game = games[index];
      if (!game?.coverUrl) continue;

      try {
        const response = await fetcher(game.coverUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(COVER_TIMEOUT_MS),
        });
        if ([404, 410].includes(response.status)) {
          games[index] = { ...game, coverUrl: null };
        }
      } catch {
        // Uma falha transitória na CDN não deve descartar uma capa conhecida.
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(COVER_CHECK_CONCURRENCY, games.length) },
      () => checkNext(),
    ),
  );

  return { ...result, games };
}

export function parseOwnedGames(games: SteamGame[]): OwnedGamesResult {
  const unique = new Map<string, ExternalOwnedGame>();
  let ignoredEntries = 0;

  for (const game of games) {
    if (
      !Number.isInteger(game.appid) ||
      Number(game.appid) <= 0 ||
      typeof game.name !== 'string' ||
      !game.name.trim()
    ) {
      ignoredEntries += 1;
      continue;
    }

    const appId = String(game.appid);
    const iconHash =
      typeof game.img_icon_url === 'string' &&
      /^[a-f0-9]+$/i.test(game.img_icon_url)
        ? game.img_icon_url
        : null;
    const playtimeMinutes =
      typeof game.playtime_forever === 'number' &&
      Number.isFinite(game.playtime_forever)
        ? Math.max(0, Math.trunc(game.playtime_forever))
        : 0;
    const lastPlayedAt =
      typeof game.rtime_last_played === 'number' && game.rtime_last_played > 0
        ? new Date(game.rtime_last_played * 1_000)
        : null;
    const candidate: ExternalOwnedGame = {
      externalGameId: appId,
      title: game.name.trim(),
      coverUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
      fallbackCoverUrl: iconHash
        ? `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`
        : null,
      playtimeMinutes,
      lastPlayedAt,
    };
    const previous = unique.get(appId);
    if (!previous || candidate.playtimeMinutes > previous.playtimeMinutes) {
      unique.set(appId, candidate);
    }
  }

  return { games: [...unique.values()], ignoredEntries };
}

@Injectable()
export class SteamLibraryProvider implements GamingPlatformProvider {
  getOwnedGames(externalUserId: string) {
    return fetchSteamOwnedGames(
      externalUserId,
      process.env.STEAM_API_KEY ?? '',
    );
  }
}
