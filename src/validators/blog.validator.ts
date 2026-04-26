import { z } from "zod";

const blogSchema = z.object({
  title: z.string().trim().min(3, "Title must have at least 3 characters"),
  excerpt: z.string().trim().min(12, "Excerpt must have at least 12 characters").max(240, "Excerpt must be shorter than 240 characters"),
  content: z.string().trim().min(30, "Content must have at least 30 characters"),
  image: z.string().trim().url("Image must be a valid URL").or(z.string().trim().startsWith("/", "Image must start with / or be a valid URL")).optional().transform((value) => value || "/assets/img/ritual.jpeg"),
});

export { blogSchema };
