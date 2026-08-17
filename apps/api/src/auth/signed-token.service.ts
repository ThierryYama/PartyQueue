import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { AuthConfig } from './auth.config';

type TokenPurpose = 'session' | 'steam-openid-state';

type SignedTokenPayload = {
  exp: number;
  nonce?: string;
  purpose: TokenPurpose;
  sub?: string;
};

@Injectable()
export class SignedTokenService {
  constructor(private readonly config: AuthConfig) {}

  createOpenIdState() {
    return this.sign({
      exp: this.expiresIn(10 * 60),
      nonce: randomBytes(24).toString('base64url'),
      purpose: 'steam-openid-state',
    });
  }

  verifyOpenIdState(token: string) {
    return this.verify(token, 'steam-openid-state');
  }

  createSession(userId: string) {
    return this.sign({
      exp: this.expiresIn(7 * 24 * 60 * 60),
      purpose: 'session',
      sub: userId,
    });
  }

  verifySession(token: string) {
    const payload = this.verify(token, 'session');
    if (!payload.sub) throw new Error('Session subject is missing.');
    return payload;
  }

  private expiresIn(seconds: number) {
    return Math.floor(Date.now() / 1000) + seconds;
  }

  private sign(payload: SignedTokenPayload) {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.signature(body);
    return `${body}.${signature}`;
  }

  private verify(token: string, purpose: TokenPurpose) {
    const [body, signature, extra] = token.split('.');
    if (!body || !signature || extra) throw new Error('Malformed token.');

    const actual = Buffer.from(signature, 'base64url');
    const expected = Buffer.from(this.signature(body), 'base64url');

    if (
      actual.length !== expected.length ||
      !timingSafeEqual(actual, expected)
    ) {
      throw new Error('Invalid token signature.');
    }

    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as Partial<SignedTokenPayload>;

    if (payload.purpose !== purpose || typeof payload.exp !== 'number') {
      throw new Error('Invalid token payload.');
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new Error('Expired token.');
    }

    return payload as SignedTokenPayload;
  }

  private signature(body: string) {
    return createHmac('sha256', this.config.sessionSecret)
      .update(body)
      .digest('base64url');
  }
}
