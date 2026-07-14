import { createHash } from "crypto";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { normalizeObjectKey, r2BucketName, r2Client } from "./r2";
import { isAllowedClientUploadObjectKey } from "./storagePolicy";

/**
 * Streams an original R2 object (uploads/ or projects/) and returns SHA-256 hex.
 * Never buffers the full file. Rejects proxy/HLS and thumbnail keys.
 */
export async function hashR2OriginalObject(
  objectKey: string,
): Promise<{ integrityHash: string; objectKey: string }> {
  if (!r2BucketName) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }

  const normalizedKey = normalizeObjectKey(objectKey);
  if (!normalizedKey || !isAllowedClientUploadObjectKey(normalizedKey)) {
    throw new Error(
      "objectKey must be an original upload key under uploads/ or projects/",
    );
  }

  if (normalizedKey.startsWith("thumbnails/")) {
    throw new Error("Cannot hash thumbnail objects for Picture Lock");
  }

  let response;
  try {
    response = await r2Client.send(
      new GetObjectCommand({
        Bucket: r2BucketName,
        Key: normalizedKey,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read R2 object for hashing: ${message}`);
  }

  const body = response.Body;
  if (!body) {
    throw new Error("R2 object body is empty or unavailable");
  }

  const hash = createHash("sha256");

  try {
    for await (const chunk of body as AsyncIterable<Uint8Array>) {
      hash.update(chunk);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed while streaming R2 object for hashing: ${message}`);
  }

  return {
    integrityHash: hash.digest("hex"),
    objectKey: normalizedKey,
  };
}
