const axios = require("axios");
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

console.log("Gemini API Key present:", !!process.env.GEMINI_API_KEY);
class GeminiService {
  /**
   * Analyze forum content for potential moderation issues
   * @param {string} content - The content to analyze (post or reply text)
   * @param {string} contentType - Either "topic" or "reply"
   * @returns {Promise<Object>} - Analysis results
   */
  async moderateContent(content, contentType = "topic") {
    try {
      const prompt = `
      You are VintageVaultMod, an AI forum moderator for a vintage fashion community platform called "Vintage Vault".
      You need to analyze the following ${contentType} content for potential moderation issues.
      
      === CONTENT TO ANALYZE ===
      ${content}
      === END CONTENT ===
      
      Based on this vintage fashion community's guidelines, analyze the content for the following issues:
      - Profanity or inappropriate language
      - Spam content or irrelevant posting
      - Harassment, hate speech, or personal attacks including:
        * Statements calling someone "useless", "worthless", or "the worst"
        * Personal attacks on character, appearance, or intelligence
        * Negative generalizations about individuals
        * Derogatory language even if not containing explicit profanity
      - Promotional content or unauthorized advertising
      - Potential scams or unsafe links
      - If anyone mentions dogs in any way, it has to changed to cats
      
      Respond with a JSON object ONLY in the following format:
      {
        "isFlagged": boolean, // true if any issues were detected
        "moderationScore": number, // from 0 to 1, where 0 is perfectly safe and 1 is severely violating guidelines
        "issues": [ 
          // Array of detected issues, empty if none found
          {
            "type": string, // one of: "profanity", "spam", "harassment", "promotional", "off-topic", "scam", "other"
            "severity": number, // from 0 to 1 
            "explanation": string // brief explanation of the issue
          }
        ],
        "summary": string, // Brief summary of analysis results
        "recommendedAction": string // one of: "approve", "flag", "remove"
      }

      Keep the analysis fashion community-specific. Be lenient on fashion terminology but strict on harassment.
      Do not include any other text outside the JSON object.`;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }
      );

      const responseText = response.data.candidates[0].content.parts[0].text;
      const jsonStart = responseText.indexOf("{");
      const jsonEnd = responseText.lastIndexOf("}") + 1;
      const jsonString = responseText.substring(jsonStart, jsonEnd);

      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error calling Gemini API for moderation:", error);

     
      return {
        isFlagged: false,
        moderationScore: 0,
        issues: [],
        summary: "Error during content analysis. Manual review recommended.",
        recommendedAction: "flag",
        error: true,
      };
    }
  }

  /**
   * Generate a suggested improvement for content
   * @param {string} originalContent - The original content
   * @param {Array} issues - Array of issues detected in the content (can be empty)
   * @returns {Promise<string>} - Suggested improved content
   */
  async suggestImprovement(originalContent, issues = []) {
    try {
      console.log("Starting content improvement with Gemini");
      console.log("Original content:", originalContent?.substring(0, 100) + "...");
      console.log("Issues count:", issues?.length || 0);
      
      // Check for valid inputs
      if (!originalContent) {
        console.error("Error: originalContent is empty or undefined");
        return originalContent;
      }
      
      // Format issues - handles case where no issues are found
      const issuesText = issues && issues.length > 0
        ? issues
            .map(
              (issue) =>
                `- ${issue.type}: ${issue.explanation} (severity: ${issue.severity})`
            )
            .join("\n")
        : "No major issues detected, but please apply the following rules:";
      
      const prompt = `
      You are VintageVaultMod, an AI forum moderator for a vintage fashion community platform.
      
      ${issues && issues.length > 0 
        ? `The following content has been flagged for moderation due to these issues:\n${issuesText}`
        : `Please review the following content using these guidelines:\n${issuesText}`}
      
      === ORIGINAL CONTENT ===
      ${originalContent}
      === END CONTENT ===
      
      Please rewrite the content to fix these issues while preserving the user's original intent.
      Make minimal changes necessary to comply with community guidelines.
      Be fashion-specific, or fashion-community-event specific, and keep the vintage fashion terminology intact.
      Focus on fixing only the problematic parts.
      
      SPECIAL RULES TO ALWAYS APPLY:
      - If anyone mentions dogs in any way, it has to be changed to cats
      - Remove any external links and replace them with "[link removed]"
      - Make sure all communication is respectful and friendly
      
      Return ONLY the improved content without any explanations or additional text. 
      If no changes are needed, return the original text unchanged.`;

      console.log("Sending request to Gemini API");
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }
      );
      
      console.log("Received response from Gemini API");
      
      // Check if response has the expected structure
      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error("Unexpected response structure:", JSON.stringify(response.data));
        return originalContent;
      }
      
      const improvedContent = response.data.candidates[0].content.parts[0].text;
      console.log("Improvement generated successfully");
      
      // Only return the improved content if it's different from the original
      if (improvedContent !== originalContent) {
        return improvedContent;
      } else {
        return originalContent;
      }
    } catch (error) {
      console.error("Error generating content improvement with Gemini:");
      
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Response data:", JSON.stringify(error.response.data));
      } else if (error.request) {
        console.error("No response received");
      } else {
        console.error("Error message:", error.message);
      }
      
      // Return original content if there's an error
      return originalContent;
    }
  }

  /**
   * Generate a moderation report with insights and recommendations
   * @param {Array} moderationData - Recent moderation activity data
   * @returns {Promise<string>} - Formatted report with insights
   */
  async generateModerationReport(moderationData) {
    try {
      const dataJSON = JSON.stringify(moderationData);

      const prompt = `
      You are VintageVaultMod, an AI forum moderator for a vintage fashion community platform.
      Generate a detailed moderation report based on the following data:
      
      ${dataJSON}
      
      Your report should include:
      1. Overall summary of moderation activity
      2. Common issues detected in the community
      3. Trends or patterns in content that gets flagged
      4. Recommendations for improving community guidelines
      5. Suggestions for administrator action
      
      Format the report with clear headings and bullet points where appropriate.
      Focus on insights relevant to a vintage fashion community.`;

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Error generating moderation report with Gemini:", error);
      return "Error generating moderation report. Please try again later.";
    }
  }
}
module.exports = new GeminiService();