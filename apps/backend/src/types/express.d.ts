// src/types/express.d.ts
import type { User as AppUser } from '../modules/users/user.entity';

declare global {
  namespace Express {
    interface User extends AppUser {
      id: string; // Example property to ensure the interface is not empty
    }
  }
}

export {};
