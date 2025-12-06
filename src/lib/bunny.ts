
interface BunnyUploadOptions {
  path: string;
  buffer: Buffer;
  contentType?: string;
}

interface BunnyDeleteOptions {
  path: string;
}

const BUNNY_STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME;
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_CDN_BASE_URL = process.env.BUNNY_CDN_BASE_URL;

if (!BUNNY_STORAGE_ZONE_NAME || !BUNNY_STORAGE_API_KEY) {
  console.warn("BunnyCDN credentials not configured. Media uploads will fail.");
}

/**
 * Upload a file to BunnyCDN Storage
 */
export async function uploadMedia({
  path,
  buffer,
  contentType = "application/octet-stream",
}: BunnyUploadOptions): Promise<string> {
  if (!BUNNY_STORAGE_ZONE_NAME || !BUNNY_STORAGE_API_KEY) {
    throw new Error("BunnyCDN credentials not configured");
  }

  const url = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE_NAME}/${path}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: BUNNY_STORAGE_API_KEY,
      "Content-Type": contentType,
    },
    body: buffer as any,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`BunnyCDN upload failed: ${response.status} ${errorText}`);
  }

  // Return the full CDN URL if configured, otherwise return the storage path
  if (BUNNY_CDN_BASE_URL) {
    return `${BUNNY_CDN_BASE_URL}/${path}`;
  }

  return `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE_NAME}/${path}`;
}

/**
 * Delete a file from BunnyCDN Storage
 */
export async function deleteMedia({ path }: BunnyDeleteOptions): Promise<void> {
  if (!BUNNY_STORAGE_ZONE_NAME || !BUNNY_STORAGE_API_KEY) {
    throw new Error("BunnyCDN credentials not configured");
  }

  const url = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE_NAME}/${path}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      AccessKey: BUNNY_STORAGE_API_KEY,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`BunnyCDN delete failed: ${response.status} ${errorText}`);
  }
}

/**
 * Generate a unique file path for uploads
 */
export function generateMediaPath(
  organizationId: string,
  filename: string,
  prefix: string = "media"
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = filename.split(".").pop() || "bin";
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .toLowerCase();

  return `${prefix}/${organizationId}/${timestamp}-${randomString}.${extension}`;
}

/**
 * Get file size from buffer
 */
export function getFileSize(buffer: Buffer): number {
  return buffer.length;
}

/**
 * Detect MIME type from filename
 */
export function detectMimeType(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    // Videos
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  return mimeTypes[extension || ""] || "application/octet-stream";
}

