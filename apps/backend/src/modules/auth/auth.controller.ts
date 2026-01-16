import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { User } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport will handle the redirect
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request & { user: User }) {
    // El usuario ya está validado por el guard
    // Generar JWT y devolverlo al frontend
    const user = req.user;
    const token = this.authService.generateJwt(user);
    return { data: { token, user } };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: Request & { user: User }) {
    const user = req.user;
    return { data: user };
  }
}
