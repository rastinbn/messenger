import type { Attachment } from "@messenger/shared-types";

import { API_BASE_URL, apiFetch } from "./http-client";

/**
 * Uploads a file to POST /v1/media/upload and returns the resulting
 * Attachment record. Reference its `id` in `attachmentIds` when sending a
 * message (see useSendMessage / MessageComposer).
 */
export async function uploadFile(file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<Attachment>("/v1/media/upload", {
    method: "POST",
    body: formData,
    isFormData: true
  });
}

/**
 * Resolves a stored attachment URL ("/uploads/xyz.png") into a fully
 * qualified one pointing at the API server. Uses the SAME base URL constant
 * as every other API call (API_BASE_URL, which falls back to
 * http://localhost:4000) — this used to read `process.env.NEXT_PUBLIC_API_URL`
 * directly with no fallback, which meant if that env var wasn't picked up
 * for any reason, every other request still silently worked (via
 * API_BASE_URL's fallback) while images alone broke, resolving to the
 * frontend's own origin instead of the API's.
 */
export function resolveMediaUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
}
