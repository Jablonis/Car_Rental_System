import { Request, Response } from "express";
import User from "../models/user.model.js";
import { loginSchema, signupSchema } from "../validators/user.validator.js";

function getSignupPage(req: Request, res: Response) {
  res.render("auth/signup", {
    errors: [],
    formData: {},
  });
}

async function signup(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).render("auth/signup", {
      errors: parsed.error.issues,
      formData: req.body,
    });
  }

  const existingUser = await User.findByEmail(parsed.data.email);

  if (existingUser) {
    return res.status(400).render("auth/signup", {
      errors: [{ message: "Používateľ s týmto emailom už existuje" }],
      formData: req.body,
    });
  }

  const user = new User({
    name: parsed.data.name,
    email: parsed.data.email,
    password: parsed.data.password,
  });

  await user.save();

  return res.redirect("/login");
}

function getLoginPage(req: Request, res: Response) {
  res.render("auth/login", {
    errors: [],
    formData: {},
  });
}

async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).render("auth/login", {
      errors: parsed.error.issues,
      formData: req.body,
    });
  }

  const user = await User.findByEmail(parsed.data.email);

  if (!user) {
    return res.status(400).render("auth/login", {
      errors: [{ message: "Nesprávny email alebo heslo" }],
      formData: req.body,
    });
  }

  const isValidPassword = await User.verifyPassword(
    parsed.data.password,
    user.password,
  );

  if (!isValidPassword) {
    return res.status(400).render("auth/login", {
      errors: [{ message: "Nesprávny email alebo heslo" }],
      formData: req.body,
    });
  }

req.session.isAuthenticated = true;
req.session.user = {
  id: user.user_id!,
  name: user.name,
  email: user.email,
  isAdmin: user.isAdmin,
};

req.session.save((err) => {
  if (err) {
    return res.status(500).send("Nepodarilo sa uložiť session.");
  }

  return res.redirect("/");
});
}

function logout(req: Request, res: Response) {
  req.session.destroy(() => {
    res.redirect("/");
  });
}

export {
  getSignupPage,
  signup,
  getLoginPage,
  login,
  logout,
};