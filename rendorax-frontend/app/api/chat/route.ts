import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const CHAT_MODEL = "gemini-2.5-flash";

const languageMap: Record<string, string> = {
  bn: "Bengali (বাংলা)",
  en: "English",
  es: "Spanish (Español)",
  ar: "Arabic (العربية)",
  fr: "French (Français)",
  de: "German (Deutsch)",
  zh: "Mandarin Chinese (中文)",
  hi: "Hindi (हिन्दी)",
  ja: "Japanese (日本語)",
};

function buildSystemInstruction(selectedLanguage?: string): string {
  let systemInstruction =
    "You are Rendorax AI, the premium AI assistant for 'Rendorax', a broadcast post-production studio based in Dhaka, Bangladesh. " +
    "Your job is to assist clients and users with video reviews, timestamped comments, multiple video versions, private video hosting, and video production pipeline workflows. " +
    "Be professional, elegant, helpful, and concise. ";

  if (selectedLanguage) {
    const languageLabel = languageMap[selectedLanguage] ?? selectedLanguage;
    systemInstruction += `\n\nCRITICAL INSTRUCTION: You MUST strictly respond in ${languageLabel}. Do not use any other language.`;
  } else {
    systemInstruction +=
      "Automatically detect and reply in the same language the user used.";
  }

  return systemInstruction;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!genAI || !apiKey) {
      console.error("🔴 [API/CHAT] GEMINI_API_KEY is not configured.");
      return NextResponse.json(
        { error: "Failed to generate AI response" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { message, prompt, text, selectedLanguage, workspaceId } = body;
    const userMessage = message || prompt || text;

    if (!userMessage) {
      console.error("🔴 [API/CHAT] Message content is missing in the request");
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 },
      );
    }

    if (!workspaceId) {
      console.warn(
        "⚠️ [API/CHAT] workspaceId is missing; chat history persistence is skipped.",
      );
    }

    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction: buildSystemInstruction(selectedLanguage),
    });

    const result = await model.generateContent(userMessage);
    const responseText = result.response.text().trim();

    if (!responseText) {
      throw new Error("Gemini returned an empty response");
    }

    return NextResponse.json({ text: responseText });
  } catch (error: unknown) {
    console.error("🔴 [API/CHAT] Gemini request failed:", {
      model: CHAT_MODEL,
      error,
    });

    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 },
    );
  }
}
