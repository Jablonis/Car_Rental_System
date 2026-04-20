import express from "express";
import { checkAdmin } from "../middleware/check-admin.middleware.js";
import {
  getAdminUsers,
  getCreateUser,
  postCreateUser,
  getEditUser,
  postEditUser,
  postDeleteUser,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/admin/users", getAdminUsers);
router.get("/admin/users/new", getCreateUser);
router.post("/admin/users/new", postCreateUser);
router.get("/admin/users/:id/edit", getEditUser);
router.post("/admin/users/:id/edit", postEditUser);
router.post("/admin/users/:id/delete", postDeleteUser);

export default router;