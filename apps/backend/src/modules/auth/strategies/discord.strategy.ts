import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('DISCORD_CLIENT_ID'),
      clientSecret: configService.get<string>('DISCORD_CLIENT_SECRET'),
      callbackURL: `${configService.get<string>('API_URL')}/auth/discord/callback`,
      scope: ['identify', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { id, username, email, avatar, discriminator } = profile;
    
    const user = {
      discordId: id,
      email: email,
      firstName: username,
      lastName: discriminator ? `#${discriminator}` : '',
      avatar: avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png` : null,
      provider: 'discord',
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}