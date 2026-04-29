import express from "express";
import { checkAdmin } from "../middleware/check-admin.middleware.js";
import {
  getAdminUsers,
  getCreateUser,
  postCreateUser,
  getEditUser,
  postEditUser,
  postDeleteUser,
  getAdminCars,
  getAdminBlogs,
  getCreateBlog,
  postCreateBlog,
  getEditBlog,
  postEditBlog,
  postDeleteBlog,
  getAdminComments,
  postUpdateCommentStatus,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/admin/users", checkAdmin, getAdminUsers);
router.get("/admin/users/new", checkAdmin, getCreateUser);
router.post("/admin/users/new", checkAdmin, postCreateUser);
router.get("/admin/users/:id/edit", checkAdmin, getEditUser);
router.post("/admin/users/:id/edit", checkAdmin, postEditUser);
router.post("/admin/users/:id/delete", checkAdmin, postDeleteUser);

router.get("/admin/cars", checkAdmin, getAdminCars);

router.get("/admin/blogs", checkAdmin, getAdminBlogs);
router.get("/admin/blogs/new", checkAdmin, getCreateBlog);
router.post("/admin/blogs/new", checkAdmin, postCreateBlog);
router.get("/admin/blogs/:id/edit", checkAdmin, getEditBlog);
router.post("/admin/blogs/:id/edit", checkAdmin, postEditBlog);
router.post("/admin/blogs/:id/delete", checkAdmin, postDeleteBlog);

router.get("/admin/comments", checkAdmin, getAdminComments);
router.post("/admin/comments/:id/status", checkAdmin, postUpdateCommentStatus);


export default router;
