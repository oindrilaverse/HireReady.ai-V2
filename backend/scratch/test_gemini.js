const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env' });


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function test() {
  console.log("Testing Gemini API Key...");
  console.log("Key length:", process.env.GEMINI_API_KEY?.length || 0);
  try {
    const result = await model.generateContent("Hello, are you there?");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("Gemini Error:", error.message);
  }
}

test();
