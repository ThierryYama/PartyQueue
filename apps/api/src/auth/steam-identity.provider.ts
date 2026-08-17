import { Injectable } from '@nestjs/common';
import { AuthConfig } from './auth.config';
import type { SteamProfile } from './auth.types';

type SteamPlayerSummary = {
  avatarfull?: unknown;
  personaname?: unknown;
  profileurl?: unknown;
  steamid?: unknown;
};

type Fetcher = typeof fetch;

const STEAM_PLAYER_SUMMARIES_ENDPOINT =
  'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/';

export async function fetchSteamProfile(
  steamId: string,
  apiKey: string,
  fetcher: Fetcher = fetch,
): Promise<SteamProfile> {
  const url = new URL(STEAM_PLAYER_SUMMARIES_ENDPOINT);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('steamids', steamId);

  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Steam profile request failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    response?: { players?: SteamPlayerSummary[] };
  };
  const player = payload.response?.players?.[0];

  if (
    player?.steamid !== steamId ||
    typeof player.personaname !== 'string' ||
    typeof player.profileurl !== 'string'
  ) {
    throw new Error('Steam profile response is invalid.');
  }

  return {
    steamId,
    displayName: player.personaname.trim() || `Steam ${steamId.slice(-4)}`,
    avatarUrl: typeof player.avatarfull === 'string' ? player.avatarfull : null,
    profileUrl: player.profileurl,
  };
}

@Injectable()
export class SteamIdentityProvider {
  constructor(private readonly config: AuthConfig) {}

  getProfile(steamId: string) {
    return fetchSteamProfile(steamId, this.config.steamApiKey);
  }
}
