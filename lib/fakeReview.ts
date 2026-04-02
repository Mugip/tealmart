// lib/fakeReview.ts

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const API_URL = "https://router.huggingface.co/v1/chat/completions";

export async function isLikelyFakeReview(text: string): Promise<boolean> {
  if (!text) return false;

  const cleanText = text.trim();
  const lower = cleanText.toLowerCase();

  // 1. FAST HEURISTICS (Save API calls for obvious spam)
  if (cleanText.length < 10) return true; // Too short

  const spamWords = [
    'buy now', '100% guaranteed', 'click here', 'earn money',
    'http://', 'https://', 'www.', '.com'
  ];
  
  if (spamWords.some(word => lower.includes(word))) return true;

  // 2. AI EVALUATION
  if (!HUGGINGFACE_API_KEY) {
    console.warn("⚠️ No Hugging Face API key, skipping AI review check.");
    return false; // Default to allow if AI isn't configured
  }

  try {
    const systemPrompt = `You are a spam and fake review detector for an e-commerce store. 
    Analyze the following user review. Reply with EXACTLY the word "SPAM" if the review contains promotional links, completely irrelevant nonsense, gibberish, or obvious bot spam. 
    Reply with EXACTLY "VALID" if it looks like a normal human product review (even if it is negative, brief, or poorly written). 
    Do not explain your reasoning. Only output SPAM or VALID.`;

    const payload = {
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Review to analyze: "${cleanText}"` }
      ],
      max_tokens: 10,
      temperature: 0.1, 
      stream: false
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
        "x-wait-for-model": "false" 
      },
      body: JSON.stringify(payload),
    });

    // ✅ FIXED: Check if the response is actually JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn(`⚠️ HF returned HTML instead of JSON for review check. Allowing review.`);
      return false; // Fail open
    }

    const result = await response.json();

    if (!response.ok) {
      console.warn("⚠️ AI Review check failed, allowing review.");
      return false; 
    }

    const aiDecision = result.choices?.[0]?.message?.content?.trim().toUpperCase();

    // If the AI explicitly says SPAM, reject it.
    if (aiDecision?.includes("SPAM")) {
      console.log(`🛑 AI caught spam review: "${cleanText}"`);
      return true;
    }

    return false; // Default valid

  } catch (error) {
    console.error("❌ AI Review Detection Error:", error);
    return false; // Fail open to avoid blocking real users during server errors
  }
}
