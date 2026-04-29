import express from "express";
import { protectRoutes } from "../middleware/protect-routes.middleware.js";
import {
  getHomePage,
  getAboutPage,
  getContactPage,
  postContactPage,
  getJournalPage,
  getJournalDetailPage,
  postJournalComment,
} from "../controllers/public.controller.js";

const router = express.Router();

router.get("/", getHomePage);
router.get("/about", getAboutPage);
router.get("/contact", getContactPage);
router.post("/contact", postContactPage);
router.get("/journal", getJournalPage);
router.get("/journal/:slug", getJournalDetailPage);

router.post("/journal/:slug/comments", protectRoutes, postJournalComment);


export default router;
