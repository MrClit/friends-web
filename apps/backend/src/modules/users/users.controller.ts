import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';
import { UserDto } from './dto/user.dto';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all users (for participant selection)
   * @returns List of all users with basic info
   */
  @Get()
  @ApiOperation({ summary: 'Get all users for participant selection' })
  @ApiStandardResponse(200, 'Users retrieved successfully', UserDto, true)
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * Search users by name or email
   * @param query - Search query string
   * @returns Filtered list of users
   */
  @Get('search')
  @ApiOperation({ summary: 'Search users by name or email' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiStandardResponse(200, 'Users found', UserDto, true)
  search(@Query('q') query: string) {
    return this.usersService.search(query);
  }
}
