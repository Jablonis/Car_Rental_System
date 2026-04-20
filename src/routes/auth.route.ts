import express from "express";
import {
  getSignupPage,
  signup,
  getLoginPage,
  login,
  logout,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/signup", getSignupPage);
router.post("/signup", signup);

router.get("/login", getLoginPage);
router.post("/login", login);

router.post("/logout", logout);

export default router;