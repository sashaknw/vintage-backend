const ForumModeration = require("../models/ForumModeration.model");
const ForumTopic = require("../models/ForumTopic.model");
const ForumReply = require("../models/ForumReply.model");
const ModerationSettings = require("../models/ModerationSettings.model");
const ModerationData = require("../models/ModerationData.model");

// cache for moderation to avoid repeated database calls
let moderationCache = {
  profanity: null,
  spam: null,
  highPrioritySpam: null,
  harassment: null,
  specialReplacements: null,
  lastUpdated: null,
};

// refresh the moderation cache
const refreshModerationCache = async () => {
  try {
    //  refresh if cache is empty or older than 1 hour
    const currentTime = new Date();
    if (
      moderationCache.lastUpdated &&
      currentTime - moderationCache.lastUpdated < 3600000
    ) {
      return;
    }

    const allModerationData = await ModerationData.find();

    // agrupar by type
    moderationCache.profanity = allModerationData
      .filter((item) => item.type === "profanity")
      .map((item) => ({
        patterns: item.patterns,
        severity: item.severity,
        isRegex: item.isRegex,
      }));

    moderationCache.spam = allModerationData
      .filter((item) => item.type === "spam" && item.severity < 0.8)
      .map((item) => ({
        patterns: item.patterns,
        severity: item.severity,
        isRegex: item.isRegex,
      }));

    moderationCache.highPrioritySpam = allModerationData
      .filter((item) => item.type === "spam" && item.severity >= 0.8)
      .map((item) => ({
        patterns: item.patterns,
        severity: item.severity,
        isRegex: item.isRegex,
      }));

    moderationCache.harassment = allModerationData
      .filter((item) => item.type === "harassment")
      .map((item) => ({
        patterns: item.patterns,
        severity: item.severity,
        isRegex: item.isRegex,
      }));

    moderationCache.specialReplacements = allModerationData
      .filter((item) => item.type === "special_replacement")
      .map((item) => ({
        patterns: item.patterns,
        replacementValue: item.replacementValue,
        isRegex: item.isRegex,
      }));

    moderationCache.lastUpdated = currentTime;
    console.log("Moderation cache refreshed");
  } catch (error) {
    console.error("Error refreshing moderation cache:", error);
  }
};

