import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { toPublicUser } from '../domain/user.entity';
import { UsersService } from '../application/users.service';

import { PublicUserDto, UserDto } from './dto/public-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: "Get the current authenticated user's full profile",
  })
  @ApiOkResponse({ type: UserDto })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserDto> {
    const entity = await this.usersService.getById(user.id);
    const { passwordHash: _passwordHash, ...rest } = entity;
    return rest;
  }

  @Patch('me')
  @ApiOperation({ summary: "Update the current user's profile" })
  @ApiOkResponse({ type: UserDto })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserDto> {
    const entity = await this.usersService.updateProfile(user.id, dto);
    const { passwordHash: _passwordHash, ...rest } = entity;
    return rest;
  }

  @Patch('me/status')
  @ApiOperation({ summary: "Update the current user's presence status" })
  @ApiOkResponse({ type: UserDto })
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStatusDto,
  ): Promise<UserDto> {
    const entity = await this.usersService.updateStatus(user.id, dto.status);
    const { passwordHash: _passwordHash, ...rest } = entity;
    return rest;
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by display name or username' })
  @ApiOkResponse({ type: [PublicUserDto] })
  async search(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') query = '',
  ): Promise<PublicUserDto[]> {
    return this.usersService.search(query, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: "Get another user's public profile" })
  @ApiOkResponse({ type: PublicUserDto })
  async getById(@Param('id') id: string): Promise<PublicUserDto | null> {
    const entity = await this.usersService.getById(id).catch(() => null);
    return entity ? toPublicUser(entity) : null;
  }
}
