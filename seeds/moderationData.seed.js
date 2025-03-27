require("dotenv").config();
const mongoose = require("mongoose");
const ModerationData = require("../models/ModerationData.model");
const ModerationSettings = require("../models/ModerationSettings.model");

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vintage-backend";

async function seedModerationData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding moderation data");

    const existingModerationData = await ModerationData.countDocuments();
    if (existingModerationData > 0) {
      console.log("Moderation data already exists. Skipping seed/migration.");
      await mongoose.connection.close();
      return;
    }

    await ModerationData.deleteMany({});
    console.log("Cleared existing moderation data");

    const profanityWords = [
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

    const specialReplacements = [
      {
        type: "special_replacement",
        patterns: ["caca"],
        replacementValue: "💩",
        description: "Replace caca with poop emoji",
        isRegex: false,
        severity: 0,
      },
      {
        type: "special_replacement",
        patterns: ["shit"],
        replacementValue: "💩",
        description: "Replace shit with poop emoji",
        isRegex: false,
        severity: 0,
      },
    ];

    await ModerationData.create(specialReplacements);
    console.log("Created special replacements");

    await ModerationData.create({
      type: "profanity",
      patterns: profanityWords,
      description: "Common profanity words",
      severity: 0.7,
      isRegex: false,
    });
    console.log("Created profanity data");

    // Spam patterns (as regex)
    const spamPatterns = [
      "buy now",
      "limited time offer",
      "discount",
      "click here",
      "\\bfree shipping\\b",
      "\\bbest deal\\b",
      "\\bact now\\b",
      "\\bdon't miss out\\b",
      "\\bdon't wait\\b",
      "\\bspecial offer\\b",
      "\\bexclusive deal\\b",
      "\\bwhile supplies last\\b",
      "\\blimited stock\\b",
      "\\bfor a limited time\\b",
      "check out my (channel|page|website|profile)",
      "\\bfollow me\\b",
      "\\bcheck out my\\b",
      "best (price|deal|offer) guaranteed",
      "\\blow prices\\b",
      "\\bcheap\\b",
      "\\bbargain\\b",
      "\\bsave money\\b",
      "\\bsale ends\\b",
      "\\bnewsletter\\b",
      "\\bsubscribe\\b",
      "\\bonly \\$\\d+\\.\\d+\\b",
      "\\bonly \\$\\d+\\b",
      "\\bspecial discount\\b",
      "\\bcoupon code\\b",
      "\\bpromo code\\b",
      "\\bfree gift\\b",
      "\\bgiveaway\\b",
      "\\bwin a\\b",
      "\\bearning potential\\b",
      "\\bmake money\\b",
      "\\bonline income\\b",
      "\\bwork from home\\b",
      "\\bget rich\\b",
      "\\bmillionaire\\b",
      "\\bcasino\\b",
      "\\bbetting\\b",
      "\\bgambling\\b",
      "\\blottery\\b",
      "\\bviagra\\b",
      "\\bcialis\\b",
      "\\bpills\\b",
      "\\bweight loss\\b",
      "\\bdiet\\b",
      "\\bcryptocurrency\\b",
      "\\bbitcoin\\b",
      "\\bnft\\b",
      "\\binvest\\b",
    ];

    //  ( flag)
    const highPrioritySpamPatterns = [
      "\\b(www|http)\\S+",
      "\\bhttps?://\\S+",
      "casino\\s+online",
      "\\bmake money fast\\b",
      "\\bfree money\\b",
    ];

    await ModerationData.create([
      {
        type: "spam",
        patterns: spamPatterns,
        description: "Common spam patterns",
        severity: 0.6,
        isRegex: true,
      },
      {
        type: "spam",
        patterns: highPrioritySpamPatterns,
        description:
          "High priority spam patterns that should be immediately flagged",
        severity: 0.9,
        isRegex: true,
      },
    ]);
    console.log("Created spam patterns");

  
    const harassmentPatterns = [
      "\\byou are (stupid|dumb|idiot)",
      "\\bshut up\\b",
      "\\bgo away\\b",
      "hate you",
      "\\byou('re| are) (an )?(idiot|moron|stupid|dumb|pathetic|useless|worthless|loser)",
      "\\bi hate (you|this)",
      "\\bkill yourself\\b",
      "\\bkys\\b",
      "\\bdie\\b",
      "\\bget lost\\b",
      "\\bf(uc)?k (you|off|yourself)\\b",
      "\\bgfys\\b",
      "\\bno one (likes|cares about) you\\b",
      "\\byou('re| are) (a )?waste of (time|space|air|life)",
      "\\b(nobody|no one) asked\\b",
      "\\byou('re| are) garbage\\b",
      "\\byou('re| are) trash\\b",
      "\\byou make me sick\\b",
      "\\byou disgust me\\b",
      "\\byou should be ashamed\\b",
      "\\bshame on you\\b",
      "\\byou('re| are) (a )?(joke|clown|fool)\\b",
      "\\byou('re| are) (a )?(nothing|nobody)\\b",
      "\\byour (mom|mother|dad|father)",
      "\\bpeople like you\\b",
    ];

    await ModerationData.create({
      type: "harassment",
      patterns: harassmentPatterns,
      description: "Harassment and aggressive language patterns",
      severity: 0.8,
      isRegex: true,
    });
    console.log("Created harassment patterns");

   
    const existingSettings = await ModerationSettings.findOne();
    if (!existingSettings) {
      await ModerationSettings.create({
        enabled: true,
        autoModerateSafe: true,
        autoRemoveHighRisk: false,
        toxicityThreshold: 0.7,
      });
      console.log("Created default moderation settings");
    }

    console.log("Moderation data seeding/migration completed successfully");
  } catch (error) {
    console.error("Error seeding moderation data:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}


seedModerationData();
