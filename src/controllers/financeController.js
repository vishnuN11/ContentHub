import finance from "../models/Finance.js";

/* CREATE POST */
export const createHealth = async (req, res) => {
  try {
    const { title, description, category, lang } = req.body;

    if (!title || !description || !lang) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const post = await finance.create({
      title,
      description,
      category,
      lang,
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* GET POSTS BY LANGUAGE */
export const getHealth = async (req, res) => {
  try {
    const lang = req.query.lang || "en";

    const posts = await finance.find({ lang })
      .sort({ createdAt: -1 });

    const formatted = posts.map((p) => ({
      _id: p._id,
      title: p.title?.[lang] || "",
      description: p.description?.[lang] || "",
      category: p.category,
      likesCount: p.likes.length,
      createdAt: p.createdAt,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleLike = async (req, res) => {
  const post = await finance.findById(req.params.id);

  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: "Login required" });

  const alreadyLiked = post.likes.includes(userId);

  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
  } else {
    post.likes.push(userId);
  }

  await post.save();

  res.json({
    likesCount: post.likes.length,
  });
};
