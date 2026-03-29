// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

// ✅ NEW HUGGING FACE ROUTER ENDPOINT (Updated for 2024/2025)
const MODEL_URL = "https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.3";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!HUGGINGFACE_API_KEY) {
      console.error("❌ CHAT ERROR: HUGGINGFACE_API_KEY is missing from .env");
      return NextResponse.json({ 
        role: 'assistant', 
        content: "Configuration error: API Key missing on server. ⚙️" 
      });
    }

    // 1. TealMart Intelligence
    const systemPrompt = `You are Tealy, the AI support for TealMart. 
    TealMart Info: 
    - Free shipping over $50 (7-14 days). 
    - 30-day money-back guarantee. 
    - We use live exchange rates for global currencies.
    - If asked about an order, suggest checking the "Track Order" page.
    Be friendly, short, and use emojis. 🛍️`;

    const userMessage = messages[messages.length - 1].content;

    // 2. Prepare the prompt for Mistral
    const prompt = `<s>[INST] ${systemPrompt} \n\n User Question: ${userMessage} [/INST]`;

    console.log("🤖 Tealy is connecting to the new HF Router...");

    // 3. Make the request to the new endpoint
    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { 
          max_new_tokens: 200, 
          temperature: 0.7,
          wait_for_model: true // Crucial: API will wait up to 60s for model to load
        }
      }),
    });

    const result = await response.json();

    // 4. Handle Errors from the new Router
    if (!response.ok) {
      console.error("❌ NEW ROUTER ERROR:", JSON.stringify(result, null, 2));
      
      // Handle the specific "Model Loading" case
      if (result.error?.includes("loading")) {
        return NextResponse.json({ 
          role: 'assistant', 
          content: "I'm just stretching and waking up! ☕ Give me 10 seconds and ask me again!" 
        });
      }

      return NextResponse.json({ 
        role: 'assistant', 
        content: "I'm having a bit of trouble reaching my database. Please try again in a moment! 🙏" 
      });
    }

    // 5. Parse and Clean the Output
    let aiText = "";
    if (Array.isArray(result)) {
      aiText = result[0].generated_text || "";
    } else {
      aiText = result.generated_text || "";
    }

    // Mistral often returns the prompt + answer. This extracts just the answer.
    const cleanText = aiText.includes("[/INST]") 
      ? aiText.split("[/INST]").pop()?.trim() 
      : aiText;

    return NextResponse.json({ 
      role: 'assistant', 
      content: cleanText || "I'm here! How can I help you today? 😊" 
    });

  } catch (error) {
    console.error("💥 CHAT ROUTE CRITICAL FAILURE:", error);
    return NextResponse.json({ 
      role: 'assistant', 
      content: "Snagged a technical wire. Please try again or email us! 🔌" 
    });
  }
}
