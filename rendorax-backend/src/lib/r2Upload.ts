import fs from "fs/promises";
import path from "path";
import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { normalizeObjectKey, r2BucketName, r2Client } from "./r2";

const PROXY_MIME_BY_EXTENSION: Record<string, string> = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
  ".m4s": "video/iso.segment",
  ".mp4": "video/mp4",
  ".webp": "image/webp",
  ".json": "application/json",
};

function contentTypeForProxyFile(fileName: string): string {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return PROXY_MIME_BY_EXTENSION[ext] ?? "application/octet-stream";
}

function cacheControlForProxyFile(fileName: string): string | undefined {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  if (ext === ".m3u8") {
    return "public, max-age=120";
  }
  if (ext === ".ts" || ext === ".m4s" || ext === ".mp4") {
    return "public, max-age=31536000, immutable";
  }
  return undefined;
}

export async function uploadR2Buffer(
  objectKey: string,
  body: Buffer,
  contentType: string,
  cacheControl?: string,
): Promise<void> {
  if (!r2BucketName) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }

  const normalizedKey = normalizeObjectKey(objectKey);
  await r2Client.send(
    new PutObjectCommand({
      Bucket: r2BucketName,
      Key: normalizedKey,
      Body: body,
      ContentType: contentType,
      ...(cacheControl ? { CacheControl: cacheControl } : {}),
    }),
  );
}

export async function uploadR2File(
  objectKey: string,
  localPath: string,
  contentType?: string,
): Promise<void> {
  const fileName = path.basename(localPath);
  const resolvedContentType = contentType ?? contentTypeForProxyFile(fileName);
  const cacheControl = cacheControlForProxyFile(fileName);
  const body = await fs.readFile(localPath);
  await uploadR2Buffer(objectKey, body, resolvedContentType, cacheControl);
}

async function walkFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function uploadLocalDirectoryToR2(
  localDir: string,
  r2Prefix: string,
): Promise<number> {
  const normalizedPrefix = normalizeObjectKey(r2Prefix).replace(/\/?$/, "/");
  const files = await walkFiles(localDir);
  let uploaded = 0;

  for (const localPath of files) {
    const relativePath = path.relative(localDir, localPath).split(path.sep).join("/");
    const objectKey = `${normalizedPrefix}${relativePath}`;
    const fileName = path.basename(localPath);
    await uploadR2File(objectKey, localPath, contentTypeForProxyFile(fileName));
    uploaded += 1;
  }

  return uploaded;
}

export async function deleteR2Prefix(prefix: string): Promise<void> {
  if (!r2BucketName) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }

  const normalizedPrefix = normalizeObjectKey(prefix).replace(/\/?$/, "/");
  let continuationToken: string | undefined;

  do {
    const response = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: r2BucketName,
        Prefix: normalizedPrefix,
        ContinuationToken: continuationToken,
      }),
    );

    const keys = (response.Contents ?? [])
      .map((item) => item.Key)
      .filter((key): key is string => Boolean(key));

    await Promise.all(
      keys.map((key) =>
        r2Client.send(
          new DeleteObjectCommand({
            Bucket: r2BucketName,
            Key: key,
          }),
        ),
      ),
    );

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);
}
