// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
// Switching to Llama-3-8B-Instruct - highly reliable and fast
const MODEL_URL = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!HUGGINGFACE_API_KEY) {
      console.error("❌ CHAT ERROR: HUGGINGFACE_API_KEY is not defined in .env");
      return NextResponse.json({ role: 'assistant', content: "My configuration is missing. Please check the server .env file! ⚙️" });
    }

    const systemPrompt = `
      You are "Tealy", the AI assistant for TealMart.
      TealMart Info: Shipping is free over $50. Returns are 30 days. We use live exchange rates.
      If a user asks to check an order, tell them to visit the "Track Order" page or check "Order History" in their account.
      Keep it short and friendly.
    `;

    // Llama-3 Prompt Format
    const lastUserMessage = messages[messages.length - 1].content;
    const prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${lastUserMessage}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;

    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 200, temperature: 0.7, stop: ["<|eot_id|>"] }
      }),
    });

    const result = await response.json();

    // ── HANDLE MODEL LOADING ──
    if (result.error && result.error.includes("currently loading")) {
      const waitTime = Math.round(result.estimated_time || 5);
      console.log(`⏳ AI Model is warming up... (${waitTime}s)`);
      return NextResponse.json({ 
        role: 'assistant', 
        content: `I'm just waking up! ☕ Give me about ${waitTime} seconds and ask me again. I'll be ready!` 
      });
    }

    // ── HANDLE API ERRORS ──
    if (!response.ok || result.error) {
      console.error("❌ HUGGING FACE API ERROR:", result);
      return NextResponse.json({ 
        role: 'assistant', 
        content: "I'm having a bit of trouble connecting to my brain. Please try again in a moment! 🙏" 
      });
    }

    // ── PARSE SUCCESSFUL RESPONSE ──
    let aiText = "";
    if (Array.isArray(result)) {
      aiText = result[0].generated_text || "";
    } else if (result.generated_text) {
      aiText = result.generated_text;
    }

    // Clean the prompt out of the response if the model included it
    const cleanText = aiText.replace(prompt, "").trim();

    return NextResponse.json({ 
      role: 'assistant', 
      content: cleanText || "I'm here! How can I help you today? 😊" 
    });

  } catch (error) {
    console.error("💥 CRITICAL CHAT ROUTE ERROR:", error);
    return NextResponse.json({ 
      role: 'assistant', 
      content: "I've hit a technical snag. Please email support@tealmart.com if you need urgent help! 📧" 
    });
  }
}
