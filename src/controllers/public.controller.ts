import { Request, Response } from "express";
import { z } from "zod";
import Car from "../models/car.model.js";
import Blog from "../models/blog.model.js";
import ContactInquiry from "../models/contact-inquiry.model.js";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Email address is invalid"),
  car: z.string().trim().optional(),
  message: z.string().trim().min(1, "Message is required"),
});

async function getHomePage(req: Request, res: Response) {
  const [latestCars, latestBlogs] = await Promise.all([
    Car.findLatestWithOwner(8),
    Blog.findLatest(3),
  ]);

  res.render("public/index", {
    latestCars,
    latestBlogs,
  });
}

async function getAboutPage(req: Request, res: Response) {
  const latestBlogs = await Blog.findLatest(3);

  res.render("public/about", {
    latestBlogs,
  });
}

async function getContactPage(req: Request, res: Response) {
  const cars = await Car.findAll(undefined, "year_desc");

  res.render("public/contact", {
    cars,
    success: req.query.sent === "1",
    errors: [],
    formData: {
      name: "",
      email: "",
      car: typeof req.query.focus === "string" ? req.query.focus : "",
      message: "",
    },
  });
}

async function postContactPage(req: Request, res: Response) {
  const parsed = contactSchema.safeParse(req.body);
  const cars = await Car.findAll(undefined, "year_desc");

  if (!parsed.success) {
    return res.status(400).render("public/contact", {
      cars,
      success: false,
      errors: parsed.error.issues,
      formData: req.body,
    });
  }

  await ContactInquiry.create({
    name: parsed.data.name,
    email: parsed.data.email,
    focus: parsed.data.car || null,
    message: parsed.data.message,
  });

  const focus = parsed.data.car ? `?sent=1&focus=${encodeURIComponent(parsed.data.car)}` : "?sent=1";
  return res.redirect(`/contact${focus}`);
}

async function getJournalPage(req: Request, res: Response) {
  const posts = await Blog.findAll();

  res.render("public/journal", {
    posts,
  });
}

async function getJournalDetailPage(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const post = await Blog.findBySlug(slug);

  if (!post) {
    return res.status(404).send("Journal entry not found");
  }

  const relatedPosts = (await Blog.findLatest(3)).filter((entry) => entry.slug !== post.slug).slice(0, 2);

  return res.render("public/journal-detail", {
    post,
    relatedPosts,
  });
}

export {
  getHomePage,
  getAboutPage,
  getContactPage,
  postContactPage,
  getJournalPage,
  getJournalDetailPage,
};
