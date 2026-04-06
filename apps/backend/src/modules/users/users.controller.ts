import {
  Body,
  Controller,
  Get,
  ParseFilePipeBuilder,
  Patch,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { AvatarService } from '../auth/services/avatar.service';
import { RolesGuard } from '../auth/roles/roles.guard';
import { CurrentUserProfileDto } from './dto/current-user-profile.dto';
import { UpdateCurrentUserProfileDto } from './dto/update-current-user-profile.dto';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';

const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const AVATAR_MIME_TYPE_REGEX = /^image\/(jpeg|jpg|png|webp|gif|heic|heif)$/;

interface UploadedAvatarFile {
  buffer: Buffer;
}

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly avatarService: AvatarService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users for participant selection' })
  @ApiStandardResponse(200, 'Users retrieved successfully', UserDto, true)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by name or email' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiStandardResponse(200, 'Users found', UserDto, true)
  search(@Query('q') query: string) {
    return this.usersService.search(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiStandardResponse(200, 'Current user profile retrieved successfully', CurrentUserProfileDto)
  getCurrentUserProfile(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.getCurrentUserProfileByIdOrThrow(currentUser.id);
  }

  @Patch('me')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', maxLength: 255 },
        avatar: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Update current authenticated user profile' })
  @ApiStandardResponse(200, 'Current user profile updated successfully', CurrentUserProfileDto)
  async updateCurrentUserProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() updateCurrentUserProfileDto: UpdateCurrentUserProfileDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: AVATAR_MIME_TYPE_REGEX })
        .addMaxSizeValidator({ maxSize: AVATAR_MAX_SIZE_BYTES })
        .build({ fileIsRequired: false }),
    )
    avatarFile?: UploadedAvatarFile,
  ) {
    let uploadedAvatarUrl: string | undefined;

    if (avatarFile) {
      uploadedAvatarUrl = await this.avatarService.uploadUserAvatarBuffer(avatarFile.buffer, currentUser.id);
    }

    return this.usersService.updateCurrentUserProfile(currentUser.id, {
      name: updateCurrentUserProfileDto.name,
      avatar: uploadedAvatarUrl,
    });
  }
}
