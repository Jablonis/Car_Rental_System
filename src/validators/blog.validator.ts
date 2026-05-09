import { z } from "zod";

const blogSchema = z.object({
  title: z.string().trim().min(3, "Title must have at least 3 characters"),
  excerpt: z.string().trim().min(12, "Excerpt must have at least 12 characters").max(240, "Excerpt must be shorter than 240 characters"),
  content: z.string().trim().min(30, "Content must have at least 30 characters"),
  image: z
    .string()
    .trim()
    .refine((value) => value === "" || value.startsWith("/") || /^https?:\/\//i.test(value), {
      message: "Image must be a valid URL or start with /",
    })
    .transform((value) => value || ""),
});

export { blogSchema };
