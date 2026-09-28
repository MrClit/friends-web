import { Test, TestingModule } from '@nestjs/testing';
import { AvatarService } from '../auth/services/avatar.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    getCurrentUserProfileByIdOrThrow: jest.Mock;
    updateCurrentUserProfile: jest.Mock;
  };
  let avatarService: { uploadUserAvatarBuffer: jest.Mock };

  beforeEach(async () => {
    usersService = {
      getCurrentUserProfileByIdOrThrow: jest.fn(),
      updateCurrentUserProfile: jest.fn(),
    };

    avatarService = {
      uploadUserAvatarBuffer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: AvatarService,
          useValue: avatarService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('getCurrentUserProfile delegates to usersService.getCurrentUserProfileByIdOrThrow', async () => {
    const profile = {
      id: 'u1',
      email: 'alice@example.com',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersService.getCurrentUserProfileByIdOrThrow.mockResolvedValue(profile);

    const result = await controller.getCurrentUserProfile({ id: 'u1', email: 'alice@example.com', role: 'user' });

    expect(result).toEqual(profile);
    expect(usersService.getCurrentUserProfileByIdOrThrow).toHaveBeenCalledWith('u1');
    expect(usersService.getCurrentUserProfileByIdOrThrow).toHaveBeenCalledTimes(1);
  });

  it('updateCurrentUserProfile updates name only when no avatar file is provided', async () => {
    const profile = {
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice',
      avatar: 'https://example.com/avatar.png',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersService.updateCurrentUserProfile.mockResolvedValue(profile);

    const result = await controller.updateCurrentUserProfile(
      { id: 'u1', email: 'alice@example.com', role: 'user' },
      { name: 'Alice' },
      undefined,
    );

    expect(result).toEqual(profile);
    expect(avatarService.uploadUserAvatarBuffer).not.toHaveBeenCalled();
    expect(usersService.updateCurrentUserProfile).toHaveBeenCalledWith('u1', {
      name: 'Alice',
      avatar: undefined,
    });
  });

  it('updateCurrentUserProfile uploads avatar and forwards resulting url', async () => {
    const profile = {
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice',
      avatar: 'https://res.cloudinary.com/demo/image/upload/avatar',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const avatarBuffer = Buffer.from('avatar-content');
    avatarService.uploadUserAvatarBuffer.mockResolvedValue(profile.avatar);
    usersService.updateCurrentUserProfile.mockResolvedValue(profile);

    const result = await controller.updateCurrentUserProfile(
      { id: 'u1', email: 'alice@example.com', role: 'user' },
      { name: 'Alice' },
      { buffer: avatarBuffer },
    );

    expect(result).toEqual(profile);
    expect(avatarService.uploadUserAvatarBuffer).toHaveBeenCalledWith(avatarBuffer, 'u1');
    expect(usersService.updateCurrentUserProfile).toHaveBeenCalledWith('u1', {
      name: 'Alice',
      avatar: profile.avatar,
    });
  });
});
