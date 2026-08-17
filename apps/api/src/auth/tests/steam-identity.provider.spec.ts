import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchSteamProfile } from '../steam-identity.provider';

const steamId = '76561198000000000';

void test('loads a Steam profile through the public Web API host', async () => {
  let requestedUrl: URL | undefined;
  const fetcher: typeof fetch = (input) => {
    requestedUrl =
      input instanceof URL
        ? input
        : new URL(typeof input === 'string' ? input : input.url);
    return Promise.resolve(
      Response.json({
        response: {
          players: [
            {
              avatarfull: 'https://avatars.steamstatic.com/example_full.jpg',
              personaname: 'Queue Player',
              profileurl: 'https://steamcommunity.com/id/queue-player/',
              steamid: steamId,
            },
          ],
        },
      }),
    );
  };

  const profile = await fetchSteamProfile(steamId, 'server-api-key', fetcher);

  assert.equal(requestedUrl?.hostname, 'api.steampowered.com');
  assert.equal(requestedUrl?.searchParams.get('key'), 'server-api-key');
  assert.equal(requestedUrl?.searchParams.get('steamids'), steamId);
  assert.equal(profile.displayName, 'Queue Player');
  assert.equal(profile.steamId, steamId);
});

void test('reports the Steam response status without exposing the API key', async () => {
  const fetcher: typeof fetch = () =>
    Promise.resolve(new Response(null, { status: 403 }));

  await assert.rejects(
    fetchSteamProfile(steamId, 'server-api-key', fetcher),
    /Steam profile request failed \(403\)/,
  );
});
