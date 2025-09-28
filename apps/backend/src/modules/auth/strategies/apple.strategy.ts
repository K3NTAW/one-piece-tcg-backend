import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('APPLE_CLIENT_ID'),
      teamID: configService.get<string>('APPLE_TEAM_ID'),
      keyID: configService.get<string>('APPLE_KEY_ID'),
      privateKeyString: configService.get<string>('APPLE_PRIVATE_KEY'),
      callbackURL: `${configService.get<string>('API_URL')}/auth/apple/callback`,
      scope: ['name', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { id, name, email } = profile;
    
    const user = {
      appleId: id,
      email: email,
      firstName: name?.firstName || '',
      lastName: name?.lastName || '',
      avatar: null, // Apple doesn't provide avatar
      provider: 'apple',
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}