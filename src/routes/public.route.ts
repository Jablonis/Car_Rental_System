import express from "express";
import {
  getHomePage,
  getAboutPage,
  getContactPage,
  // getCarsPage,
} from "../controllers/public.controller.js";

const router = express.Router();

router.get("/", getHomePage);
router.get("/about", getAboutPage);
router.get("/contact", getContactPage);
// router.get("/cars", getCarsPage);

export default router;