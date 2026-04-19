import { Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';
import { AuthService } from './auth.service';
import type { CookieOptions, Request } from 'express';
import { CurrentUserProfileDto } from '../users/dto/current-user-profile.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import express from 'express';

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
  async refresh(@Req() req: Request, @Res() res: express.Response) {
    const rawToken = req.cookies?.refresh_token as string | undefined;
    if (!rawToken) {
      throw new UnauthorizedException();
    }

    const { rawToken: newRawToken, userId } = await this.authService.rotateRefreshToken(rawToken);
    const user = await this.usersService.findByIdOrThrow(userId).catch(() => {
      throw new UnauthorizedException();
    });
    const accessToken = this.authService.generateJwt(user);

    res.cookie('refresh_token', newRawToken, this.getRefreshCookieOptions());
    return res.json({ data: { accessToken } });
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: Request, @Res() res: express.Response) {
    const rawToken = req.cookies?.refresh_token as string | undefined;
    if (rawToken) {
      await this.authService.revokeRefreshToken(rawToken);
    }

    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('refresh_token', {
      path: '/api/auth',
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'strict',
    } as const);
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

    res.cookie('refresh_token', refreshToken, this.getRefreshCookieOptions());

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173/friends-web/#';
    const redirectUrl = `${frontendUrl}/auth/callback?success=true`;
    return res.redirect(redirectUrl);
  }

  private getRefreshCookieOptions(): CookieOptions {
    const configuredDays = Number(process.env.REFRESH_TOKEN_EXPIRATION_DAYS ?? '30');
    const tokenDays = Number.isFinite(configuredDays) && configuredDays > 0 ? configuredDays : 30;

    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'strict',
      path: '/api/auth',
      maxAge: tokenDays * 24 * 60 * 60 * 1000,
    } as const;
  }
}
