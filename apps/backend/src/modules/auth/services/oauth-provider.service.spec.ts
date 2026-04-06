import { UnauthorizedException } from '@nestjs/common';
import { OAuthProviderService } from './oauth-provider.service';
import { UsersService } from '../../users/users.service';
import { AvatarService } from './avatar.service';
import { User } from '../../users/user.entity';

describe('OAuthProviderService', () => {
  let service: OAuthProviderService;
  let usersService: { findByEmail: jest.Mock; updateProfileIfChanged: jest.Mock };
  let avatarService: { isCloudinaryAvatarUrl: jest.Mock; uploadProviderAvatar: jest.Mock };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      updateProfileIfChanged: jest.fn(),
    };

    avatarService = {
      isCloudinaryAvatarUrl: jest.fn().mockReturnValue(false),
      uploadProviderAvatar: jest.fn(),
    };

    service = new OAuthProviderService(
      usersService as unknown as UsersService,
      avatarService as unknown as AvatarService,
    );
  });

  it('rejects unknown email', async () => {
    usersService.findByEmail.mockResolvedValue(undefined);

    await expect(service.validateOrRejectOAuthUser('no@exist.com', 'Google')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
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
    avatarService.uploadProviderAvatar.mockResolvedValue(cloudinaryAvatarUrl);

    await expect(service.validateOrRejectOAuthUser('a@b.com', 'Google', '  Name  ', 'avatar')).resolves.toBe(user);

    expect(avatarService.isCloudinaryAvatarUrl).toHaveBeenCalledWith(user.avatar);
    expect(avatarService.uploadProviderAvatar).toHaveBeenCalledWith('avatar', user.id);
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
    avatarService.isCloudinaryAvatarUrl.mockReturnValue(true);

    await expect(service.validateOrRejectOAuthUser('a@b.com', 'Google', 'Name', 'new-google-avatar')).resolves.toBe(
      user,
    );

    expect(avatarService.uploadProviderAvatar).not.toHaveBeenCalled();
    expect(usersService.updateProfileIfChanged).toHaveBeenCalledWith(user, undefined, user.avatar);
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
    avatarService.uploadProviderAvatar.mockRejectedValue(new Error('Cloudinary timeout'));

    await expect(service.validateOrRejectOAuthUser('a@b.com', 'Google', 'Name', 'new-google-avatar')).resolves.toBe(
      user,
    );

    expect(avatarService.uploadProviderAvatar).toHaveBeenCalledWith('new-google-avatar', user.id);
    expect(usersService.updateProfileIfChanged).toHaveBeenCalledWith(user, undefined, user.avatar);
  });

  it('keeps existing name even when provider sends a different display name', async () => {
    const user: User = {
      id: '1',
      email: 'a@b.com',
      role: 'user',
      name: 'Custom Name',
      avatar: 'https://legacy.example.com/avatar.png',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    usersService.findByEmail.mockResolvedValue(user);
    avatarService.uploadProviderAvatar.mockResolvedValue('https://res.cloudinary.com/demo/image/upload/avatar');

    await expect(
      service.validateOrRejectOAuthUser('a@b.com', 'Google', 'Provider Name', 'new-provider-avatar'),
    ).resolves.toBe(user);

    expect(usersService.updateProfileIfChanged).toHaveBeenCalledWith(
      user,
      undefined,
      'https://res.cloudinary.com/demo/image/upload/avatar',
    );
  });
});
