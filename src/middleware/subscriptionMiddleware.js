export const isSubscribed = (req, res, next) => {
  // TODO: ENABLE SUBSCRIPTION CHECK LATER
  // if (!req.user?.isSubscribed) {
  //   return res.status(403).json({ message: "Subscription required" });
  // }

  next(); // allow all users for now
};