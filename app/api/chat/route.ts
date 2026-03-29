// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
// Mistral-7B-v0.3 is open, fast, and highly reliable for support bots
const MODEL_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!HUGGINGFACE_API_KEY) {
      console.error("❌ CHAT ERROR: HUGGINGFACE_API_KEY is missing from .env");
      return NextResponse.json({ role: 'assistant', content: "Config missing. Please add HUGGINGFACE_API_KEY to your environment variables. ⚙️" });
    }

    const systemPrompt = "You are Tealy, the helpful AI for TealMart. We offer 30-day returns and free shipping over $50. Be concise and friendly.";
    const userMessage = messages[messages.length - 1].content;

    // Mistral specific format
    const prompt = `<s>[INTERACTION]\nSYSTEM: ${systemPrompt}\nUSER: ${userMessage}\nASSISTANT:</s>`;

    console.log("🤖 Tealy is thinking...");

    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { 
          max_new_tokens: 150, 
          temperature: 0.7,
          wait_for_model: true // This helps prevent the "model loading" error by waiting up to 60s
        }
      }),
    });

    const result = await response.json();

    // ── DEBUGGING: Check terminal if this fails ──
    if (!response.ok) {
      console.error("❌ HUGGING FACE ERROR DETAIL:", JSON.stringify(result, null, 2));
      
      if (result.error?.includes("currently loading")) {
        return NextResponse.json({ 
          role: 'assistant', 
          content: "I'm just waking up! ☕ Please try again in 10 seconds, I'll be ready." 
        });
      }

      return NextResponse.json({ 
        role: 'assistant', 
        content: "I'm having a bit of trouble connecting to my brain. Check the server console for details! 🙏" 
      });
    }

    // Parse text
    let aiResponse = "";
    if (Array.isArray(result)) {
      aiResponse = result[0].generated_text || "";
    } else {
      aiResponse = result.generated_text || "";
    }

    // Clean up the output (Mistral sometimes repeats the prompt)
    const cleanContent = aiResponse.split("ASSISTANT:").pop()?.trim() || aiResponse;

    return NextResponse.json({ 
      role: 'assistant', 
      content: cleanContent || "I'm here! How can I help you? 😊" 
    });

  } catch (error) {
    console.error("💥 CHAT ROUTE CRASHED:", error);
    return NextResponse.json({ 
      role: 'assistant', 
      content: "Technical error in the chat route. Please check server logs." 
    });
  }
      }
