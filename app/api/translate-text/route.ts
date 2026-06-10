import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: NextRequest) {
  try {
    if (!genAI) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 }
      );
    }

    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: "Text and targetLanguage are required" }, { status: 400 });
    }

    const systemInstruction = `You are a strict, highly accurate translation engine. Translate the following text into the locale: ${targetLanguage}. ONLY output the translated text. Do NOT add any conversational filler, notes, or quotes.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(text);
    const responseText = result.response.text();

    return NextResponse.json({ translatedText: responseText.trim() });

  } catch (error: any) {
    console.error("🔴 [API/TRANSLATE] Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
