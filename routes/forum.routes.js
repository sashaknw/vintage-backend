const router = require("express").Router();
const ForumCategory = require("../models/ForumCategory.model");
const ForumTopic = require("../models/ForumTopic.model");
const ForumReply = require("../models/ForumReply.model");
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

const isAdmin = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user && user.isAdmin === true;
  } catch (error) {
    return false;
  }
};

router.get("/categories", async (req, res, next) => {
  try {
    const categories = await ForumCategory.find().sort({ order: 1 });
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
});

router.get("/categories/:categoryId", async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const category = await ForumCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const topics = await ForumTopic.find({ category: categoryId })
      .populate("author", "name profilePicture")
      .sort({ isPinned: -1, lastActivity: -1 })
      .lean();

    const topicsWithReplyCount = await Promise.all(
      topics.map(async (topic) => {
        const replyCount = await ForumReply.countDocuments({
          topic: topic._id,
        });
        return {
          ...topic,
          replyCount,
        };
      })
    );

    res.status(200).json({
      category,
      topics: topicsWithReplyCount,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/topics/:topicId", async (req, res, next) => {
  try {
    const { topicId } = req.params;

    await ForumTopic.findByIdAndUpdate(topicId, { $inc: { viewCount: 1 } });

    const topic = await ForumTopic.findById(topicId)
      .populate("author", "name profilePicture")
      .populate("category", "name")
      .select(
        "title content author category createdAt lastActivity followers isPinned isLocked viewCount"
      );

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const replies = await ForumReply.find({ topic: topicId })
      .populate("author", "name profilePicture")
      .sort({ createdAt: 1 });

    res.status(200).json({
      topic,
      replies,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/topics", isAuthenticated, async (req, res, next) => {
  try {
    const { title, content, categoryId } = req.body;
    const author = req.payload._id;

    if (!title || !content || !categoryId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const categoryExists = await ForumCategory.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found" });
    }

    const newTopic = await ForumTopic.create({
      title,
      content,
      author,
      category: categoryId,
      followers: [author],
    });

    const populatedTopic = await ForumTopic.findById(newTopic._id)
      .populate("author", "name profilePicture")
      .populate("category", "name");

    res.status(201).json(populatedTopic);
  } catch (error) {
    next(error);
  }
});

router.put("/topics/:topicId", isAuthenticated, async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { content, title } = req.body;
    const userId = req.payload._id;

    const topic = await ForumTopic.findById(topicId);

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    if (topic.author.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You can only edit your own topics" });
    }

    const updates = {};
    if (content) updates.content = content;
    if (title) updates.title = title;
    updates.updatedAt = new Date();

    const updatedTopic = await ForumTopic.findByIdAndUpdate(topicId, updates, {
      new: true,
    })
      .populate("author", "name profilePicture")
      .populate("category", "name");

    res.status(200).json(updatedTopic);
  } catch (error) {
    next(error);
  }
});

router.delete("/topics/:topicId", isAuthenticated, async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const userId = req.payload._id;

    const topic = await ForumTopic.findById(topicId);

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const userIsAdmin = await isAdmin(userId);

    if (!userIsAdmin) {
      return res
        .status(403)
        .json({ message: "Only administrators can delete topics" });
    }

    await ForumReply.deleteMany({ topic: topicId });

    await ForumTopic.findByIdAndDelete(topicId);

    res.status(200).json({ message: "Topic deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/topics/:topicId/replies",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { topicId } = req.params;
      const { content } = req.body;
      const author = req.payload._id;

      if (!content) {
        return res.status(400).json({ message: "Reply content is required" });
      }

      const topic = await ForumTopic.findById(topicId);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      if (topic.isLocked) {
        return res.status(403).json({ message: "This topic is locked" });
      }

      const newReply = await ForumReply.create({
        content,
        author,
        topic: topicId,
      });

      await ForumTopic.findByIdAndUpdate(topicId, {
        lastActivity: new Date(),
      });

      const populatedReply = await ForumReply.findById(newReply._id).populate(
        "author",
        "name profilePicture"
      );

      res.status(201).json(populatedReply);
    } catch (error) {
      next(error);
    }
  }
);

router.delete("/replies/:replyId", isAuthenticated, async (req, res, next) => {
  try {
    const { replyId } = req.params;
    const userId = req.payload._id;

    const reply = await ForumReply.findById(replyId);

    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    const userIsAdmin = await isAdmin(userId);

    if (reply.author.toString() !== userId && !userIsAdmin) {
      return res
        .status(403)
        .json({ message: "You can only delete your own replies" });
    }

    await ForumReply.findByIdAndDelete(replyId);

    const topic = await ForumTopic.findById(reply.topic);
    if (topic) {
      const latestReply = await ForumReply.findOne({ topic: reply.topic }).sort(
        { createdAt: -1 }
      );

      if (latestReply) {
        await ForumTopic.findByIdAndUpdate(reply.topic, {
          lastActivity: latestReply.createdAt,
        });
      } else {
        await ForumTopic.findByIdAndUpdate(reply.topic, {
          lastActivity: topic.createdAt,
        });
      }
    }

    res.status(200).json({ message: "Reply deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/topics/:topicId/follow",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { topicId } = req.params;
      const userId = req.payload._id;

      const topic = await ForumTopic.findById(topicId);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      const isFollowing = topic.followers.includes(userId);

      if (isFollowing) {
        await ForumTopic.findByIdAndUpdate(topicId, {
          $pull: { followers: userId },
        });
      } else {
        await ForumTopic.findByIdAndUpdate(topicId, {
          $addToSet: { followers: userId },
        });
      }

      res.status(200).json({
        following: !isFollowing,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/replies/:replyId/like",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { replyId } = req.params;
      const userId = req.payload._id;

      const reply = await ForumReply.findById(replyId);
      if (!reply) {
        return res.status(404).json({ message: "Reply not found" });
      }

      
      const hasLiked = reply.likes.includes(userId);

     
      if (hasLiked) {
        await ForumReply.findByIdAndUpdate(replyId, {
          $pull: { likes: userId },
        });
      } else {
        await ForumReply.findByIdAndUpdate(replyId, {
          $addToSet: { likes: userId },
        });
      }

      const updatedReply = await ForumReply.findById(replyId);

      res.status(200).json({
        liked: !hasLiked,
        likeCount: updatedReply.likes.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/user/followed-topics", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;

    const followedTopics = await ForumTopic.find({ followers: userId })
      .populate("author", "name profilePicture")
      .populate("category", "name")
      .sort({ lastActivity: -1 });

    res.status(200).json(followedTopics);
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const searchResults = await ForumTopic.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } },
      ],
    })
      .populate("author", "name profilePicture")
      .populate("category", "name")
      .sort({ lastActivity: -1 })
      .limit(20);

    res.status(200).json(searchResults);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