const analyzeContent = async (content) => {
  //latest moderation data
  await refreshModerationCache();

  const issues = [];
  let moderationScore = 0;
  let modifiedContent = content;

  // special replacements first
  if (moderationCache.specialReplacements) {
    for (const replacement of moderationCache.specialReplacements) {
      for (const pattern of replacement.patterns) {
        if (replacement.isRegex) {
          const regex = new RegExp(pattern, "gi");
          modifiedContent = modifiedContent.replace(
            regex,
            replacement.replacementValue
          );
        } else {
          const regex = new RegExp(`\\b${pattern}\\b`, "gi");
          modifiedContent = modifiedContent.replace(
            regex,
            replacement.replacementValue
          );
        }
      }
    }
  }

  // check profanity
  if (moderationCache.profanity) {
    for (const profanityGroup of moderationCache.profanity) {
      let profanityFound = false;

      for (const word of profanityGroup.patterns) {
        const regex = new RegExp(`\\b${word}\\b`, "i");
        if (regex.test(content)) {
          profanityFound = true;
          break;
        }
      }

      if (profanityFound) {
        issues.push({
          type: "profanity",
          explanation:
            "Your content contains language that may be considered inappropriate.",
          severity: profanityGroup.severity || 0.7,
        });
        moderationScore += 0.2;
        break;
      }
    }
  }

  // high-priority spam patterns 
  if (moderationCache.highPrioritySpam) {
    for (const spamGroup of moderationCache.highPrioritySpam) {
      let highPrioritySpamFound = false;

      for (const pattern of spamGroup.patterns) {
        const regex = new RegExp(pattern, "i");
        if (regex.test(content)) {
          highPrioritySpamFound = true;
          break;
        }
      }

      if (highPrioritySpamFound) {
        issues.push({
          type: "spam",
          explanation:
            "Your content contains patterns commonly found in spam or promotional content.",
          severity: spamGroup.severity || 0.9,
        });
        moderationScore += 0.4;
        break;
      }
    }
  }

  // spam patterns 
  if (moderationCache.spam) {
    let spamCount = 0;
    let spamSeverity = 0;

    for (const spamGroup of moderationCache.spam) {
      for (const pattern of spamGroup.patterns) {
        const regex = spamGroup.isRegex
          ? new RegExp(pattern, "i")
          : new RegExp(`\\b${pattern}\\b`, "i");
        if (regex.test(content)) {
          spamCount++;
          spamSeverity = Math.max(spamSeverity, spamGroup.severity || 0.6);
        }
      }
    }

    if (spamCount >= 2) {
      issues.push({
        type: "spam",
        explanation: "Your content contains patterns commonly found in spam.",
        severity: spamSeverity,
      });
      moderationScore += 0.1 * Math.min(spamCount, 5);
    }
  }

  // harassment patterns
  if (moderationCache.harassment) {
    for (const harassmentGroup of moderationCache.harassment) {
      let harassmentFound = false;

      for (const pattern of harassmentGroup.patterns) {
        const regex = new RegExp(pattern, "i");
        if (regex.test(content)) {
          harassmentFound = true;
          break;
        }
      }

      if (harassmentFound) {
        issues.push({
          type: "harassment",
          explanation:
            "Your content contains language that may be considered hostile or harassing.",
          severity: harassmentGroup.severity || 0.8,
        });
        moderationScore += 0.3;
        break;
      }
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

      const analysis = await analyzeContent(content);

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

      const analysis = await analyzeContent(content);
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

        if (!modifiedContent) {
          return res.status(400).json({
            message: "Modified content is required for 'modified' decision",
          });
        }
      }

      let contentModel, updatedContent;
      if (moderationEntry.contentType === "topic") {
        updatedContent = await ForumTopic.findByIdAndUpdate(
          moderationEntry.contentId,
          contentUpdate,
          { new: true }
        );
        contentModel = ForumTopic;
      } else if (moderationEntry.contentType === "reply") {
        updatedContent = await ForumReply.findByIdAndUpdate(
          moderationEntry.contentId,
          contentUpdate,
          { new: true }
        );
        contentModel = ForumReply;
      }

      console.log(
        `Content ${moderationEntry.contentId} updated with decision: ${decision}`
      );
      console.log("Content updates applied:", contentUpdate);

      await moderationEntry.save();

      const verifyContent = await contentModel.findById(
        moderationEntry.contentId
      );
      if (!verifyContent) {
        console.error("Could not verify content update - content not found");
      } else {
        console.log("Content verification - visible:", verifyContent.visible);
        console.log(
          "Content verification - status:",
          verifyContent.moderationStatus
        );
      }

      res.status(200).json({
        message: "Moderation decision processed",
        decision,
        contentId: moderationEntry.contentId,
        updatedContent: verifyContent || null,
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

      if (moderationEntry.suggestedImprovement) {
        return res.status(200).json({
          data: {
            suggestedImprovement: moderationEntry.suggestedImprovement,
          },
        });
      }

      let suggestedImprovement = moderationEntry.originalContent;
      await refreshModerationCache();

      //  profanity
      if (moderationEntry.issues.some((issue) => issue.type === "profanity")) {
        if (moderationCache.profanity) {
          for (const profanityGroup of moderationCache.profanity) {
            for (const word of profanityGroup.patterns) {
              const regex = new RegExp(`\\b${word}\\b`, "gi");
              suggestedImprovement = suggestedImprovement.replace(
                regex,
                "*".repeat(word.length)
              );
            }
          }
        }

        // replacements
        if (moderationCache.specialReplacements) {
          for (const replacement of moderationCache.specialReplacements) {
            for (const pattern of replacement.patterns) {
              if (replacement.isRegex) {
                const regex = new RegExp(pattern, "gi");
                suggestedImprovement = suggestedImprovement.replace(
                  regex,
                  replacement.replacementValue
                );
              } else {
                const regex = new RegExp(`\\b${pattern}\\b`, "gi");
                suggestedImprovement = suggestedImprovement.replace(
                  regex,
                  replacement.replacementValue
                );
              }
            }
          }
        }
      }

      //  spam
      if (moderationEntry.issues.some((issue) => issue.type === "spam")) {
        suggestedImprovement = suggestedImprovement
          .replace(/\b(www|http)[^\s]+/gi, "[link removed]")
          .replace(/\b\d+% off\b/gi, "discount")
          .replace(/buy now/gi, "consider purchasing")
          .replace(/limited time offer/gi, "available for a limited period");
      }

      //  harassment
      if (moderationEntry.issues.some((issue) => issue.type === "harassment")) {
        suggestedImprovement =
          "I'd like to express my disagreement in a respectful way. " +
          "I understand you may have a different perspective, and I'd appreciate further discussion.";
      }

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

  refreshModerationCache: async (req, res) => {
    try {
      await refreshModerationCache();
      res.status(200).json({
        message: "Moderation cache refreshed successfully",
        timestamp: moderationCache.lastUpdated,
      });
    } catch (error) {
      console.error("Error refreshing moderation cache:", error);
      res.status(500).json({ message: "Error refreshing moderation cache" });
    }
  },

  getModerationSettings: async (req, res) => {
    try {
      let settings = await ModerationSettings.findOne();

      if (!settings) {
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

      let settings = await ModerationSettings.findOne();

      if (!settings) {
        settings = await ModerationSettings.create({
          ...newSettings,
        });
      } else {
        settings = await ModerationSettings.findOneAndUpdate(
          {},
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
