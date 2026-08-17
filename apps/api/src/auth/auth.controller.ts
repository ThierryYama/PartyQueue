import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { AuthConfig } from './auth.config';
import { AuthService } from './auth.service';
import type { OpenIdCallbackQuery } from './auth.types';
import { parseCookies, serializeCookie } from './cookies';
import { SignedTokenService } from './signed-token.service';
import { SteamIdentityProvider } from './steam-identity.provider';
import { SteamOpenIdService } from './steam-openid.service';

const OPENID_STATE_COOKIE = 'partyqueue_openid_state';
const SESSION_COOKIE = 'partyqueue_session';

type ApiRequest = { headers: { cookie?: string } };
type ApiResponse = {
  redirect(status: number, url: string): void;
  setHeader(name: string, value: string | string[]): void;
  status(status: number): { send(): void };
};

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly config: AuthConfig,
    private readonly openId: SteamOpenIdService,
    private readonly steam: SteamIdentityProvider,
    private readonly tokens: SignedTokenService,
  ) {}

  @Get('auth/steam')
  startSteamLogin(@Res() response: ApiResponse) {
    const state = this.tokens.createOpenIdState();

    response.setHeader(
      'Set-Cookie',
      serializeCookie(OPENID_STATE_COOKIE, state, {
        httpOnly: true,
        maxAge: 10 * 60,
        path: '/api/v1/auth/steam',
        sameSite: 'Lax',
        secure: this.config.isProduction,
      }),
    );
    response.redirect(HttpStatus.FOUND, this.openId.authorizationUrl(state));
  }

  @Get('auth/steam/callback')
  async finishSteamLogin(
    @Query() query: OpenIdCallbackQuery,
    @Req() request: ApiRequest,
    @Res() response: ApiResponse,
  ) {
    const clearStateCookie = serializeCookie(OPENID_STATE_COOKIE, '', {
      httpOnly: true,
      maxAge: 0,
      path: '/api/v1/auth/steam',
      sameSite: 'Lax',
      secure: this.config.isProduction,
    });

    try {
      const state = typeof query.state === 'string' ? query.state : '';
      const cookieState = parseCookies(request.headers.cookie).get(
        OPENID_STATE_COOKIE,
      );

      if (!state || !cookieState || !this.sameValue(state, cookieState)) {
        throw new Error('OpenID state does not match.');
      }

      this.tokens.verifyOpenIdState(state);
      const steamId = await this.openId.verify(query, state);
      const profile = await this.steam.getProfile(steamId);
      const user = await this.auth.signInWithSteam(profile);
      const session = this.tokens.createSession(user.id);

      response.setHeader('Set-Cookie', [
        clearStateCookie,
        serializeCookie(SESSION_COOKIE, session, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60,
          path: '/',
          sameSite: 'Lax',
          secure: this.config.isProduction,
        }),
      ]);
      response.redirect(HttpStatus.FOUND, `${this.config.webUrl}/dashboard`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown authentication error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Steam login callback failed: ${message}`, stack);

      response.setHeader('Set-Cookie', clearStateCookie);
      response.redirect(
        HttpStatus.FOUND,
        `${this.config.webUrl}/?authError=steam`,
      );
    }
  }

  @Get('me')
  async me(@Req() request: ApiRequest) {
    try {
      const session = parseCookies(request.headers.cookie).get(SESSION_COOKIE);
      if (!session) throw new Error('Session cookie is missing.');

      const payload = this.tokens.verifySession(session);
      const user = await this.auth.findUser(payload.sub!);
      if (!user) throw new Error('Session user no longer exists.');

      return { user };
    } catch {
      throw new UnauthorizedException({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication is required.',
        },
      });
    }
  }

  @Post('auth/logout')
  logout(@Res() response: ApiResponse) {
    response.setHeader(
      'Set-Cookie',
      serializeCookie(SESSION_COOKIE, '', {
        httpOnly: true,
        maxAge: 0,
        path: '/',
        sameSite: 'Lax',
        secure: this.config.isProduction,
      }),
    );
    response.status(HttpStatus.NO_CONTENT).send();
  }

  private sameValue(left: string, right: string) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }
}
