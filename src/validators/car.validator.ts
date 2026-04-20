import { z } from "zod";

const carSchema = z.object({
  title: z.string().min(1, "Názov auta je povinný"),
  brand: z.string().min(1, "Značka je povinná"),
  model: z.string().min(1, "Model je povinný"),
  year: z.coerce
    .number()
    .int("Rok musí byť celé číslo")
    .min(1900, "Rok je príliš nízky")
    .max(new Date().getFullYear() + 1, "Rok je príliš vysoký"),
  price: z.coerce
    .number()
    .min(0, "Cena musí byť 0 alebo viac"),
  mileage: z.coerce
    .number()
    .int("Najazdené km musia byť celé číslo")
    .min(0, "Najazdené km musia byť 0 alebo viac"),
  fuel: z.string().min(1, "Palivo je povinné"),
  transmission: z.string().min(1, "Prevodovka je povinná"),
  description: z.string().min(1, "Popis je povinný"),
  image: z.string().min(1, "Obrázok je povinný"),
});

type CarData = z.infer<typeof carSchema>;

export { carSchema };
export type { CarData };