// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server'

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

// ✅ Using the most stable OpenAI-compatible endpoint for Hugging Face
const API_URL = "https://router.huggingface.co/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!HUGGINGFACE_API_KEY) {
      console.error("❌ CHAT ERROR: HUGGINGFACE_API_KEY missing");
      return NextResponse.json({ 
        role: 'assistant', 
        content: "Configuration error on server. API Key missing. ⚙️" 
      });
    }

    // 1. TealMart Core Knowledge
    const systemPrompt = `You are Tealy, the helpful AI assistant for TealMart.
    Rules:
    - Shipping: Free on orders over $50. Global delivery in 7-14 days.
    - Returns: 30-day money-back guarantee.
    - Payments: We accept Stripe and Flutterwave.
    - Tracking: Tell users to visit the "Track Order" page with their email and order number.
    - Tone: Friendly, concise, and use emojis. 🛍️`;

    // 2. Prepare the payload in OpenAI format
    const payload = {
      model: "mistralai/Mistral-7B-Instruct-v0.3",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      max_tokens: 200,
      temperature: 0.7,
      stream: false
    };

    console.log("🤖 Tealy is calling the v1 Chat API...");

    // 3. Fetch with extra error safety
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
        "x-wait-for-model": "true" // Tells HF to wait for model to load instead of failing
      },
      body: JSON.stringify(payload),
    });

    // 4. Safely parse JSON to avoid "Unexpected token N" error
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textError = await response.text();
      console.error("❌ NON-JSON API RESPONSE:", textError);
      return NextResponse.json({ 
        role: 'assistant', 
        content: "I'm having a hard time connecting right now. Please try again in 30 seconds! ☕" 
      });
    }

    const result = await response.json();

    // 5. Handle standard API errors
    if (!response.ok) {
      console.error("❌ API ERROR:", result);
      
      if (result.error?.includes("loading")) {
        return NextResponse.json({ 
          role: 'assistant', 
          content: "I'm just waking up! Give me about 10 seconds and ask me again. 😴" 
        });
      }

      return NextResponse.json({ 
        role: 'assistant', 
        content: "My connection to the brain is a bit shaky. Try again? 🙏" 
      });
    }

    // 6. Return the actual message content
    const aiMessage = result.choices?.[0]?.message?.content;

    return NextResponse.json({ 
      role: 'assistant', 
      content: aiMessage || "I'm here! How can I help you shop today? 😊" 
    });

  } catch (error) {
    console.error("💥 CRITICAL CHAT FAILURE:", error);
    return NextResponse.json({ 
      role: 'assistant', 
      content: "Technical snag! 🔌 Please refresh the page and try again." 
    });
  }
}
