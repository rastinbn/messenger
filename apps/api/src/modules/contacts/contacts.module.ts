import { Module } from "@nestjs/common";

import { ContactsService } from "./application/contacts.service";
import { CONTACTS_REPOSITORY } from "./application/ports/contacts-repository.port";
import { PrismaContactsRepository } from "./infrastructure/prisma-contacts.repository";
import { ContactsController } from "./interface/contacts.controller";

@Module({
  controllers: [ContactsController],
  providers: [
    ContactsService,
    { provide: CONTACTS_REPOSITORY, useClass: PrismaContactsRepository }
  ],
  exports: [ContactsService]
})
export class ContactsModule {}
