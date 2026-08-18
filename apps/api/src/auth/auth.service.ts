import { Injectable } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import type { SteamProfile } from './auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async signInWithSteam(profile: SteamProfile) {
    const userId = await this.repository.findBySteamId(profile.steamId);
    return userId
      ? this.repository.refreshUser(userId, profile)
      : this.repository.createUser(profile);
  }

  findUser(userId: string) {
    return this.repository.findByUserId(userId);
  }

  librarySyncTarget(userId: string) {
    return this.repository.librarySyncTarget(userId);
  }

  markLibrarySyncFailed(externalAccountId: string) {
    return this.repository.markLibrarySyncFailed(externalAccountId);
  }
}
