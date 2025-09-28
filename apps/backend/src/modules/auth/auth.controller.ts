import { Controller, Post, Body, UseGuards, Get, Request, Res, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@Request() req) {
    return req.user;
  }

  // Google OAuth routes
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleAuth() {
    // This route will redirect to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async googleAuthCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.oauthLogin(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Redirect to frontend with tokens as query parameters
    res.redirect(`${frontendUrl}/auth/callback?access_token=${result.accessToken}&refresh_token=${result.refreshToken}`);
  }

  // Discord OAuth routes
  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  @ApiOperation({ summary: 'Initiate Discord OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Discord OAuth' })
  async discordAuth() {
    // This route will redirect to Discord
  }

  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  @ApiOperation({ summary: 'Discord OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async discordAuthCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.oauthLogin(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Redirect to frontend with tokens as query parameters
    res.redirect(`${frontendUrl}/auth/callback?access_token=${result.accessToken}&refresh_token=${result.refreshToken}`);
  }

  // Apple OAuth routes
  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({ summary: 'Initiate Apple OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Apple OAuth' })
  async appleAuth() {
    // This route will redirect to Apple
  }

  @Get('apple/callback')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({ summary: 'Apple OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async appleAuthCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.oauthLogin(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Redirect to frontend with tokens as query parameters
    res.redirect(`${frontendUrl}/auth/callback?access_token=${result.accessToken}&refresh_token=${result.refreshToken}`);
  }
}
