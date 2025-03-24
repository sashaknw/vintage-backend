const ForumModeration = require("../models/ForumModeration.model");
const ForumTopic = require("../models/ForumTopic.model");
const ForumReply = require("../models/ForumReply.model");
const ModerationSettings = require("../models/ModerationSettings.model");

const analyzeContent = (content) => {
  const profanityList = [
    "shit",
    "fuck",
    "damn",
    "crap",
    "ass",
    "bitch",
    "bastard",
    "asshole",
    "dickhead",
    "bullshit",
    "motherfucker",
    "wtf",
    "stfu",
    "fck",
    "piss",
    "cock",
    "dick",
    "pussy",
    "whore",
    "slut",
    "tits",
    "boobs",
    "jerk",
    "douche",
    "douchebag",
    "dumbass",
    "jackass",
    "prick",
    "f*ck",
    "s**t",
    "b*tch",
    "a$$",
    "a$$hole",
    "sh!t",
    "f**k",
    "fu*k",
    "sh*t",
    "b!tch",
    "f**king",
    "f*cking",
    "fcuk",
    "fuk",
    "fuking",
    "mierda",
    "puta",
    "pendejo",
    "cabrón",
    "joder",
    "coño",
    "scheisse",
    "scheiße",
    "putain",
    "merde",
    "cazzo",
    "fottiti",
  ];

  const specialReplacements = {
    caca: "💩 (poop emoji)",
  };

  const spamPatterns = [
    /buy now/i,
    /limited time offer/i,
    /discount/i,
    /\b(www|http)/i,
    /\b\d+% off\b/i,
    /click here/i,
    /\bfree shipping\b/i,
    /\bbest deal\b/i,
    /\bact now\b/i,
    /\bdon't miss out\b/i,
    /\bdon't wait\b/i,
    /\bspecial offer\b/i,
    /\bexclusive deal\b/i,
    /\bwhile supplies last\b/i,
    /\blimited stock\b/i,
    /\bfor a limited time\b/i,
    /check out my (channel|page|website|profile)/i,
    /\bfollow me\b/i,
    /\bcheck out my\b/i,
    /best (price|deal|offer) guaranteed/i,
    /\blow prices\b/i,
    /\bcheap\b/i,
    /\bbargain\b/i,
    /\bsave money\b/i,
    /\bsale ends\b/i,
    /\bnewsletter\b/i,
    /\bsubscribe\b/i,
    /\bonly \$\d+\.\d+\b/i,
    /\bonly \$\d+\b/i,
    /\bspecial discount\b/i,
    /\bcoupon code\b/i,
    /\bpromo code\b/i,
    /\bfree gift\b/i,
    /\bgiveaway\b/i,
    /\bwin a\b/i,
    /\bearning potential\b/i,
    /\bmake money\b/i,
    /\bonline income\b/i,
    /\bwork from home\b/i,
    /\bget rich\b/i,
    /\bmillionaire\b/i,
    /\bcasino\b/i,
    /\bbetting\b/i,
    /\bgambling\b/i,
    /\blottery\b/i,
    /\bviagra\b/i,
    /\bcialis\b/i,
    /\bpills\b/i,
    /\bweight loss\b/i,
    /\bdiet\b/i,
    /\bcryptocurrency\b/i,
    /\bbitcoin\b/i,
    /\bnft\b/i,
    /\binvest\b/i,
  ];


  // Sample harassment patterns
  const harassmentPatterns = [
    /\byou are (stupid|dumb|idiot)/i,
    /\bshut up\b/i,
    /\bgo away\b/i,
    /hate you/i,
    /\byou('re| are) (an )?(idiot|moron|stupid|dumb|pathetic|useless|worthless|loser)/i,
    /\bi hate (you|this)/i,
    /\bkill yourself\b/i,
    /\bkys\b/i,
    /\bdie\b/i,
    /\bget lost\b/i,
    /\bf(uc)?k (you|off|yourself)\b/i,
    /\bgfys\b/i,
    /\bno one (likes|cares about) you\b/i,
    /\byou('re| are) (a )?waste of (time|space|air|life)/i,
    /\b(nobody|no one) asked\b/i,
    /\byou('re| are) garbage\b/i,
    /\byou('re| are) trash\b/i,
    /\byou make me sick\b/i,
    /\byou disgust me\b/i,
    /\byou should be ashamed\b/i,
    /\bshame on you\b/i,
    /\byou('re| are) (a )?(joke|clown|fool)\b/i,
    /\byou('re| are) (a )?(nothing|nobody)\b/i,
    /\byour (mom|mother|dad|father)/i,
    /\bpeople like you\b/i,
  ];

  const issues = [];
  let moderationScore = 0;
  let modifiedContent = content;


  for (const [word, replacement] of Object.entries(specialReplacements)) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    modifiedContent = modifiedContent.replace(regex, replacement);
  }

  for (const word of profanityList) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(content)) {
      issues.push({
        type: "profanity",
        explanation:
          "Your content contains language that may be considered inappropriate.",
        severity: 0.7,
      });
      moderationScore += 0.2;
      break; 
    }
  }

  // Check for spam patterns
  let spamCount = 0;
  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      spamCount++;
    }
  }

  if (spamCount >= 2) {
    issues.push({
      type: "spam",
      explanation: "Your content contains patterns commonly found in spam.",
      severity: 0.6,
    });
    moderationScore += 0.1 * Math.min(spamCount, 5);
  }

  for (const pattern of harassmentPatterns) {
    if (pattern.test(content)) {
      issues.push({
        type: "harassment",
        explanation:
          "Your content contains language that may be considered hostile or harassing.",
        severity: 0.8,
      });
      moderationScore += 0.3;
      break; 
    }
  }

  moderationScore = Math.min(moderationScore, 1.0);

  return {
    isFlagged: issues.length > 0,
    moderationScore,
    issues,
    modifiedContent,
    summary:
      issues.length > 0
        ? "Content flagged for potential policy violations"
        : "Content appears to be acceptable",
  };
};

const moderationController = {
  moderateNewTopic: async (req, res, next) => {
    try {
      const { content } = req.body;

      if (!content) {
        return next();
      }

      const analysis = analyzeContent(content);

      req.moderationResult = {
        analysis,
        originalContent: content,
        contentType: "topic",
      };

      next();
    } catch (error) {
      console.error("Error in topic moderation:", error);
      // Continue to next middleware even if moderation fails
      next();
    }
  },

  // Middleware to moderate new replies
  moderateNewReply: async (req, res, next) => {
    try {
      const { content } = req.body;

      if (!content) {
        return next();
      }

      const analysis = analyzeContent(content);

      req.moderationResult = {
        analysis,
        originalContent: content,
        contentType: "reply",
      };

      next();
    } catch (error) {
      console.error("Error in reply moderation:", error);
      next();
    }
  },

  saveModerationForTopic: async (topicId, moderationResult) => {
    try {
      if (!moderationResult.analysis.isFlagged) {
        return null;
      }

      await ForumModeration.create({
        contentType: "topic",
        contentId: topicId,
        originalContent: moderationResult.originalContent,
        moderationScore: moderationResult.analysis.moderationScore,
        isFlagged: true,
        issues: moderationResult.analysis.issues,
        status: "pending",
      });

      console.log(`Moderation saved for topic ${topicId}`);
      return true;
    } catch (error) {
      console.error("Error saving topic moderation:", error);
      return false;
    }
  },

  saveModerationForReply: async (replyId, moderationResult) => {
    try {
      if (
        !moderationResult.analysis.isFlagged &&
        !moderationResult.analysis.modifiedContent
      ) {
        return null;
      }

      await ForumModeration.create({
        contentType: "reply",
        contentId: replyId,
        originalContent: moderationResult.originalContent,
        moderationScore: moderationResult.analysis.moderationScore,
        isFlagged: true,
        issues: moderationResult.analysis.issues,
        status: "pending",
      });

      if (
        moderationResult.analysis.modifiedContent &&
        moderationResult.analysis.modifiedContent !==
          moderationResult.originalContent
      ) {
        await ForumReply.findByIdAndUpdate(replyId, {
          content: moderationResult.analysis.modifiedContent,
          hasSpecialReplacements: true,
        });
      }

      console.log(`Moderation saved for reply ${replyId}`);
      return true;
    } catch (error) {
      console.error("Error saving reply moderation:", error);
      return false;
    }
  },
  moderateNewTopic: async (req, res, next) => {
    try {
      const { content } = req.body;

      if (!content) {
        return next();
      }

      const analysis = analyzeContent(content);

      req.moderationResult = {
        analysis,
        originalContent: content,
        contentType: "topic",
      };
      if (
        !analysis.isFlagged &&
        analysis.modifiedContent &&
        analysis.modifiedContent !== content
      ) {
        req.body.content = analysis.modifiedContent;
        req.specialReplacementsApplied = true;
      }

      next();
    } catch (error) {
      console.error("Error in topic moderation:", error);
      next();
    }
  },
  moderateNewReply: async (req, res, next) => {
    try {
      const { content } = req.body;

      if (!content) {
        return next();
      }

      const analysis = analyzeContent(content);
      req.moderationResult = {
        analysis,
        originalContent: content,
        contentType: "reply",
      };

      if (
        !analysis.isFlagged &&
        analysis.modifiedContent &&
        analysis.modifiedContent !== content
      ) {
        req.body.content = analysis.modifiedContent;
        req.specialReplacementsApplied = true;
      }
      next();
    } catch (error) {
      console.error("Error in reply moderation:", error);
      next();
    }
  },

  getPendingModerations: async (req, res) => {
    try {
      const pendingItems = await ForumModeration.findPendingReviews();

      const populatedItems = await Promise.all(
        pendingItems.map(async (item) => {
          const itemObj = item.toObject();

          if (item.contentType === "topic") {
            const topic = await ForumTopic.findById(item.contentId).populate(
              "author",
              "name profilePicture"
            );
            if (topic) {
              itemObj.contentId = topic;
            }
          } else if (item.contentType === "reply") {
            const reply = await ForumReply.findById(item.contentId).populate(
              "author",
              "name profilePicture"
            );
            if (reply) {
              itemObj.contentId = reply;
            }
          }

          return itemObj;
        })
      );

      res.status(200).json({ data: populatedItems });
    } catch (error) {
      console.error("Error getting pending moderations:", error);
      res.status(500).json({ message: "Error fetching moderation queue" });
    }
  },

  processModerationDecision: async (req, res) => {
    try {
      const { moderationId } = req.params;
      const { decision, notes, modifiedContent } = req.body;
      const userId = req.payload._id;

      const moderationEntry = await ForumModeration.findById(moderationId);
      if (!moderationEntry) {
        return res.status(404).json({ message: "Moderation entry not found" });
      }

      moderationEntry.status = decision;
      moderationEntry.reviewNote = notes || "";
      moderationEntry.reviewedBy = userId;

      let contentUpdate = {};
      if (modifiedContent) {
        moderationEntry.suggestedImprovement = modifiedContent;
        contentUpdate.content = modifiedContent;
      }
      if (decision === "approved") {
        contentUpdate.visible = true;
        contentUpdate.pendingModeration = false;
        contentUpdate.moderationStatus = "approved";
      } else if (decision === "rejected") {
        contentUpdate.visible = false;
        contentUpdate.pendingModeration = false;
        contentUpdate.moderationStatus = "rejected";
      } else if (decision === "modified") {
        contentUpdate.visible = true;
        contentUpdate.pendingModeration = false;
        contentUpdate.moderationStatus = "approved";
      }

      if (moderationEntry.contentType === "topic") {
        await ForumTopic.findByIdAndUpdate(
          moderationEntry.contentId,
          contentUpdate
        );
      } else if (moderationEntry.contentType === "reply") {
        await ForumReply.findByIdAndUpdate(
          moderationEntry.contentId,
          contentUpdate
        );
      }

      await moderationEntry.save();

      res.status(200).json({
        message: "Moderation decision processed",
        decision,
      });
    } catch (error) {
      console.error("Error processing moderation decision:", error);
      res.status(500).json({ message: "Error processing moderation decision" });
    }
  },

  getContentImprovement: async (req, res) => {
    try {
      const { moderationId } = req.params;

      const moderationEntry = await ForumModeration.findById(moderationId);
      if (!moderationEntry) {
        return res.status(404).json({ message: "Moderation entry not found" });
      }

      // Create a simple improvement suggestion based on issues
      let suggestedImprovement = moderationEntry.originalContent;

      // Basic improvements based on issue types
      if (moderationEntry.issues.some((issue) => issue.type === "profanity")) {
        suggestedImprovement = suggestedImprovement
          .replace(/shit/gi, "****")
          .replace(/fuck/gi, "****")
          .replace(/damn/gi, "****")
          .replace(/crap/gi, "****")
          .replace(/ass\b/gi, "***")
          .replace(/bitch/gi, "*****")
          .replace(/bastard/gi, "*******");
      }

      if (moderationEntry.issues.some((issue) => issue.type === "spam")) {
        // Remove excessive URLs and typical spam patterns
        suggestedImprovement = suggestedImprovement
          .replace(/\b(www|http)[^\s]+/gi, "[link removed]")
          .replace(/\b\d+% off\b/gi, "discount")
          .replace(/buy now/gi, "consider purchasing")
          .replace(/limited time offer/gi, "available for a limited period");
      }

      // For harassment, rewrite the whole thing in a more neutral tone
      if (moderationEntry.issues.some((issue) => issue.type === "harassment")) {
        suggestedImprovement =
          "I'd like to express my disagreement in a respectful way. " +
          "I understand you may have a different perspective, and I'd appreciate further discussion.";
      }

      // Store the suggestion
      moderationEntry.suggestedImprovement = suggestedImprovement;
      await moderationEntry.save();

      res.status(200).json({
        data: {
          suggestedImprovement: suggestedImprovement,
        },
      });
    } catch (error) {
      console.error("Error generating content improvement:", error);
      res
        .status(500)
        .json({ message: "Error generating improvement suggestion" });
    }
  },

  getModerationReport: async (req, res) => {
    try {
      // Get basic statistics
      const totalCount = await ForumModeration.countDocuments();
      const pendingCount = await ForumModeration.countDocuments({
        status: "pending",
      });
      const approvedCount = await ForumModeration.countDocuments({
        status: "approved",
      });
      const rejectedCount = await ForumModeration.countDocuments({
        status: "rejected",
      });
      const modifiedCount = await ForumModeration.countDocuments({
        status: "modified",
      });

      const aggregateResult = await ForumModeration.aggregate([
        { $group: { _id: null, averageScore: { $avg: "$moderationScore" } } },
      ]);

      const averageScore =
        aggregateResult.length > 0
          ? (aggregateResult[0].averageScore * 100).toFixed(1) + "%"
          : "N/A";

      const issues = await ForumModeration.aggregate([
        { $unwind: "$issues" },
        { $group: { _id: "$issues.type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      const report = `
Moderation Report
----------------
Total content moderated: ${totalCount}
Content pending review: ${pendingCount}
Content approved: ${approvedCount}
Content rejected: ${rejectedCount}
Content modified: ${modifiedCount}
Average moderation score: ${averageScore}

Issues breakdown:
${issues
  .map((issue) => `- ${issue._id}: ${issue.count} occurrences`)
  .join("\n")}
      `;

      res.status(200).json({ data: { report } });
    } catch (error) {
      console.error("Error generating moderation report:", error);
      res.status(500).json({ message: "Error generating moderation report" });
    }
  },

  getModerationSettings: async (req, res) => {
    try {
      // Get settings from database, creating default settings if none exist
      let settings = await ModerationSettings.findOne();

      if (!settings) {
        // Create default settings if none exist
        settings = await ModerationSettings.create({
          enabled: true,
          autoModerateSafe: true,
          autoRemoveHighRisk: false,
          toxicityThreshold: 0.7,
        });
      }

      res.status(200).json({ data: settings });
    } catch (error) {
      console.error("Error fetching moderation settings:", error);
      res.status(500).json({ message: "Error fetching moderation settings" });
    }
  },

  updateModerationSettings: async (req, res) => {
    try {
      const newSettings = req.body;

      // Validate settings
      if (newSettings.toxicityThreshold !== undefined) {
        if (
          newSettings.toxicityThreshold < 0 ||
          newSettings.toxicityThreshold > 1
        ) {
          return res.status(400).json({
            message: "Toxicity threshold must be between 0 and 1",
          });
        }
      }

      // Get current settings or create if they don't exist
      let settings = await ModerationSettings.findOne();

      if (!settings) {
        settings = await ModerationSettings.create({
          ...newSettings,
        });
      } else {
        // Update existing settings
        settings = await ModerationSettings.findOneAndUpdate(
          {}, // Find the first document (we only have one settings document)
          { $set: newSettings },
          { new: true }
        );
      }

      res.status(200).json({
        data: settings,
        message: "Settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating moderation settings:", error);
      res.status(500).json({ message: "Error updating moderation settings" });
    }
  },
};

module.exports = moderationController;
