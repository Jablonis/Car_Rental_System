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

export {
  getAdminUsers,
  getCreateUser,
  postCreateUser,
  getEditUser,
  postEditUser,
  postDeleteUser,
};