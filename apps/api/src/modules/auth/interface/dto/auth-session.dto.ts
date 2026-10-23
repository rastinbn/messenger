import { ApiProperty } from '@nestjs/swagger';

import { UserDto } from '../../../users/interface/dto/public-user.dto';

export class AuthSessionDto {
  @ApiProperty({ type: UserDto }) user!: UserDto;
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
  @ApiProperty() expiresAt!: string;
}
