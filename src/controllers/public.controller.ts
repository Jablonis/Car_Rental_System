import { Request, Response } from "express";

function getHomePage(req: Request, res: Response) {
  res.render("public/index");
}

function getAboutPage(req: Request, res: Response) {
  res.render("public/about");
}

function getContactPage(req: Request, res: Response) {
  res.render("public/contact");
}

// function getCarsPage(req: Request, res: Response) {
//   res.render("cars/index");
// }

export {
  getHomePage,
  getAboutPage,
  getContactPage,
  // getCarsPage,
};