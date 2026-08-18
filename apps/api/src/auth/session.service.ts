import { Injectable, UnauthorizedException } from '@nestjs/common';
import { parseCookies } from './cookies';
import { SignedTokenService } from './signed-token.service';

export const SESSION_COOKIE = 'partyqueue_session';

export type SessionRequest = { headers: { cookie?: string } };

@Injectable()
export class SessionService {
  constructor(private readonly tokens: SignedTokenService) {}

  authenticatedUserId(request: SessionRequest) {
    try {
      const session = parseCookies(request.headers.cookie).get(SESSION_COOKIE);
      if (!session) throw new Error('Session cookie is missing.');

      return this.tokens.verifySession(session).sub!;
    } catch {
      throw new UnauthorizedException({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication is required.',
        },
      });
    }
  }
}
