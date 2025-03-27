// test-gemini.js
require("dotenv").config();
const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function testGeminiConnection() {
  try {
    console.log("Testing Gemini API connection...");
    console.log("API Key exists:", !!GEMINI_API_KEY);

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: "Hello, can you help me moderate this text: 'This is a test message'",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 256,
        },
      }
    );

    console.log("API Call Success!");
    console.log("Response status:", response.status);
    console.log(
      "Response text:",
      response.data.candidates[0].content.parts[0].text
    );
    return true;
  } catch (error) {
    console.error("API Call Failed:");
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error(
        "Response data:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error("Error:", error.message);
    }
    return false;
  }
}

testGeminiConnection();
