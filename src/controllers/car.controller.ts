import { Request, Response } from "express";
import { carSchema } from "../validators/car.validator.js";
import {
  getAllCars,
  getCarById,
  getCarsByUserId,
  createCar,
  updateCar,
  deleteCar,
} from "../services/car.service.js";
import User from "../models/user.model.js";

function sanitizeGalleryImages(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw
      .split(/\r?\n|,/) 
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function buildCarPayload(body: Record<string, unknown>) {
  return {
    ...body,
    galleryImages: sanitizeGalleryImages(body.galleryImages),
  };
}

function buildYearOptions() {
  const currentYear = new Date().getFullYear() + 1;
  return Array.from({ length: currentYear - 1960 + 1 }, (_, index) => currentYear - index);
}

async function getCarsPage(req: Request, res: Response) {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
  const minPrice = typeof req.query.minPrice === "string" && req.query.minPrice !== "" ? Number(req.query.minPrice) : undefined;
  const maxPrice = typeof req.query.maxPrice === "string" && req.query.maxPrice !== "" ? Number(req.query.maxPrice) : undefined;

  const cars = await getAllCars(search, sort, minPrice, maxPrice);

  res.render("cars/index", {
    cars,
    search: search ?? "",
    sort: sort ?? "",
    minPrice: req.query.minPrice ?? "",
    maxPrice: req.query.maxPrice ?? "",
  });
}

async function getCarDetailPage(req: Request, res: Response) {
  const carId = Number(req.params.id);
  const car = await getCarById(carId);

  if (!car) {
    return res.status(404).send("Auto neexistuje");
  }

  return res.render("cars/detail", { car });
}

async function getMyCarsPage(req: Request, res: Response) {
  const [cars, user] = await Promise.all([
    getCarsByUserId(req.session.user!.id),
    User.findById(req.session.user!.id),
  ]);

  return res.render("cars/my-cars", {
    cars,
    profileUser: user,
    avatarSaved: req.query.avatar === "saved",
  });
}

function getCreateCarPage(req: Request, res: Response) {
  return res.render("cars/form", {
    mode: "create",
    car: null,
    errors: [],
    formData: {
      fuel: "Gasoline",
      transmission: "Automatic",
      galleryImages: "",
    },
    yearOptions: buildYearOptions(),
  });
}

async function postCreateCar(req: Request, res: Response) {
  const payload = buildCarPayload(req.body as Record<string, unknown>);
  const parsed = carSchema.safeParse(payload);

  if (!parsed.success) {
    return res.status(400).render("cars/form", {
      mode: "create",
      car: null,
      errors: parsed.error.issues,
      formData: {
        ...req.body,
        galleryImages: sanitizeGalleryImages((req.body as Record<string, unknown>).galleryImages).join("\n"),
      },
      yearOptions: buildYearOptions(),
    });
  }

  try {
    await createCar(parsed.data, req.session.user!.id);
    return res.redirect("/my-cars");
  } catch (error) {
    return res.status(400).render("cars/form", {
      mode: "create",
      car: null,
      errors: [{ message: error instanceof Error ? error.message : "Unknown error" }],
      formData: {
        ...req.body,
        galleryImages: sanitizeGalleryImages((req.body as Record<string, unknown>).galleryImages).join("\n"),
      },
      yearOptions: buildYearOptions(),
    });
  }
}

async function getEditCarPage(req: Request, res: Response) {
  const carId = Number(req.params.id);
  const car = await getCarById(carId);

  if (!car) {
    return res.status(404).send("Auto neexistuje");
  }

  if (!req.session.user!.isAdmin && car.user_id !== req.session.user!.id) {
    return res.status(403).send("Nemáš prístup");
  }

  return res.render("cars/form", {
    mode: "edit",
    car,
    errors: [],
    formData: {
      title: car.title,
      brand: car.brand,
      model: car.model,
      year: car.year,
      price: car.price,
      mileage: car.mileage,
      fuel: car.fuel,
      transmission: car.transmission,
      description: car.description,
      image: car.image,
      galleryImages: (car.galleryImages || []).join("\n"),
    },
    yearOptions: buildYearOptions(),
  });
}

async function postEditCar(req: Request, res: Response) {
  const carId = Number(req.params.id);
  const payload = buildCarPayload(req.body as Record<string, unknown>);
  const parsed = carSchema.safeParse(payload);

  if (!parsed.success) {
    return res.status(400).render("cars/form", {
      mode: "edit",
      car: { car_id: carId },
      errors: parsed.error.issues,
      formData: {
        ...req.body,
        galleryImages: sanitizeGalleryImages((req.body as Record<string, unknown>).galleryImages).join("\n"),
      },
      yearOptions: buildYearOptions(),
    });
  }

  try {
    await updateCar(carId, parsed.data, req.session.user!.id, req.session.user!.isAdmin);
    return res.redirect("/my-cars");
  } catch (error) {
    return res.status(400).render("cars/form", {
      mode: "edit",
      car: { car_id: carId },
      errors: [{ message: error instanceof Error ? error.message : "Unknown error" }],
      formData: {
        ...req.body,
        galleryImages: sanitizeGalleryImages((req.body as Record<string, unknown>).galleryImages).join("\n"),
      },
      yearOptions: buildYearOptions(),
    });
  }
}

async function postDeleteCar(req: Request, res: Response) {
  const carId = Number(req.params.id);

  try {
    await deleteCar(carId, req.session.user!.id, req.session.user!.isAdmin);
    return res.redirect("/my-cars");
  } catch (error) {
    return res.status(400).send(error instanceof Error ? error.message : "Unknown error");
  }
}

async function postUpdateAvatar(req: Request, res: Response) {
  const avatar = typeof req.body.avatar === "string" ? req.body.avatar.trim() : "";
  await User.updateAvatar(req.session.user!.id, avatar || null);

  const freshUser = await User.findById(req.session.user!.id);
  if (req.session.user && freshUser) {
    req.session.user.avatar = freshUser.avatar ?? null;
  }

  return res.redirect("/my-cars?avatar=saved");
}

export {
  getCarsPage,
  getCarDetailPage,
  getMyCarsPage,
  getCreateCarPage,
  postCreateCar,
  getEditCarPage,
  postEditCar,
  postDeleteCar,
  postUpdateAvatar,
};
