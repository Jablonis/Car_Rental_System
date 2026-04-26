import { Request, Response } from "express";
import Car from "../models/car.model.js";
import Blog from "../models/blog.model.js";

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

function getContactPage(req: Request, res: Response) {
  res.render("public/contact");
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
  getJournalPage,
  getJournalDetailPage,
};
