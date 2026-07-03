import { getBackendAuthHeaders } from "@/utils/backendAuth";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

/** R2 single PUT limit — larger files use multipart upload. */
export const SINGLE_PUT_MAX_BYTES = 5 * 1024 * 1024 * 1024;

/** S3/R2 multipart constraints */
const MIN_PART_SIZE = 5 * 1024 * 1024;
const MAX_PART_COUNT = 10_000;
const MAX_CONCURRENT_UPLOADS = 4;
const PRESIGN_BATCH_SIZE = 50;

export interface PresignedUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  objectKey: string;
}

export interface R2UploadResult {
  publicUrl: string;
  objectKey: string;
}

export interface MultipartInitResponse {
  uploadId: string;
  objectKey: string;
  publicUrl: string;
}

export interface PresignedPartResponse {
  partNumber: number;
  uploadUrl: string;
}

export interface CompletedUploadPart {
  ETag: string;
  PartNumber: number;
}

interface UploadPartPlan {
  partNumber: number;
  blob: Blob;
  size: number;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return (body as { error?: string }).error || `${fallback} (${res.status})`;
}

export async function requestPresignedUpload(
  fileName: string,
  contentType: string,
): Promise<PresignedUploadResponse> {
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/storage/r2/presign-upload`, {
    method: "POST",
    headers,
    body: JSON.stringify({ fileName, contentType }),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to get presigned URL"));
  }

  return res.json();
}

export async function requestPresignedUploadForKey(
  objectKey: string,
  contentType: string,
): Promise<PresignedUploadResponse> {
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/storage/r2/presign-upload`, {
    method: "POST",
    headers,
    body: JSON.stringify({ objectKey, contentType }),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to get presigned URL"));
  }

  return res.json();
}

export async function initMultipartUpload(
  fileName: string,
  contentType: string,
): Promise<MultipartInitResponse> {
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/storage/r2/multipart/init`, {
    method: "POST",
    headers,
    body: JSON.stringify({ fileName, contentType }),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to initiate multipart upload"));
  }

  return res.json();
}

export async function requestPresignedParts(
  uploadId: string,
  objectKey: string,
  partNumbers: number[],
): Promise<PresignedPartResponse[]> {
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/storage/r2/multipart/presign-parts`, {
    method: "POST",
    headers,
    body: JSON.stringify({ uploadId, objectKey, partNumbers }),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to presign upload parts"));
  }

  const data = (await res.json()) as { parts: PresignedPartResponse[] };
  return data.parts;
}

export async function completeMultipartUpload(
  uploadId: string,
  objectKey: string,
  parts: CompletedUploadPart[],
): Promise<{ publicUrl: string; objectKey: string }> {
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/storage/r2/multipart/complete`, {
    method: "POST",
    headers,
    body: JSON.stringify({ uploadId, objectKey, parts }),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to complete multipart upload"));
  }

  return res.json();
}

export function getMultipartChunkSize(fileSize: number): number {
  let chunkSize = 10 * 1024 * 1024;

  if (fileSize > 500 * 1024 * 1024) {
    chunkSize = 20 * 1024 * 1024;
  }
  if (fileSize > 5 * 1024 * 1024 * 1024) {
    chunkSize = 100 * 1024 * 1024;
  }
  if (fileSize > 500 * 1024 * 1024 * 1024) {
    chunkSize = 500 * 1024 * 1024;
  }

  const minChunkForPartLimit = Math.ceil(fileSize / MAX_PART_COUNT);
  chunkSize = Math.max(chunkSize, minChunkForPartLimit, MIN_PART_SIZE);

  return chunkSize;
}

export function buildUploadParts(file: File, chunkSize: number): UploadPartPlan[] {
  const parts: UploadPartPlan[] = [];
  let offset = 0;
  let partNumber = 1;

  while (offset < file.size) {
    const end = Math.min(offset + chunkSize, file.size);
    const blob = file.slice(offset, end);
    parts.push({
      partNumber,
      blob,
      size: blob.size,
    });
    offset = end;
    partNumber += 1;
  }

  return parts;
}

export function uploadFileWithProgress(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));

    xhr.send(file);
  });
}

function uploadPartWithProgress(
  uploadUrl: string,
  blob: Blob,
  onLoaded: (loaded: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);

    xhr.upload.onprogress = (event) => {
      onLoaded(event.lengthComputable ? event.loaded : 0);
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Chunk upload failed (${xhr.status})`));
        return;
      }

      const etag = xhr.getResponseHeader("ETag");
      if (!etag) {
        reject(new Error("Chunk upload succeeded but ETag header was missing"));
        return;
      }

      resolve(etag);
    };

    xhr.onerror = () => reject(new Error("Network error during chunk upload"));
    xhr.onabort = () => reject(new Error("Chunk upload cancelled"));

    xhr.send(blob);
  });
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      await worker(items[currentIndex]);
    }
  });

  await Promise.all(runners);
}

