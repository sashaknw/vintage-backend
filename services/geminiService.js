const axios = require("axios");
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Service for interacting with Google's Gemini API for content moderation
 */
class GeminiService {
  /**
   * Analyze forum content for potential moderation issues
   * @param {string} content - The content to analyze (post or reply text)
   * @param {string} contentType - Either "topic" or "reply"
   * @returns {Promise<Object>} - Analysis results
   */
  async moderateContent(content, contentType = "topic") {
    try {
      // Create the prompt for content moderation
      const prompt = `
      You are VintageVaultMod, an AI forum moderator for a vintage fashion community platform called "Vintage Vault".
      You need to analyze the following ${contentType} content for potential moderation issues.
      
      === CONTENT TO ANALYZE ===
      ${content}
      === END CONTENT ===
      
      Based on this vintage fashion community's guidelines, analyze the content for the following issues:
      - Profanity or inappropriate language
      - Spam content or irrelevant posting
      - Harassment, hate speech, or personal attacks
      - Promotional content or unauthorized advertising
      - Potential scams or unsafe links
      
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

      // call Gemini API
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

      // extract JSON from response
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
   * Generate a suggested improvement for flagged content
   * @param {string} originalContent - The original content that was flagged
   * @param {Array} issues - Array of issues detected in the content
   * @returns {Promise<string>} - Suggested improved content
   */
  async suggestImprovement(originalContent, issues) {
    try {
      const issuesText = issues
        .map(
          (issue) =>
            `- ${issue.type}: ${issue.explanation} (severity: ${issue.severity})`
        )
        .join("\n");

      const prompt = `
      You are VintageVaultMod, an AI forum moderator for a vintage fashion community platform.
      
      The following content has been flagged for moderation due to these issues:
      ${issuesText}
      
      === ORIGINAL CONTENT ===
      ${originalContent}
      === END CONTENT ===
      
      Please rewrite the content to fix these issues while preserving the user's original intent.
      Make minimal changes necessary to comply with community guidelines.
      Be fashion-specific, or fashion-community-event spacific, and keep the vintage fashion terminology intact.
      Focus on fixing only the problematic parts.
      
      Return ONLY the improved content without any explanations or additional text.`;

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

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Error generating content improvement with Gemini:", error);
      return "Unable to generate suggestion. Please review the content manually.";
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
