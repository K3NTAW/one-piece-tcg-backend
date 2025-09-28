import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('DISCORD_CLIENT_ID'),
      clientSecret: configService.get('DISCORD_CLIENT_SECRET'),
      callbackURL: '/auth/discord/callback',
      scope: ['identify', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ) {
    const user = {
      email: profile.email,
      name: profile.username,
      picture: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
      accessToken,
    };
    done(null, user);
  }
}
