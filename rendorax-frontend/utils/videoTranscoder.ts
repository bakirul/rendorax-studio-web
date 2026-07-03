// utils/videoTranscoder.ts
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

export interface TranscodeOptions {
  inputPath: string;
  fileId: string;
  onProgress?: (percent: number) => void;
}

export class VideoTranscoder {
  /**
   * Transcodes an MP4 file into a multi-bitrate HLS stream (1080p, 720p, 480p)
   */
  public static async generateHLS({ inputPath, fileId, onProgress }: TranscodeOptions): Promise<string> {
    return new Promise(async (resolve, reject) => {
      // Define output directory in the public folder
      const outputDir = path.join(process.cwd(), "public", "uploads", "hls", fileId);

      try {
        if (!existsSync(outputDir)) {
          await fs.mkdir(outputDir, { recursive: true });
        }

        console.log(`[FFmpeg] Starting ABR HLS Transcoding for: ${fileId}`);

        ffmpeg(inputPath)
          .outputOptions([
            // Complex filter to split the video into 3 scaled streams
            '-filter_complex', 
            '[0:v]split=3[v1][v2][v3];[v1]scale=w=1920:h=1080[v1out];[v2]scale=w=1280:h=720[v2out];[v3]scale=w=854:h=480[v3out]',

            // 1080p Configuration
            '-map', '[v1out]', '-c:v:0', 'libx264', '-b:v:0', '5000k', '-maxrate:v:0', '5300k', '-bufsize:v:0', '7500k',
            
            // 720p Configuration
            '-map', '[v2out]', '-c:v:1', 'libx264', '-b:v:1', '2800k', '-maxrate:v:1', '3000k', '-bufsize:v:1', '4200k',
            
            // 480p Configuration
            '-map', '[v3out]', '-c:v:2', 'libx264', '-b:v:2', '1400k', '-maxrate:v:2', '1500k', '-bufsize:v:2', '2100k',

            // Audio mapping for all 3 variants
            '-map', 'a:0', '-c:a:0', 'aac', '-b:a:0', '128k',
            '-map', 'a:0', '-c:a:1', 'aac', '-b:a:1', '128k',
            '-map', 'a:0', '-c:a:2', 'aac', '-b:a:2', '96k',

            // HLS Specific Flags
            '-f', 'hls',
            '-hls_time', '4', // 4-second segments for fast seeking
            '-hls_playlist_type', 'vod',
            '-hls_flags', 'independent_segments',
            '-hls_segment_type', 'mpegts',
            '-hls_segment_filename', path.join(outputDir, 'stream_%v_data%02d.ts'),
            '-master_pl_name', 'master.m3u8',
            
            // Group the video and audio streams together
            '-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2'
          ])
          .output(path.join(outputDir, 'stream_%v.m3u8'))
          .on('progress', (progress) => {
            if (progress.percent && onProgress) {
              // Note: progress.percent can be slightly inaccurate in complex filters, 
              // but good enough for UI feedback.
              const currentPercent = Math.round(progress.percent);
              onProgress(currentPercent);
            }
          })
          .on('end', () => {
            const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
            console.log(`[FFmpeg] Successfully generated HLS Master Playlist: ${masterPlaylistPath}`);
            resolve(masterPlaylistPath);
          })
          .on('error', (err, stdout, stderr) => {
            console.error('[FFmpeg] Error during transcoding:', err.message);
            console.error('[FFmpeg] stderr:', stderr);
            reject(new Error(`Transcoding failed: ${err.message}`));
          })
          .run();

      } catch (error) {
        reject(error);
      }
    });
  }
}