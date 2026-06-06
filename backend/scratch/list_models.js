const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function listModels() {
  try {
    // There isn't a direct listModels in the new SDK easily accessible this way, 
    // but we can try a few common ones.
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        await model.generateContent("test");
        console.log(`Model ${m} is AVAILABLE`);
      } catch (e) {
        console.log(`Model ${m} is NOT available: ${e.message}`);
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();
