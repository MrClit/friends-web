import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsOptional, IsString } from 'class-validator';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { CurrentUserProfileDto } from '../users/dto/current-user-profile.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import express from 'express';

class RefreshTokenDto {
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport will handle the redirect
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request & { user: User }, @Res() res: express.Response) {
    return this.redirectToFrontendWithToken(req.user, res);
  }

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth() {
    // Passport will handle the redirect
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthRedirect(@Req() req: Request & { user: User }, @Res() res: express.Response) {
    return this.redirectToFrontendWithToken(req.user, res);
  }

  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto, @Res() res: express.Response) {
    const rawToken = body.refreshToken;
    if (!rawToken) {
      throw new UnauthorizedException();
    }

    const { rawToken: newRawToken, userId } = await this.authService.rotateRefreshToken(rawToken);
    const user = await this.usersService.findByIdOrThrow(userId).catch(() => {
      throw new UnauthorizedException();
    });
    const accessToken = this.authService.generateJwt(user);

    return res.json({ data: { accessToken, refreshToken: newRawToken } });
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Body() body: RefreshTokenDto, @Res() res: express.Response) {
    if (body.refreshToken) {
      await this.authService.revokeRefreshToken(body.refreshToken);
    }
    return res.json({ data: null });
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiStandardResponse(200, 'Current user profile retrieved successfully', CurrentUserProfileDto)
  getProfile(@Req() req: Request & { user: User }) {
    return this.usersService.toCurrentUserProfile(req.user);
  }

  private async redirectToFrontendWithToken(user: User, res: express.Response) {
    const { refreshToken } = await this.authService.generateAuthTokens(user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173/friends-web/#';
    const redirectUrl = `${frontendUrl}/auth/callback?success=true&refreshToken=${encodeURIComponent(refreshToken)}`;
    return res.redirect(redirectUrl);
  }
}
