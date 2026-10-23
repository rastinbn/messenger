import { Module } from '@nestjs/common';

import { PresenceService } from './application/presence.service';

@Module({
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
