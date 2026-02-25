import { JwtService } from '@nestjs/jwt';

export interface AuthLikeUser {
  id: string;
  email: string;
  role: string;
}

interface ApiDataResponse {
  data: unknown;
}

export function buildAuthHeader(jwtService: JwtService, user: AuthLikeUser): string {
  const token = jwtService.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return `Bearer ${token}`;
}

export function getDataFromBody(body: unknown): unknown {
  if (typeof body !== 'object' || body === null || !('data' in body)) {
    throw new Error('Expected response body to contain a data property');
  }

  const response = body as ApiDataResponse;
  return response.data;
}

export function getDataObjectFromBody(body: unknown): Record<string, unknown> {
  const data = getDataFromBody(body);

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('Expected response data to be an object');
  }

  return data as Record<string, unknown>;
}
