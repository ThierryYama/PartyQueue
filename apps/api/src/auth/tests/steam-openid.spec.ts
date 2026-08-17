import assert from 'node:assert/strict';
import test from 'node:test';
import type { OpenIdCallbackQuery } from '../auth.types';
import { verifySteamOpenIdAssertion } from '../steam-openid.service';

const steamId = '76561198000000000';
const returnUrl =
  'http://localhost:3333/api/v1/auth/steam/callback?state=signed';

function validQuery(): OpenIdCallbackQuery {
  const identity = `https://steamcommunity.com/openid/id/${steamId}`;

  return {
    'openid.assoc_handle': '1234567890',
    'openid.claimed_id': identity,
    'openid.identity': identity,
    'openid.mode': 'id_res',
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.op_endpoint': 'https://steamcommunity.com/openid/login',
    'openid.response_nonce': '2026-08-14T12:00:00Znonce',
    'openid.return_to': returnUrl,
    'openid.sig': 'signature',
    'openid.signed': 'signed,op_endpoint,claimed_id,identity,return_to',
    state: 'signed',
  };
}

void test('accepts a callback that Steam validates', async () => {
  const fetcher: typeof fetch = () =>
    Promise.resolve(
      new Response('ns:http://specs.openid.net/auth/2.0\nis_valid:true\n'),
    );

  const result = await verifySteamOpenIdAssertion(
    validQuery(),
    returnUrl,
    fetcher,
  );

  assert.equal(result, steamId);
});

void test('rejects a callback that Steam marks as invalid', async () => {
  const fetcher: typeof fetch = () =>
    Promise.resolve(new Response('is_valid:false\n'));

  await assert.rejects(
    verifySteamOpenIdAssertion(validQuery(), returnUrl, fetcher),
    /rejected the OpenID assertion/,
  );
});

void test('rejects a callback sent to a different return URL', async () => {
  const fetcher: typeof fetch = () =>
    Promise.resolve(new Response('is_valid:true\n'));

  await assert.rejects(
    verifySteamOpenIdAssertion(
      validQuery(),
      'http://localhost:3333/api/v1/auth/steam/callback?state=other',
      fetcher,
    ),
    /Unexpected OpenID assertion fields/,
  );
});
