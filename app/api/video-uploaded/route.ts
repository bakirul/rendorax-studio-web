import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  MediaConvertClient,
  CreateJobCommand,
  CreateJobCommandInput,
} from "@aws-sdk/client-mediaconvert";

export async function POST(req: NextRequest) {
  try {
    // 🚀 FIX: Moved clients INSIDE the function to prevent Vercel build crashes
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-token-for-build-pass",
    );

    const emcClient = new MediaConvertClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "dummy-key",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "dummy-secret",
      },
      endpoint:
        process.env.AWS_MEDIACONVERT_ENDPOINT || "https://dummy.amazonaws.com",
    });

    // 1. Authenticate the Webhook (Ensure it's actually from your Supabase project)
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse the Supabase Database Webhook Payload
    const payload = await req.json();

    // Check if the insert is for our specific bucket
    if (payload.record.bucket_id !== "client-vault") {
      return NextResponse.json(
        { message: "Ignored: Not client-vault bucket" },
        { status: 200 },
      );
    }

    const filePath = payload.record.name; // e.g., "userId/folder/162345_video.mov"
    const fileId = payload.record.id;

    console.log(`[Webhook] New video detected: ${filePath}`);

    // 3. Generate a secure, temporary Signed URL for AWS to download the raw file
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from("client-vault")
      .createSignedUrl(filePath, 60 * 60 * 2); // Valid for 2 hours

    if (signError || !signedData?.signedUrl) {
      throw new Error(`Failed to generate signed URL: ${signError?.message}`);
    }

    // 4. Create the AWS MediaConvert Job (HLS Proxy Generation)
    const s3OutputPath = `s3://${process.env.AWS_S3_PROXY_BUCKET}/proxies/${fileId}/`;

    const createJobParams: CreateJobCommandInput = {
      Role: process.env.AWS_MEDIACONVERT_ROLE_ARN!,
      Settings: {
        Inputs: [
          {
            FileInput: signedData.signedUrl, // AWS will ingest directly from Supabase
            AudioSelectors: {
              "Audio Selector 1": { DefaultSelection: "DEFAULT" },
            },
            TimecodeSource: "ZEROBASED", // Essential for frame-accurate playback
          },
        ],
        OutputGroups: [
          {
            Name: "Apple HLS",
            OutputGroupSettings: {
              Type: "HLS_GROUP_SETTINGS",
              HlsGroupSettings: {
                Destination: s3OutputPath,
                MinSegmentLength: 0,
                SegmentLength: 4, // 4-second segments for fast scrubbing in UI
              },
            },
            Outputs: [
              {
                VideoDescription: {
                  CodecSettings: {
                    Codec: "H_264",
                    H264Settings: {
                      MaxBitrate: 3000000, // 3Mbps Proxy
                      RateControlMode: "QVBR",
                      SceneChangeDetect: "TRANSITION_DETECTION",
                    },
                  },
                  Width: 1280,
                  Height: 720,
                },
                AudioDescriptions: [
                  {
                    AudioSourceName: "Audio Selector 1",
                    CodecSettings: {
                      Codec: "AAC",
                      AacSettings: { Bitrate: 128000, SampleRate: 48000 },
                    },
                  },
                ],
                ContainerSettings: { Container: "M3U8" },
              },
            ],
          },
        ],
      },
    };

    const command = new CreateJobCommand(createJobParams);
    const response = await emcClient.send(command);

    console.log(
      `[MediaConvert] Job triggered successfully. Job ID: ${response.Job?.Id}`,
    );

    return NextResponse.json({ success: true, jobId: response.Job?.Id });
  } catch (error: any) {
    console.error("[Webhook Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
