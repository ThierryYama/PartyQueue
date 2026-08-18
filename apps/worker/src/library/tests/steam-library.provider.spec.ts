import assert from 'node:assert/strict';
import test from 'node:test';
import { LibrarySyncError } from '../library.types';
import {
  fetchSteamOwnedGames,
  parseOwnedGames,
} from '../steam-library.provider';

void test('deduplicates Steam App IDs using the most complete playtime', () => {
  const result = parseOwnedGames([
    { appid: 440, name: 'Team Fortress 2', playtime_forever: 10 },
    { appid: 440, name: 'Team Fortress 2', playtime_forever: 120 },
  ]);

  assert.equal(result.games.length, 1);
  assert.equal(result.games[0]?.externalGameId, '440');
  assert.equal(result.games[0]?.playtimeMinutes, 120);
});

void test('keeps valid games when part of the provider response is invalid', () => {
  const result = parseOwnedGames([
    { appid: 570, name: 'Dota 2', playtime_forever: 60 },
    { appid: 'invalid', name: null },
  ]);

  assert.equal(result.games.length, 1);
  assert.equal(result.games[0]?.title, 'Dota 2');
  assert.equal(result.ignoredEntries, 1);
});

void test('maps the icon hash returned by Steam as a cover fallback', () => {
  const result = parseOwnedGames([
    {
      appid: 570,
      img_icon_url: '0123456789abcdef',
      name: 'Dota 2',
      playtime_forever: 60,
    },
  ]);

  assert.equal(
    result.games[0]?.fallbackCoverUrl,
    'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/570/0123456789abcdef.jpg',
  );
});

void test('drops a missing header while preserving the Steam icon fallback', async () => {
  const fetcher: typeof fetch = (_input, init) => {
    if (init?.method === 'HEAD') {
      return Promise.resolve(new Response(null, { status: 404 }));
    }

    return Promise.resolve(
      Response.json({
        response: {
          game_count: 1,
          games: [
            {
              appid: 570,
              img_icon_url: '0123456789abcdef',
              name: 'Dota 2',
              playtime_forever: 60,
            },
          ],
        },
      }),
    );
  };

  const result = await fetchSteamOwnedGames(
    '76561198000000000',
    'api-key',
    fetcher,
  );

  assert.equal(result.games[0]?.coverUrl, null);
  assert.match(result.games[0]?.fallbackCoverUrl ?? '', /0123456789abcdef/);
});

void test('maps an inaccessible Steam library to PRIVATE', async () => {
  const fetcher: typeof fetch = () =>
    Promise.resolve(Response.json({ response: {} }));

  await assert.rejects(
    fetchSteamOwnedGames('76561198000000000', 'api-key', fetcher),
    (error: unknown) =>
      error instanceof LibrarySyncError && error.code === 'PROFILE_PRIVATE',
  );
});

void test('maps an aborted Steam request to a retryable timeout', async () => {
  const fetcher: typeof fetch = () =>
    Promise.reject(new DOMException('Timed out', 'TimeoutError'));

  await assert.rejects(
    fetchSteamOwnedGames('76561198000000000', 'api-key', fetcher),
    (error: unknown) =>
      error instanceof LibrarySyncError &&
      error.code === 'PROVIDER_TIMEOUT' &&
      error.retryable,
  );
});
