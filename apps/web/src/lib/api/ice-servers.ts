import { apiFetch } from "./http-client";

export interface IceServersResponse {
  iceServers: RTCIceServer[];
}

let cached: RTCIceServer[] | null = null;

export async function getIceServers(): Promise<RTCIceServer[]> {
  if (cached) return cached;
  const res = await apiFetch<IceServersResponse>("/v1/calls/ice-servers");
  cached = res.iceServers;
  return cached;
}
