import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { User } from '../users/user.entity';
import express from 'express';

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
  googleAuthRedirect(@Req() req: Request & { user: User }, @Res() res: express.Response) {
    // El usuario ya está validado por el guard
    // Generar JWT y devolverlo al frontend
    const user = req.user;
    const token = this.authService.generateJwt(user);
    // Redirigir a una página intermedia del frontend que guarda el token y redirige a Home
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173/friends-web/#';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}&id=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}&avatar=${encodeURIComponent(user.avatar || '')}&role=${encodeURIComponent(user.role)}`;
    return res.redirect(redirectUrl);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: Request & { user: User }) {
    return req.user;
  }
}
