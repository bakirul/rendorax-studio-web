// utils/chunkUploader.ts
import * as tus from "tus-js-client";

export interface UploadProgressCallback {
  (progress: number, bytesUploaded: number, bytesTotal: number): void;
}

export interface UploadConfig {
  file: File;
  bucketName: string;
  filePath: string; // The destination path inside the bucket (e.g., 'userId/folder/fileName.mp4')
  supabaseUrl: string; // From process.env.NEXT_PUBLIC_SUPABASE_URL
  supabaseAnonKey: string; // From process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  userAccessToken: string; // The active user session JWT token
  onProgress: UploadProgressCallback;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

export class ChunkUploader {
  private upload: tus.Upload | null = null;
  private config: UploadConfig;

  constructor(config: UploadConfig) {
    this.config = config;
  }

  /**
   * Starts or resumes the TUS resumable upload process to Supabase Storage.
   */
  public startUpload(): void {
    const {
      file,
      bucketName,
      filePath,
      supabaseUrl,
      supabaseAnonKey,
      userAccessToken,
      onProgress,
      onSuccess,
      onError,
    } = this.config;

    if (!file) {
      onError(new Error("No file provided for upload."));
      return;
    }

    // Construct the Supabase TUS endpoint
    // Format: https://<project-id>.supabase.co/storage/v1/upload/resumable
    const uploadEndpoint = `${supabaseUrl}/storage/v1/upload/resumable`;

    this.upload = new tus.Upload(file, {
      endpoint: uploadEndpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000], // Exponential backoff for retries
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        apikey: supabaseAnonKey,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true, // Clean up local storage after success
      metadata: {
        bucketName: bucketName,
        objectName: filePath, // The target path inside the bucket
        contentType: file.type,
      },
      chunkSize: 6 * 1024 * 1024, // 6MB chunks (Supabase recommends 6MB minimum for TUS)
      onError: function (error) {
        console.error("TUS Upload Error:", error);
        onError(error);
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
        onProgress(percentage, bytesUploaded, bytesTotal);
      },
      onSuccess: function () {
        console.log(`[TUS Upload] Success: ${filePath}`);
        onSuccess();
      },
    });

    // Check if there are any previous uncompleted uploads for this file to resume
    this.upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length > 0) {
        console.log("Resuming previous upload...");
        this.upload?.resumeFromPreviousUpload(previousUploads[0]);
      } else {
        console.log("Starting new upload...");
        this.upload?.start();
      }
    });
  }

  /**
   * Pauses the current upload if it's running.
   */
  public pauseUpload(): void {
    if (this.upload) {
      this.upload.abort();
      console.log("Upload paused.");
    }
  }

  /**
   * Resumes the paused upload.
   */
  public resumeUpload(): void {
    if (this.upload) {
      this.upload.start();
      console.log("Upload resumed.");
    }
  }
}
