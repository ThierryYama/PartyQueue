import { Injectable } from '@nestjs/common';
import { z } from 'zod';

const authEnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  SESSION_SECRET: z.string().min(32),
  STEAM_API_KEY: z.string().min(1),
  STEAM_OPENID_RETURN_URL: z.url(),
  WEB_URL: z.url().default('http://localhost:3000'),
});

@Injectable()
export class AuthConfig {
  readonly isProduction: boolean;
  readonly sessionSecret: string;
  readonly steamApiKey: string;
  readonly steamOpenIdReturnUrl: string;
  readonly webUrl: string;

  constructor() {
    const result = authEnvironmentSchema.safeParse(process.env);

    if (!result.success) {
      const fields = result.error.issues
        .map((issue) => issue.path.join('.'))
        .join(', ');
      throw new Error(`Invalid authentication configuration: ${fields}`);
    }

    this.isProduction = result.data.NODE_ENV === 'production';
    this.sessionSecret = result.data.SESSION_SECRET;
    this.steamApiKey = result.data.STEAM_API_KEY;
    this.steamOpenIdReturnUrl = result.data.STEAM_OPENID_RETURN_URL;
    this.webUrl = result.data.WEB_URL.replace(/\/$/, '');
  }
}
