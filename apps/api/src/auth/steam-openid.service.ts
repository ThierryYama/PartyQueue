import { Injectable } from '@nestjs/common';
import { AuthConfig } from './auth.config';
import type { OpenIdCallbackQuery } from './auth.types';

const OPENID_NAMESPACE = 'http://specs.openid.net/auth/2.0';
const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';
const STEAM_ID_PATTERN =
  /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

type Fetcher = typeof fetch;

function requiredValue(query: OpenIdCallbackQuery, key: string) {
  const value = query[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing OpenID field: ${key}`);
  }
  return value;
}

export async function verifySteamOpenIdAssertion(
  query: OpenIdCallbackQuery,
  expectedReturnUrl: string,
  fetcher: Fetcher = fetch,
) {
  const claimedId = requiredValue(query, 'openid.claimed_id');
  const identity = requiredValue(query, 'openid.identity');

  if (
    requiredValue(query, 'openid.ns') !== OPENID_NAMESPACE ||
    requiredValue(query, 'openid.mode') !== 'id_res' ||
    requiredValue(query, 'openid.op_endpoint') !== STEAM_OPENID_ENDPOINT ||
    requiredValue(query, 'openid.return_to') !== expectedReturnUrl ||
    identity !== claimedId
  ) {
    throw new Error('Unexpected OpenID assertion fields.');
  }

  const steamId = STEAM_ID_PATTERN.exec(claimedId)?.[1];
  if (!steamId) throw new Error('Invalid Steam identity URL.');

  const verification = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('openid.') && typeof value === 'string') {
      verification.set(key, value);
    }
  }
  verification.set('openid.mode', 'check_authentication');

  const response = await fetcher(STEAM_OPENID_ENDPOINT, {
    body: verification,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  });

  if (!response.ok) throw new Error('Steam OpenID verification failed.');

  const values = new Map(
    (await response.text())
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(':');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );

  if (values.get('is_valid') !== 'true') {
    throw new Error('Steam rejected the OpenID assertion.');
  }

  return steamId;
}

@Injectable()
export class SteamOpenIdService {
  constructor(private readonly config: AuthConfig) {}

  authorizationUrl(state: string) {
    const returnUrl = this.returnUrl(state);
    const realm = new URL('/', this.config.steamOpenIdReturnUrl).toString();
    const url = new URL(STEAM_OPENID_ENDPOINT);

    url.search = new URLSearchParams({
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.mode': 'checkid_setup',
      'openid.ns': OPENID_NAMESPACE,
      'openid.realm': realm,
      'openid.return_to': returnUrl,
    }).toString();

    return url.toString();
  }

  verify(query: OpenIdCallbackQuery, state: string) {
    return verifySteamOpenIdAssertion(query, this.returnUrl(state));
  }

  private returnUrl(state: string) {
    const url = new URL(this.config.steamOpenIdReturnUrl);
    url.searchParams.set('state', state);
    return url.toString();
  }
}
