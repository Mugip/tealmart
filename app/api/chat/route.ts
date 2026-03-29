// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
// Using a fast, high-quality conversational model
const MODEL_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!HUGGINGFACE_API_KEY) {
      return NextResponse.json({ error: "AI Config missing" }, { status: 500 });
    }

    // 1. Give the AI its "Brain" (Context about TealMart)
    const systemPrompt = `
      You are "Tealy", the official AI support assistant for TealMart. 
      Your personality: Professional, friendly, and helpful.
      
      TealMart Key Info:
      - Shipping: Free on orders over $50. International shipping takes 7-14 days.
      - Returns: 30-day money-back guarantee. Hassle-free.
      - Payments: Secure checkout via Stripe and Flutterwave.
      - Currency: We support global currencies with live exchange rates.
      - Founder: Built with heart for modern e-commerce.
      
      Instructions:
      - Keep answers concise (max 3 sentences).
      - If you don't know an answer, tell them to email support@tealmart.com.
      - Use emojis occasionally to stay friendly. 🛍️
    `;

    // 2. Format the history for the model
    // Mistral expects a specific format: <s>[INST] Instruction [/INST] Model answer</s>
    const userMessage = messages[messages.length - 1].content;
    const formattedPrompt = `<s>[INST] ${systemPrompt} \n\n User Question: ${userMessage} [/INST]`;

    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: formattedPrompt,
        parameters: { max_new_tokens: 250, temperature: 0.7, return_full_text: false }
      }),
    });

    const result = await response.json();
    
    // Hugging Face returns an array of generated text
    const aiResponse = Array.isArray(result) ? result[0].generated_text : "I'm having a bit of trouble connecting. Please try again or email support@tealmart.com! 🙏";

    return NextResponse.json({ role: 'assistant', content: aiResponse });

  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: "Failed to connect to AI" }, { status: 500 });
  }
}
