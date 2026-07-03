import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const TRANSLATE_MODEL = "gemini-2.5-flash";
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

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
      console.error("🔴 [API/TRANSLATE] GEMINI_API_KEY is not configured.");
      return NextResponse.json(
        { error: "Failed to generate AI response" },
        { status: 500 },
      );
    }

    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "Text and targetLanguage are required" },
        { status: 400 },
      );
    }

    const systemInstruction = `You are a strict, highly accurate translation engine. Translate the following text into ${targetLanguage}. ONLY output the translated text. Do NOT add any conversational filler, notes, or quotes.`;

    const model = genAI.getGenerativeModel({
      model: TRANSLATE_MODEL,
      systemInstruction,
    });

    const result = await model.generateContent(String(text));
    const responseText = result.response.text().trim();

    if (!responseText) {
      throw new Error("Gemini returned an empty translation");
    }

    return NextResponse.json({ translatedText: responseText });
  } catch (error: unknown) {
    console.error("🔴 [API/TRANSLATE] Gemini request failed:", {
      model: TRANSLATE_MODEL,
      error,
    });

    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 },
    );
  }
}
