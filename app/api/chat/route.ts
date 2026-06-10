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
    console.log("🟢 [API/CHAT] Incoming request received");
    
    if (!genAI) {
      console.error("🔴 [API/CHAT] Gemini API key is not configured");
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    console.log("🟢 [API/CHAT] Parsed request body:", body);

    const { message, selectedLanguage, folderId, workspaceId } = body;

    if (!message) {
      console.error("🔴 [API/CHAT] Message content is missing in the request");
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    if (!workspaceId) {
      console.warn("⚠️ [API/CHAT] Warning: workspaceId is missing or null for this user. This might cause issues if history is saved.");
    }

    let systemInstruction = 
      "You are Kachna AI, the premium AI assistant for 'Kachna Media', a broadcast post-production studio based in Dhaka, Bangladesh. " +
      "Your job is to assist clients and users with video reviews, timestamped comments, multiple video versions, private video hosting, and video production pipeline workflows. " +
      "Be professional, elegant, helpful, and concise. ";

    // 🌐 ডাইনামিক ভাষা নির্ধারণ লজিক (from global state)
    if (selectedLanguage) {
      systemInstruction += `\n\nCRITICAL INSTRUCTION: You MUST strictly respond in the following language locale: ${selectedLanguage}. Do not use any other language!`;
    } else {
      systemInstruction += "Automatically detect and reply in the same language the user used.";
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(message);
    const responseText = result.response.text();

    console.log("🟢 [API/CHAT] Response generated successfully");
    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("🔴 [API/CHAT] Gemini API Error / Execution Failure:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}