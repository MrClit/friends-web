import { ConfigService } from '@nestjs/config';
import { CloudinaryAvatarService } from './cloudinary-avatar.service';

type UploadMockResult = {
  public_id: string;
  version?: string | number;
};

const configMock = jest.fn((_: Record<string, unknown>) => undefined);
const uploadMock = jest.fn((_: string, __: Record<string, unknown>) =>
  Promise.resolve<UploadMockResult>({ public_id: '' }),
);
const urlMock = jest.fn((_: string, __: Record<string, unknown>) => '');

jest.mock('cloudinary', () => ({
  v2: {
    config: (options: Record<string, unknown>) => {
      configMock(options);
    },
    uploader: {
      upload: (source: string, options: Record<string, unknown>) => uploadMock(source, options),
    },
    url: (publicId: string, options: Record<string, unknown>) => urlMock(publicId, options),
  },
}));

describe('CloudinaryAvatarService', () => {
  beforeEach(() => {
    configMock.mockReset();
    uploadMock.mockReset();
    urlMock.mockReset();
  });

  it('returns true for Cloudinary URL from same cloud name', () => {
    const configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'CLOUDINARY_CLOUD_NAME') return 'friends-cloud';
        if (key === 'CLOUDINARY_API_KEY') return 'api-key';
        if (key === 'CLOUDINARY_API_SECRET') return 'api-secret';
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new CloudinaryAvatarService(configService);

    expect(
      service.isCloudinaryAvatarUrl(
        'https://res.cloudinary.com/friends-cloud/image/upload/v123/friends/avatars/user-1',
      ),
    ).toBe(true);
    expect(
      service.isCloudinaryAvatarUrl('https://res.cloudinary.com/other-cloud/image/upload/v123/friends/avatars/user-1'),
    ).toBe(false);
    expect(service.isCloudinaryAvatarUrl('https://example.com/avatar.png')).toBe(false);
    expect(service.isCloudinaryAvatarUrl('not-a-valid-url')).toBe(false);
  });

  it('throws when Cloudinary credentials are missing', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    const service = new CloudinaryAvatarService(configService);

    await expect(service.uploadGoogleAvatar('https://lh3.googleusercontent.com/avatar', 'user-1')).rejects.toThrow(
      'Cloudinary avatar integration is not configured',
    );
  });

  it('throws at startup in production when Cloudinary credentials are missing', () => {
    const configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        return undefined;
      }),
    } as unknown as ConfigService;

    expect(() => new CloudinaryAvatarService(configService)).toThrow(
      'Cloudinary avatar integration is disabled because CLOUDINARY_* variables are missing',
    );
  });

  it('uses dev folder by default when NODE_ENV is not production', async () => {
    const configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'CLOUDINARY_CLOUD_NAME') return 'friends-cloud';
        if (key === 'CLOUDINARY_API_KEY') return 'api-key';
        if (key === 'CLOUDINARY_API_SECRET') return 'api-secret';
        return undefined;
      }),
    } as unknown as ConfigService;

    uploadMock.mockResolvedValue({ public_id: 'friends/dev/avatars/user-123', version: 123 });
    urlMock.mockReturnValue(
      'https://res.cloudinary.com/friends-cloud/image/upload/c_fill,w_128,h_128,g_face,f_auto,q_auto,dpr_auto/friends/dev/avatars/user-123',
    );

    const service = new CloudinaryAvatarService(configService);
    const optimizedUrl = await service.uploadGoogleAvatar('https://lh3.googleusercontent.com/avatar', '123');

    expect(uploadMock).toHaveBeenCalledWith('https://lh3.googleusercontent.com/avatar', {
      folder: 'friends/dev/avatars',
      public_id: 'user-123',
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
    });
    expect(urlMock).toHaveBeenCalledWith('friends/dev/avatars/user-123', {
      secure: true,
      version: 123,
      transformation: [
        {
          width: 128,
          height: 128,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto',
          fetch_format: 'auto',
          dpr: 'auto',
        },
      ],
    });
    expect(optimizedUrl).toBe(
      'https://res.cloudinary.com/friends-cloud/image/upload/c_fill,w_128,h_128,g_face,f_auto,q_auto,dpr_auto/friends/dev/avatars/user-123',
    );
  });

  it('uses prod folder when NODE_ENV is production', async () => {
    const configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'CLOUDINARY_CLOUD_NAME') return 'friends-cloud';
        if (key === 'CLOUDINARY_API_KEY') return 'api-key';
        if (key === 'CLOUDINARY_API_SECRET') return 'api-secret';
        return undefined;
      }),
    } as unknown as ConfigService;

    uploadMock.mockResolvedValue({ public_id: 'friends/prod/avatars/user-456' });
    urlMock.mockReturnValue('https://res.cloudinary.com/friends-cloud/image/upload/friends/prod/avatars/user-456');

    const service = new CloudinaryAvatarService(configService);
    await service.uploadGoogleAvatar('https://lh3.googleusercontent.com/avatar', '456');

    expect(uploadMock).toHaveBeenCalledWith(
      'https://lh3.googleusercontent.com/avatar',
      expect.objectContaining({
        folder: 'friends/prod/avatars',
      }),
    );
  });

  it('uses custom folder from CLOUDINARY_AVATAR_FOLDER env var', async () => {
    const configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'CLOUDINARY_CLOUD_NAME') return 'friends-cloud';
        if (key === 'CLOUDINARY_API_KEY') return 'api-key';
        if (key === 'CLOUDINARY_API_SECRET') return 'api-secret';
        if (key === 'CLOUDINARY_AVATAR_FOLDER') return 'my-company/staging/avatars';
        return undefined;
      }),
    } as unknown as ConfigService;

    uploadMock.mockResolvedValue({ public_id: 'my-company/staging/avatars/user-789' });
    urlMock.mockReturnValue(
      'https://res.cloudinary.com/friends-cloud/image/upload/my-company/staging/avatars/user-789',
    );

    const service = new CloudinaryAvatarService(configService);
    await service.uploadGoogleAvatar('https://lh3.googleusercontent.com/avatar', '789');

    expect(uploadMock).toHaveBeenCalledWith(
      'https://lh3.googleusercontent.com/avatar',
      expect.objectContaining({
        folder: 'my-company/staging/avatars',
      }),
    );
  });
});
