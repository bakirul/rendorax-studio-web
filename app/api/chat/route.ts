import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// গ্লোবাল ল্যাঙ্গুয়েজ ম্যাপিং ডিকশনারি
const languageMap: Record<string, string> = {
  bn: "Bengali (বাংলা)",
  en: "English",
  es: "Spanish (Español)",
  ar: "Arabic (العربية)",
  fr: "French (Français)",
  de: "German (Deutsch)",
  zh: "Mandarin Chinese (中文)",
  hi: "Hindi (हिन्दी)",
  ja: "Japanese (日本語)"
};

export async function POST(req: NextRequest) {
  try {
    if (!genAI) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 }
      );
    }

    const { message, selectedLanguage } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    let systemInstruction = 
      "You are Kachna AI, the premium AI assistant for 'Kachna Media', a broadcast post-production studio based in Dhaka, Bangladesh. " +
      "Your job is to assist clients and users with video reviews, timestamped comments, multiple video versions, private video hosting, and video production pipeline workflows. " +
      "Be professional, elegant, helpful, and concise. ";

    // 🌐 ডাইনামিক ভাষা নির্ধারণ লজিক
    if (selectedLanguage && languageMap[selectedLanguage]) {
      const targetLang = languageMap[selectedLanguage];
      systemInstruction += `Strictly respond in ${targetLang}. Understand the user's input context perfectly, but your reply MUST be entirely written in fluent ${targetLang}.`;
    } else {
      systemInstruction += "Automatically detect and reply in the same language the user used.";
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(message);
    const responseText = result.response.text();

    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}