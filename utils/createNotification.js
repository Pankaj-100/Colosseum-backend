const Notification = require("../models/notificationModel");

// System-generated notification
const createNotification = async ({ userId, title, description }) => {
  try {
    await Notification.create({
      user: userId,
      title,
      description,
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
};

module.exports={ createNotification}
