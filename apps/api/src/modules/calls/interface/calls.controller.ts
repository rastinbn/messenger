import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("calls")
@ApiBearerAuth()
@Controller({ path: "calls", version: "1" })
export class CallsController {
  constructor(private readonly config: ConfigService) {}

  @Get("ice-servers")
  @ApiOperation({ summary: "Get the ICE server list (STUN/TURN) the client should use for RTCPeerConnection" })
  getIceServers(): { iceServers: RTCIceServer[] } {
    const urls = this.config
      .get<string>("STUN_URLS", "stun:stun.l.google.com:19302")
      .split(",")
      .map((u) => u.trim());
    return { iceServers: [{ urls }] };
  }
}

interface RTCIceServer {
  urls: string | string[];
}
