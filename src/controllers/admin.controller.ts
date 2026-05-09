import { Request, Response } from "express";
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
} from "../validators/user.validator.js";
import {
  getAllUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getUserById,
} from "../services/admin-user.service.js";
import Car from "../models/car.model.js";
import Blog from "../models/blog.model.js";
import { blogSchema } from "../validators/blog.validator.js";
import BlogComment, { BlogCommentStatus } from "../models/blog-comment.model.js";
import { uploadImageToStorage } from "../lib/supabase-storage.js";

type BlogUploadMap = Partial<Record<"imageFile", Express.Multer.File[]>>;

function getBlogUpload(req: Request): BlogUploadMap {
  return ((req.files ?? {}) as BlogUploadMap);
}

function renderBlogForm(
  res: Response,
  options: {
    mode: "create" | "edit";
    post: Blog | { blog_id: number } | null;
    errors: Array<{ message: string }> | readonly { message: string }[];
    formData: Record<string, unknown>;
    status?: number;
  },
) {
  return res.status(options.status ?? 200).render("admin/blog-form", {
    mode: options.mode,
    post: options.post,
    errors: options.errors,
    formData: options.formData,
  });
}

async function getAdminUsers(req: Request, res: Response) {
  const search =
    typeof req.query.search === "string" ? req.query.search : undefined;

  const users = await getAllUsers(search);

  res.render("admin/users", {
    users,
    search: search ?? "",
    deleteError: null,
  });
}

function getCreateUser(req: Request, res: Response) {
  res.render("admin/user-form", {
    mode: "create",
    user: null,
    errors: [],
    formData: {
      name: "",
      email: "",
      password: "",
      isAdmin: "0",
    },
  });
}

async function postCreateUser(req: Request, res: Response) {
  const parsed = adminCreateUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).render("admin/user-form", {
      mode: "create",
      user: null,
      errors: parsed.error.issues,
      formData: req.body,
    });
  }

  try {
    await createAdminUser(parsed.data);

    return res.redirect("/admin/users");
  } catch (error) {
    return res.status(400).render("admin/user-form", {
      mode: "create",
      user: null,
      errors: [{ message: error instanceof Error ? error.message : "Unknown error" }],
      formData: req.body,
    });
  }
}

async function getEditUser(req: Request, res: Response) {
  const userId = Number(req.params.id);
  const user = await getUserById(userId);

  if (!user) {
    return res.status(404).send("Používateľ neexistuje");
  }

  res.render("admin/user-form", {
    mode: "edit",
    user,
    errors: [],
    formData: {
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin ? "1" : "0",
    },
  });
}

async function postEditUser(req: Request, res: Response) {
  const userId = Number(req.params.id);
  const parsed = adminUpdateUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).render("admin/user-form", {
      mode: "edit",
      user: { user_id: userId },
      errors: parsed.error.issues,
      formData: req.body,
    });
  }

  try {
    await updateAdminUser(userId, parsed.data, req.session.user!.id);

    return res.redirect("/admin/users");
  } catch (error) {
    return res.status(400).render("admin/user-form", {
      mode: "edit",
      user: { user_id: userId },
      errors: [{ message: error instanceof Error ? error.message : "Unknown error" }],
      formData: req.body,
    });
  }
}

