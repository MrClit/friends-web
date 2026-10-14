import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiStandardResponse } from './decorators/api-standard-response.decorator';
import { VersionDto } from './dto/version.dto';
import { getBuildInfo } from './build-info';

@ApiTags('Health Check')
@Controller('version')
export class VersionController {
  @Get()
  @ApiOperation({ summary: 'Deployed version and commit, to check which build is being served' })
  @ApiStandardResponse(200, 'Version of the running build', VersionDto)
  version(): VersionDto {
    return getBuildInfo();
  }
}
