const{ Notification} = require( "../models/notificationModel");

// Fetch all notifications for the logged-in user
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user:  req.userId })
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications." });
  }
};

// Mark a specific notification as seen
const markAsSeen = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    if (notification.user.toString() !==  req.userId.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }

    notification.seen = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: "Failed to update notification." });
  }
};

module.exports = {getNotifications,markAsSeen

  };