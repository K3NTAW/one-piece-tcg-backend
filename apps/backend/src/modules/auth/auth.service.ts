import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.usersService.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.usersService.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.email);

      return {
        user: this.usersService.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // Remove all sessions for the user
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    return { message: 'Logged out successfully' };
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return this.usersService.sanitizeUser(user);
  }

  private async generateTokens(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.session.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async oauthLogin(oauthUser: any) {
    const { email, firstName, lastName, avatar, provider, googleId, discordId, appleId } = oauthUser;
    
    // Generate username from email if not provided
    const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
    
    // Check if user exists by email
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          username,
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          avatar: avatar || null,
          provider,
          googleId: provider === 'google' ? googleId : null,
          discordId: provider === 'discord' ? discordId : null,
          appleId: provider === 'apple' ? appleId : null,
          isEmailVerified: true, // OAuth users have verified emails
        },
      });
    } else {
      // Update existing user with OAuth info if needed
      const updateData: any = {
        isEmailVerified: true,
      };

      if (provider === 'google' && googleId) {
        updateData.googleId = googleId;
      } else if (provider === 'discord' && discordId) {
        updateData.discordId = discordId;
      } else if (provider === 'apple' && appleId) {
        updateData.appleId = appleId;
      }

      if (!user.provider || user.provider !== provider) {
        updateData.provider = provider;
      }

      if (avatar && avatar !== user.avatar) {
        updateData.avatar = avatar;
      }

      user = await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.usersService.sanitizeUser(user),
      ...tokens,
    };
  }
}
