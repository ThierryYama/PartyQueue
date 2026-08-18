import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { AuthConfig } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { SignedTokenService } from './signed-token.service';
import { SessionService } from './session.service';
import { SteamIdentityProvider } from './steam-identity.provider';
import { SteamOpenIdService } from './steam-openid.service';

@Module({
  imports: [JobsModule],
  controllers: [AuthController],
  providers: [
    AuthConfig,
    AuthRepository,
    AuthService,
    SignedTokenService,
    SessionService,
    SteamIdentityProvider,
    SteamOpenIdService,
  ],
  exports: [SessionService],
})
export class AuthModule {}
