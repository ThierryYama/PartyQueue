import { Module } from '@nestjs/common';
import { AuthConfig } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { SignedTokenService } from './signed-token.service';
import { SteamIdentityProvider } from './steam-identity.provider';
import { SteamOpenIdService } from './steam-openid.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthConfig,
    AuthRepository,
    AuthService,
    SignedTokenService,
    SteamIdentityProvider,
    SteamOpenIdService,
  ],
})
export class AuthModule {}
