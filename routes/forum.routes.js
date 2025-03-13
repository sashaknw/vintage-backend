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

router.post("/categories", isAuthenticated, async (req, res, next) => {
  try {
    const { name, description, icon, order } = req.body;
    const userId = req.payload._id;

    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (!name || !description) {
      return res
        .status(400)
        .json({ message: "Name and description are required" });
    }

    const categoryOrder = order || 0;

    const newCategory = await ForumCategory.create({
      name,
      description,
      icon: icon || "💬",
      order: categoryOrder,
    });

    res.status(201).json(newCategory);
  } catch (error) {
    next(error);
  }
});

router.put(
  "/categories/:categoryId",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      const { name, description, icon, order } = req.body;
      const userId = req.payload._id;

      const userIsAdmin = await isAdmin(userId);
      if (!userIsAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const category = await ForumCategory.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const updates = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (icon) updates.icon = icon;
      if (order !== undefined) updates.order = order;

      const updatedCategory = await ForumCategory.findByIdAndUpdate(
        categoryId,
        updates,
        { new: true }
      );

      res.status(200).json(updatedCategory);
    } catch (error) {
      next(error);
    }
  }
);


router.get("/user/:userId/topics", async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const topics = await ForumTopic.find({ author: userId })
      .populate("author", "name profilePicture")
      .populate("category", "name")
      .sort({ createdAt: -1 });
    
    const topicsWithReplyCount = await Promise.all(
      topics.map(async (topic) => {
        const replyCount = await ForumReply.countDocuments({
          topic: topic._id,
        });
        const topicObj = topic.toObject();
        return {
          ...topicObj,
          replyCount,
        };
      })
    );
    
    res.status(200).json(topicsWithReplyCount);
  } catch (error) {
    next(error);
  }
});

router.delete(
  "/categories/:categoryId",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      const userId = req.payload._id;

      const userIsAdmin = await isAdmin(userId);
      if (!userIsAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const category = await ForumCategory.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const topicsInCategory = await ForumTopic.find({ category: categoryId });

      for (const topic of topicsInCategory) {
        await ForumReply.deleteMany({ topic: topic._id });
      }

      await ForumTopic.deleteMany({ category: categoryId });
      await ForumCategory.findByIdAndDelete(categoryId);

      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/topics/:topicId", async (req, res, next) => {
  try {
    const { topicId } = req.params;

    await ForumTopic.findByIdAndUpdate(topicId, { $inc: { viewCount: 1 } });

    const topic = await ForumTopic.findById(topicId)
      .populate("author", "name profilePicture")
      .populate("category", "name")
      .select(
        "title content author category createdAt lastActivity followers isPinned isLocked viewCount isAdminPost"
      );

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const replies = await ForumReply.find({ topic: topicId })
      .populate("author", "name profilePicture isAdmin")
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
    const { title, content, categoryId, isPinned, isLocked, isAdminPost } =
      req.body;
    const author = req.payload._id;
    const userIsAdmin = await isAdmin(author);

    if (!title || !content || !categoryId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const categoryExists = await ForumCategory.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found" });
    }

    const topicData = {
      title,
      content,
      author,
      category: categoryId,
      followers: [author], //  automatically follow your own topic
      lastActivity: new Date(),
    };

    if (userIsAdmin) {
      if (isPinned) topicData.isPinned = isPinned;
      if (isLocked) topicData.isLocked = isLocked;
      if (isAdminPost) topicData.isAdminPost = isAdminPost;
    }

    const newTopic = await ForumTopic.create(topicData);

    const populatedTopic = await ForumTopic.findById(newTopic._id)
      .populate("author", "name profilePicture")
      .populate("category", "name");

    res.status(201).json(populatedTopic);
  } catch (error) {
    next(error);
  }
});

// UPDATE a topic
router.put("/topics/:topicId", isAuthenticated, async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { content, title, isPinned, isLocked } = req.body;
    const userId = req.payload._id;

    const topic = await ForumTopic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const userIsAdmin = await isAdmin(userId);
    const isOwner = topic.author.toString() === userId;

    if (!isOwner && !userIsAdmin) {
      return res.status(403).json({
        message: "You don't have permission to edit this topic",
      });
    }

    const updates = {};
    if (content !== undefined) updates.content = content;
    if (title !== undefined) updates.title = title;

    if (userIsAdmin) {
      if (isPinned !== undefined) updates.isPinned = isPinned;
      if (isLocked !== undefined) updates.isLocked = isLocked;
    }

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

router.put("/topics/:topicId/pin", isAuthenticated, async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { isPinned } = req.body;
    const userId = req.payload._id;

    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const topic = await ForumTopic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const pinStatus = isPinned !== undefined ? isPinned : !topic.isPinned;

    const updatedTopic = await ForumTopic.findByIdAndUpdate(
      topicId,
      { isPinned: pinStatus },
      { new: true }
    );

    res.status(200).json(updatedTopic);
  } catch (error) {
    next(error);
  }
});

router.put("/topics/:topicId/lock", isAuthenticated, async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { isLocked } = req.body;
    const userId = req.payload._id;

    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const topic = await ForumTopic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const lockStatus = isLocked !== undefined ? isLocked : !topic.isLocked;

    const updatedTopic = await ForumTopic.findByIdAndUpdate(
      topicId,
      { isLocked: lockStatus },
      { new: true }
    );

    res.status(200).json(updatedTopic);
  } catch (error) {
    next(error);
  }
});

// DELETE a topic
router.delete("/topics/:topicId", isAuthenticated, async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const userId = req.payload._id;

    const topic = await ForumTopic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const userIsAdmin = await isAdmin(userId);
    const isOwner = topic.author.toString() === userId;

    if (!isOwner && !userIsAdmin) {
      return res.status(403).json({
        message: "You don't have permission to delete this topic",
      });
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
        const userIsAdmin = await isAdmin(author);
        if (!userIsAdmin) {
          return res.status(403).json({
            message:
              "This topic is locked and can only be replied to by admins",
          });
        }
      }

      const replyData = {
        content,
        author,
        topic: topicId,
      };

      const userIsAdmin = await isAdmin(author);
      if (userIsAdmin) {
        replyData.isAdminReply = true;
      }

      const newReply = await ForumReply.create(replyData);

      await ForumTopic.findByIdAndUpdate(topicId, {
        lastActivity: new Date(),
      });

      const populatedReply = await ForumReply.findById(newReply._id).populate(
        "author",
        "name profilePicture isAdmin"
      );

      res.status(201).json(populatedReply);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE  reply
router.delete("/replies/:replyId", isAuthenticated, async (req, res, next) => {
  try {
    const { replyId } = req.params;
    const userId = req.payload._id;

    const reply = await ForumReply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    const userIsAdmin = await isAdmin(userId);
    const isOwner = reply.author.toString() === userId;

    if (!isOwner && !userIsAdmin) {
      return res.status(403).json({
        message: "You don't have permission to delete this reply",
      });
    }

    await ForumReply.findByIdAndDelete(replyId);

    // activity timestamp
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

// follow/unfollow a topic
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

// like/unlike a reply
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
