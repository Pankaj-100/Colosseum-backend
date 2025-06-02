const { Notification } = require("../models/notificationModel");

const createNotification = async ({ userId, title, description }) => {
  try {
    await Notification.create({
      user: userId,
      title,
      description,
    });
  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

module.exports = createNotification;
