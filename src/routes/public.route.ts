import express from "express";
import {
  getHomePage,
  getAboutPage,
  getContactPage,
  getJournalPage,
  getJournalDetailPage,
} from "../controllers/public.controller.js";

const router = express.Router();

router.get("/", getHomePage);
router.get("/about", getAboutPage);
router.get("/contact", getContactPage);
router.get("/journal", getJournalPage);
router.get("/journal/:slug", getJournalDetailPage);

export default router;
