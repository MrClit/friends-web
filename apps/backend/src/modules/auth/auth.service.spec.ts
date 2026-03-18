import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../users/user.entity';
import { CloudinaryAvatarService } from './cloudinary-avatar.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmail: jest.Mock; updateProfileIfChanged: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let cloudinaryAvatarService: { isCloudinaryAvatarUrl: jest.Mock; uploadGoogleAvatar: jest.Mock };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      updateProfileIfChanged: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    };
    cloudinaryAvatarService = {
      isCloudinaryAvatarUrl: jest.fn().mockReturnValue(false),
      uploadGoogleAvatar: jest.fn(),
    };
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      cloudinaryAvatarService as unknown as CloudinaryAvatarService,
    );
  });

  it('rejects unknown email', async () => {
    usersService.findByEmail.mockResolvedValue(undefined);
    await expect(service.validateOrRejectGoogleUser('no@exist.com')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('uploads avatar to Cloudinary when user has no Cloudinary avatar yet', async () => {
    const user: User = {
      id: '1',
      email: 'a@b.com',
      role: 'user',
      name: '',
      avatar: 'https://googleusercontent.com/legacy-avatar',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const cloudinaryAvatarUrl =
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_128,h_128,g_face,f_auto,q_auto,dpr_auto/friends/avatars/user-1';
    usersService.findByEmail.mockResolvedValue(user);
    cloudinaryAvatarService.uploadGoogleAvatar.mockResolvedValue(cloudinaryAvatarUrl);

    await expect(service.validateOrRejectGoogleUser('a@b.com', 'Name', 'avatar')).resolves.toBe(user);

    expect(cloudinaryAvatarService.isCloudinaryAvatarUrl).toHaveBeenCalledWith(user.avatar);
    expect(cloudinaryAvatarService.uploadGoogleAvatar).toHaveBeenCalledWith('avatar', user.id);
    expect(usersService.updateProfileIfChanged).toHaveBeenCalledWith(user, 'Name', cloudinaryAvatarUrl);
  });

  it('keeps existing Cloudinary avatar and skips upload', async () => {
    const user: User = {
      id: '1',
      email: 'a@b.com',
      role: 'user',
      name: 'Existing Name',
      avatar:
        'https://res.cloudinary.com/demo/image/upload/c_fill,w_128,h_128,g_face,f_auto,q_auto,dpr_auto/friends/avatars/user-1',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    usersService.findByEmail.mockResolvedValue(user);
    cloudinaryAvatarService.isCloudinaryAvatarUrl.mockReturnValue(true);

    await expect(service.validateOrRejectGoogleUser('a@b.com', 'Name', 'new-google-avatar')).resolves.toBe(user);

    expect(cloudinaryAvatarService.uploadGoogleAvatar).not.toHaveBeenCalled();
    expect(usersService.updateProfileIfChanged).toHaveBeenCalledWith(user, 'Name', user.avatar);
  });

  it('keeps previous avatar when Cloudinary upload fails', async () => {
    const user: User = {
      id: '1',
      email: 'a@b.com',
      role: 'user',
      name: 'Existing Name',
      avatar: 'https://legacy.example.com/avatar.png',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    usersService.findByEmail.mockResolvedValue(user);
    cloudinaryAvatarService.uploadGoogleAvatar.mockRejectedValue(new Error('Cloudinary timeout'));

    await expect(service.validateOrRejectGoogleUser('a@b.com', 'Name', 'new-google-avatar')).resolves.toBe(user);

    expect(cloudinaryAvatarService.uploadGoogleAvatar).toHaveBeenCalledWith('new-google-avatar', user.id);
    expect(usersService.updateProfileIfChanged).toHaveBeenCalledWith(user, 'Name', user.avatar);
  });

  it('generates jwt', () => {
    const user: User = {
      id: '1',
      email: 'a@b.com',
      role: 'user',
      name: '',
      avatar: '',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const token = service.generateJwt(user);
    expect(token).toBe('signed-token');
    expect(jwtService.sign).toHaveBeenCalled();
  });
});