async function postDeleteUser(req: Request, res: Response) {
  const userId = Number(req.params.id);

  try {
    await deleteAdminUser(userId, req.session.user!.id);
    return res.redirect("/admin/users");
  } catch (error) {
    const users = await getAllUsers();

    return res.status(400).render("admin/users", {
      users,
      search: "",
      deleteError: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function getAdminCars(req: Request, res: Response) {
  const cars = await Car.findAll();

  return res.render("admin/cars", {
    cars,
  });
}

async function getAdminBlogs(req: Request, res: Response) {
  const posts = await Blog.findAll();
  return res.render("admin/blogs", { posts });
}

function getCreateBlog(req: Request, res: Response) {
  return res.render("admin/blog-form", {
    mode: "create",
    post: null,
    errors: [],
    formData: {
      title: "",
      excerpt: "",
      content: "",
      image: "/assets/img/ritual.jpeg",
    },
  });
}

async function postCreateBlog(req: Request, res: Response) {
  const parsed = blogSchema.safeParse(req.body);

  if (!parsed.success) {
    return renderBlogForm(res, {
      mode: "create",
      post: null,
      errors: parsed.error.issues,
      formData: req.body as Record<string, unknown>,
      status: 400,
    });
  }

  try {
    const uploadedImage = getBlogUpload(req).imageFile?.[0]
      ? await uploadImageToStorage(getBlogUpload(req).imageFile![0], "blogs")
      : null;

    const post = new Blog({
      ...parsed.data,
      image: uploadedImage || parsed.data.image || "/assets/img/ritual.jpeg",
    });
    await post.save();

    return res.redirect("/admin/blogs");
  } catch (error) {
    return renderBlogForm(res, {
      mode: "create",
      post: null,
      errors: [{ message: error instanceof Error ? error.message : "Unknown error" }],
      formData: req.body as Record<string, unknown>,
      status: 400,
    });
  }
}

async function getEditBlog(req: Request, res: Response) {
  const blogId = Number(req.params.id);
  const post = await Blog.findById(blogId);

  if (!post) {
    return res.status(404).send("Journal entry not found");
  }

  return res.render("admin/blog-form", {
    mode: "edit",
    post,
    errors: [],
    formData: {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      image: post.image,
    },
  });
}

async function postEditBlog(req: Request, res: Response) {
  const blogId = Number(req.params.id);
  const post = await Blog.findById(blogId);

  if (!post) {
    return res.status(404).send("Journal entry not found");
  }

  const parsed = blogSchema.safeParse(req.body);

  if (!parsed.success) {
    return renderBlogForm(res, {
      mode: "edit",
      post,
      errors: parsed.error.issues,
      formData: req.body as Record<string, unknown>,
      status: 400,
    });
  }

  try {
    const uploadedImage = getBlogUpload(req).imageFile?.[0]
      ? await uploadImageToStorage(getBlogUpload(req).imageFile![0], "blogs")
      : null;

    post.title = parsed.data.title;
    post.excerpt = parsed.data.excerpt;
    post.content = parsed.data.content;
    post.image = uploadedImage || parsed.data.image || post.image;
    await post.save();

    return res.redirect("/admin/blogs");
  } catch (error) {
    return renderBlogForm(res, {
      mode: "edit",
      post,
      errors: [{ message: error instanceof Error ? error.message : "Unknown error" }],
      formData: req.body as Record<string, unknown>,
      status: 400,
    });
  }
}

async function postDeleteBlog(req: Request, res: Response) {
  const blogId = Number(req.params.id);
  await Blog.deleteById(blogId);
  return res.redirect("/admin/blogs");
}


async function getAdminComments(req: Request, res: Response) {
  const status = typeof req.query.status === "string" && ["pending", "approved", "declined"].includes(req.query.status)
    ? (req.query.status as BlogCommentStatus)
    : undefined;

  const [comments, pendingCount, approvedCount, declinedCount] = await Promise.all([
    BlogComment.findAllForAdmin(status),
    BlogComment.countByStatus("pending"),
    BlogComment.countByStatus("approved"),
    BlogComment.countByStatus("declined"),
  ]);

  return res.render("admin/comments", {
    comments,
    status: status ?? "",
    counts: { pending: pendingCount, approved: approvedCount, declined: declinedCount },
  });
}

async function postUpdateCommentStatus(req: Request, res: Response) {
  const commentId = Number(req.params.id);
  const status = typeof req.body.status === "string" && ["approved", "declined"].includes(req.body.status)
    ? (req.body.status as BlogCommentStatus)
    : null;

  if (!status) {
    return res.status(400).send("Invalid status");
  }

  await BlogComment.updateStatus(commentId, status);
  return res.redirect("/admin/comments");
}

export {
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
};
