import Article from "../models/Article.js";

export const createArticle = async (req, res) => {
  const { title, description, language, author, date } = req.body;

  const article = new Article({
    title: { [language]: title },
    description: { [language]: description },
    author,
    date
  });

  await article.save();
  res.status(201).json({ message: "Article created" });
};

// export const getArticles = async (req, res) => {
//   const lang = req.query.lang || "mr";

//   const articles = await Article.find().select({
//     [`title.${lang}`]: 1,
//     [`description.${lang}`]: 1,
//     author: 1,
//     date: 1,
//     isPremium: 1
//   });

//   res.json(articles);
// };

export const getArticles = async (req, res) => {
  const lang = req.query.lang || "mr";

  const articles = await Article.find()
    .populate("comments.user", "_id name")
    .sort({ createdAt: -1 });

  const formattedArticles = articles.map(article => ({
    _id: article._id,
    title: article.title?.[lang] || "",
    description: article.description?.[lang] || "",
    author: article.author,
    date: article.date,
    isPremium: article.isPremium,

    // likes
    likesCount: article.likes?.length || 0,
    isLiked: article.likes?.includes(req.user?._id),

    // ✅ IMPORTANT
    comments: article.comments || [],
    commentsCount: article.comments?.length || 0
  }));

  res.json(formattedArticles);
};

export const getDemoArticles = async (req, res) => {
  const lang = req.query.lang || "mr";

  const articles = await Article.find()
    .populate("comments.user", "_id name")
    .sort({ createdAt: -1 })
    .limit(5); // 👈 ONLY FIRST 5

  const formattedArticles = articles.map(article => ({
    _id: article._id,
    title: article.title?.[lang] || "",
    description: article.description?.[lang] || "",
    author: article.author,
    date: article.date,
    isPremium: article.isPremium,

    // likes
    likesCount: article.likes?.length || 0,
    isLiked: article.likes?.includes(req.user?._id),

    // comments
    comments: article.comments || [],
    commentsCount: article.comments?.length || 0
  }));

  res.json(formattedArticles);
};


export const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Check article exists
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    // 2️⃣ Delete article
    await Article.findByIdAndDelete(id);

    // 3️⃣ Success response
    res.json({
      message: "Article deleted successfully",
      articleId: id,
    });
  } catch (error) {
    console.error("Delete article error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const addComment = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ message: "Comment is required" });
  }

  const article = await Article.findById(id);
  if (!article) {
    return res.status(404).json({ message: "Article not found" });
  }

  article.comments.push({
    user: req.user.id,
    text
  });

  await article.save();

  res.status(201).json({
    message: "Comment added",
    comments: article.comments
  });
}

export const getComments = async (req, res) => {
  const { id } = req.params;

  const article = await Article.findById(id)
    .select("comments")
    .populate("comments.user", "name email");

  if (!article) {
    return res.status(404).json({ message: "Article not found" });
  }

  res.json(article.comments);
};

export const deleteComment = async (req, res) => {
  const { articleId, commentId } = req.params;

  const article = await Article.findById(articleId);
  if (!article) {
    return res.status(404).json({ message: "Article not found" });
  }

  const comment = article.comments.id(commentId);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  if (
    comment.user.toString() !== req.user.id &&
    !req.user.isAdmin
  ) {
    return res.status(403).json({ message: "Not authorized" });
  }

  comment.deleteOne();
  await article.save();

  res.json({ message: "Comment deleted" });
};


export const toggleLike = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const article = await Article.findById(id);
  if (!article) {
    return res.status(404).json({ message: "Article not found" });
  }

  const alreadyLiked = article.likes.includes(userId);

  if (alreadyLiked) {
    // 🔁 UNLIKE
    article.likes = article.likes.filter(
      (uid) => uid.toString() !== userId
    );
  } else {
    // ❤️ LIKE
    article.likes.push(userId);
  }

  await article.save();

  res.json({
    liked: !alreadyLiked,
    totalLikes: article.likes.length
  });
};
