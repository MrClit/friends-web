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

  async uploadProviderAvatar(providerAvatarUrl: string, userId: string): Promise<string> {
    if (!this.isConfigured || !this.cloudName) {
      throw new Error('Cloudinary avatar integration is not configured');
    }

    const normalizedAvatarUrl = providerAvatarUrl.trim();
    if (!normalizedAvatarUrl) {
      throw new Error('Provider avatar URL is empty');
    }

    const uploadOptions: UploadApiOptions = {
      folder: this.avatarFolder,
      public_id: this.getAvatarPublicId(userId),
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
    };

    const uploadResult: UploadApiResponse = await cloudinary.uploader.upload(normalizedAvatarUrl, uploadOptions);
    return this.buildOptimizedAvatarUrl(uploadResult.public_id, uploadResult.version);
  }

  async uploadUserAvatarBuffer(fileBuffer: Buffer, userId: string): Promise<string> {
    if (!this.isConfigured || !this.cloudName) {
      throw new Error('Cloudinary avatar integration is not configured');
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('Avatar file is empty');
    }

    const uploadOptions: UploadApiOptions = {
      folder: this.avatarFolder,
      public_id: this.getAvatarPublicId(userId),
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
    };

    const uploadResult = await this.uploadBuffer(fileBuffer, uploadOptions);
    return this.buildOptimizedAvatarUrl(uploadResult.public_id, uploadResult.version);
  }

  private uploadBuffer(fileBuffer: Buffer, uploadOptions: UploadApiOptions): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          reject(new Error(this.getErrorMessage(error)));
          return;
        }

        if (!result) {
          reject(new Error('Cloudinary upload did not return a result'));
          return;
        }

        resolve(result);
      });

      uploadStream.end(fileBuffer);
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    if (typeof error === 'object' && error !== null) {
      const errorWithMessage = error as { message?: unknown };
      if (typeof errorWithMessage.message === 'string' && errorWithMessage.message.trim()) {
        return errorWithMessage.message;
      }
    }

    return 'Cloudinary upload failed';
  }

  private getAvatarPublicId(userId: string): string {
    return `user-${userId}`;
  }

  private buildOptimizedAvatarUrl(publicId: string, version?: string | number): string {
    const urlOptions: {
      secure: true;
      transformation: Array<{
        width: number;
        height: number;
        crop: 'fill';
        gravity: 'face';
        quality: 'auto';
        fetch_format: 'auto';
        dpr: 'auto';
      }>;
      version?: string | number;
    } = {
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
    };

    if (typeof version === 'number' || typeof version === 'string') {
      urlOptions.version = version;
    }

    return cloudinary.url(publicId, urlOptions);
  }
}
