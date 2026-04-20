import { Request, Response, NextFunction } from "express";

function checkAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).redirect("/login");
  }

  if (!req.session.user.isAdmin) {
    return res.status(403).send("Nemáš prístup do admin sekcie.");
  }

  next();
}

export { checkAdmin };