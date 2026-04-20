import { Request, Response, NextFunction } from "express";

function checkAuthStatus(req: Request, res: Response, next: NextFunction) {
  res.locals.isAuthenticated = Boolean(req.session.user);
  res.locals.user = req.session.user ?? null;
  res.locals.isAdmin = Boolean(req.session.user?.isAdmin);

  next();
}

export { checkAuthStatus };