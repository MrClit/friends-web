import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import type { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const user = context.switchToHttp().getRequest<Request & { user?: { role?: string } }>().user;
    const role = user?.role;
    if (!role) {
      this.logger.warn(`Access denied: missing role. Required: ${requiredRoles.join(', ')}`);
      return false;
    }
    const allowed = requiredRoles.includes(role);
    if (!allowed) {
      this.logger.warn(`Access denied for role=${role}. Required: ${requiredRoles.join(', ')}`);
    }
    return allowed;
  }
}
