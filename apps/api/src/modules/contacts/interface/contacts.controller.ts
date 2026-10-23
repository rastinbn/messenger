import { Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { PublicUserDto } from "../../users/interface/dto/public-user.dto";
import { ContactsService } from "../application/contacts.service";

@ApiTags("contacts")
@ApiBearerAuth()
@Controller({ path: "contacts", version: "1" })
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: "List the current user's contacts" })
  @ApiOkResponse({ type: [PublicUserDto] })
  async list(@CurrentUser() user: AuthenticatedUser): Promise<PublicUserDto[]> {
    return this.contactsService.listForUser(user.id);
  }

  @Post(":userId")
  @ApiOperation({ summary: "Add a user as a contact" })
  async add(
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId") userId: string
  ): Promise<{ success: true }> {
    await this.contactsService.add(user.id, userId);
    return { success: true };
  }

  @Delete(":userId")
  @ApiOperation({ summary: "Remove a contact" })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId") userId: string
  ): Promise<{ success: true }> {
    await this.contactsService.remove(user.id, userId);
    return { success: true };
  }
}
