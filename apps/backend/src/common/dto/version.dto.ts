import { ApiProperty } from '@nestjs/swagger';

export class VersionDto {
  @ApiProperty({ description: 'Product version, from the root package.json', example: '0.9.0' })
  version: string;

  @ApiProperty({
    description: "Deployed commit SHA, from the hosting platform; 'unknown' outside of it",
    example: '0f0e95a1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
  })
  commit: string;
}
