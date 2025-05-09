import express from "express";
import {
  getNotifications,
  markAsSeen,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/",  getNotifications);
router.put("/:id/seen",  markAsSeen);

export default router;
