import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from 'cloudinary';

const AVATAR_SIZE = 128;

@Injectable()
export class CloudinaryAvatarService {
  private readonly logger = new Logger(CloudinaryAvatarService.name);
  private readonly cloudName?: string;
  private readonly avatarFolder: string;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const nodeEnv = this.configService.get<string>('NODE_ENV')?.trim() || 'development';
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME')?.trim();
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET')?.trim();
    const envSegment = nodeEnv === 'production' ? 'prod' : 'dev';
    this.avatarFolder =
      this.configService.get<string>('CLOUDINARY_AVATAR_FOLDER')?.trim() || `friends/${envSegment}/avatars`;

    this.cloudName = cloudName;
    this.isConfigured = Boolean(cloudName && apiKey && apiSecret);

    if (!this.isConfigured) {
      const message = 'Cloudinary avatar integration is disabled because CLOUDINARY_* variables are missing';
      if (nodeEnv === 'production') {
        throw new Error(message);
      }
      this.logger.warn(message);
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  isCloudinaryAvatarUrl(url?: string | null): boolean {
    if (!url || !this.cloudName) {
      return false;
    }

    try {
      const parsed = new URL(url);
      if (parsed.hostname !== 'res.cloudinary.com') {
        return false;
      }

      return parsed.pathname.startsWith(`/${this.cloudName}/`);
    } catch {
      return false;
    }
  }

  async uploadGoogleAvatar(googleAvatarUrl: string, userId: string): Promise<string> {
    if (!this.isConfigured || !this.cloudName) {
      throw new Error('Cloudinary avatar integration is not configured');
    }

    const normalizedAvatarUrl = googleAvatarUrl.trim();
    if (!normalizedAvatarUrl) {
      throw new Error('Google avatar URL is empty');
    }

    const uploadOptions: UploadApiOptions = {
      folder: this.avatarFolder,
      public_id: this.getAvatarPublicId(userId),
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
    };

    const uploadResult: UploadApiResponse = await cloudinary.uploader.upload(normalizedAvatarUrl, uploadOptions);
    return this.buildOptimizedAvatarUrl(uploadResult.public_id);
  }

  private getAvatarPublicId(userId: string): string {
    return `user-${userId}`;
  }

  private buildOptimizedAvatarUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      secure: true,
      transformation: [
        {
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto',
          fetch_format: 'auto',
          dpr: 'auto',
        },
      ],
    });
  }
}
