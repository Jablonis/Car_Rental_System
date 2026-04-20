import { Request, Response, NextFunction } from "express";

function protectRoutes(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  next();
}

export { protectRoutes };