import { z } from "zod";

const imageField = z
  .string()
  .trim()
  .refine((value) => value === "" || value.startsWith("/") || /^https?:\/\//i.test(value), {
    message: "Obrázok musí byť platná URL alebo cesta začínajúca /",
  })
  .transform((value) => value || "");

const carSchema = z.object({
  title: z.string().trim().min(1, "Názov je povinný"),
  brand: z.string().trim().min(1, "Značka je povinná"),
  model: z.string().trim().min(1, "Model je povinný"),
  year: z.coerce
    .number()
    .int("Rok musí byť celé číslo")
    .min(1900, "Rok je príliš nízky")
    .max(new Date().getFullYear() + 1, "Rok je príliš vysoký"),
  price: z.coerce.number().min(0, "Cena musí byť 0 alebo viac"),
  mileage: z.coerce
    .number()
    .int("Najazdené km musia byť celé číslo")
    .min(0, "Najazdené km musia byť 0 alebo viac"),
  fuel: z.enum(["Diesel", "Gasoline"], { message: "Vyber palivo" }),
  transmission: z.enum(["Manual", "Automatic", "Semi-automatic"], { message: "Vyber prevodovku" }),
  description: z.string().trim().min(1, "Popis je povinný"),
  image: imageField.optional().default(""),
  galleryImages: z.array(z.string().trim()).default([]),
});

type CarData = z.infer<typeof carSchema>;

export { carSchema };
export type { CarData };
