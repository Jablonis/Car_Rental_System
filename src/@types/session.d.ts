import "express-session";

declare module "express-session" {
  interface SessionData {
    isAuthenticated: boolean;
    user: {
      id: number;
      name: string;
      email: string;
      isAdmin: boolean;
      avatar?: string | null;
    } | null;
  }
}
