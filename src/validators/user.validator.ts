import { z } from "zod";

const signupSchema = z
  .object({
    name: z.string().min(1, "Meno je povinné"),
    email: z.string().email("Neplatný email"),
    password: z.string().min(6, "Heslo musí mať aspoň 6 znakov"),
    confirmPassword: z.string().min(6, "Potvrdenie hesla je povinné"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Heslá sa nezhodujú",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().email("Neplatný email"),
  password: z.string().min(1, "Heslo je povinné"),
});

type SignupData = z.infer<typeof signupSchema>;
type LoginData = z.infer<typeof loginSchema>;

const adminCreateUserSchema = z.object({
  name: z.string().min(1, "Meno je povinné"),
  email: z.string().email("Neplatný email"),
  password: z.string().min(6, "Heslo musí mať aspoň 6 znakov"),
  isAdmin: z.union([z.literal("0"), z.literal("1")]),
});

const adminUpdateUserSchema = z.object({
  name: z.string().min(1, "Meno je povinné"),
  email: z.string().email("Neplatný email"),
  isAdmin: z.union([z.literal("0"), z.literal("1")]),
});

type AdminCreateUserData = z.infer<typeof adminCreateUserSchema>;
type AdminUpdateUserData = z.infer<typeof adminUpdateUserSchema>;

export {
  signupSchema,
  loginSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
};

export type {
  SignupData,
  LoginData,
  AdminCreateUserData,
  AdminUpdateUserData,
};