function createMultipartProgressReporter(
  totalBytes: number,
  onProgress: (percent: number) => void,
) {
  const loadedByPart = new Map<number, number>();

  return (partNumber: number, loaded: number, partSize: number, isComplete = false) => {
    loadedByPart.set(partNumber, isComplete ? partSize : loaded);

    let uploadedBytes = 0;
    for (const bytes of loadedByPart.values()) {
      uploadedBytes += bytes;
    }

    const percent = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;
    onProgress(Math.min(percent, 99));
  };
}

async function uploadMultipartMediaToR2(
  file: File,
  onProgress: (percent: number) => void,
): Promise<R2UploadResult> {
  const contentType = file.type || "application/octet-stream";
  const { uploadId, objectKey, publicUrl } = await initMultipartUpload(
    file.name,
    contentType,
  );

  const chunkSize = getMultipartChunkSize(file.size);
  const parts = buildUploadParts(file, chunkSize);
  const reportProgress = createMultipartProgressReporter(file.size, onProgress);
  const completedParts: CompletedUploadPart[] = [];

  for (let batchStart = 0; batchStart < parts.length; batchStart += PRESIGN_BATCH_SIZE) {
    const batch = parts.slice(batchStart, batchStart + PRESIGN_BATCH_SIZE);
    const presignedParts = await requestPresignedParts(
      uploadId,
      objectKey,
      batch.map((part) => part.partNumber),
    );
    const urlByPart = new Map(
      presignedParts.map((part) => [part.partNumber, part.uploadUrl]),
    );

    await runWithConcurrency(batch, MAX_CONCURRENT_UPLOADS, async (part) => {
      const uploadUrl = urlByPart.get(part.partNumber);
      if (!uploadUrl) {
        throw new Error(`Missing presigned URL for part ${part.partNumber}`);
      }

      const etag = await uploadPartWithProgress(uploadUrl, part.blob, (loaded) => {
        reportProgress(part.partNumber, loaded, part.size);
      });

      reportProgress(part.partNumber, part.size, part.size, true);
      completedParts.push({ ETag: etag, PartNumber: part.partNumber });
    });
  }

  const result = await completeMultipartUpload(uploadId, objectKey, completedParts);
  onProgress(100);

  return {
    publicUrl: result.publicUrl || publicUrl,
    objectKey: result.objectKey || objectKey,
  };
}

export async function uploadMediaToR2(
  file: File,
  onProgress: (percent: number) => void,
): Promise<R2UploadResult> {
  if (file.size > SINGLE_PUT_MAX_BYTES) {
    return uploadMultipartMediaToR2(file, onProgress);
  }

  const contentType = file.type || "application/octet-stream";
  const { uploadUrl, publicUrl, objectKey } = await requestPresignedUpload(
    file.name,
    contentType,
  );

  await uploadFileWithProgress(uploadUrl, file, onProgress);

  return { publicUrl, objectKey };
}
