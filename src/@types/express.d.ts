declare namespace Express {
  export interface Locals {
    isAuthenticated: boolean;
    isAdmin: boolean;
    user: {
      id: number;
      name: string;
      email: string;
      isAdmin: boolean;
    } | null;
  }
}