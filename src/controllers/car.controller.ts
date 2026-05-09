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
import { uploadImageToStorage } from "../lib/supabase-storage.js";

type UploadedFieldMap = Partial<Record<"imageFile" | "galleryImageFiles", Express.Multer.File[]>>;

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

function getUploadedFiles(req: Request): UploadedFieldMap {
  return ((req.files ?? {}) as UploadedFieldMap);
}

function buildYearOptions() {
  const currentYear = new Date().getFullYear() + 1;
  return Array.from({ length: currentYear - 1960 + 1 }, (_, index) => currentYear - index);
}

function buildFormData(body: Record<string, unknown>) {
  return {
    ...body,
    galleryImages: sanitizeGalleryImages(body.galleryImages).join("\n"),
  };
}

async function resolveCarImages(
  req: Request,
  body: Record<string, unknown>,
  existing?: { image?: string; galleryImages?: string[] },
) {
  const uploadedFiles = getUploadedFiles(req);
  const imageFromBody = typeof body.image === "string" ? body.image.trim() : "";
  const galleryFromBody = sanitizeGalleryImages(body.galleryImages);

  const uploadedMainImage = uploadedFiles.imageFile?.[0]
    ? await uploadImageToStorage(uploadedFiles.imageFile[0], "cars/main")
    : null;

  const uploadedGalleryImages = uploadedFiles.galleryImageFiles?.length
    ? await Promise.all(
        uploadedFiles.galleryImageFiles.map((file) => uploadImageToStorage(file, "cars/gallery")),
      )
    : [];

  return {
    image: uploadedMainImage || imageFromBody || existing?.image || "",
    galleryImages: [...galleryFromBody, ...uploadedGalleryImages].filter(Boolean),
  };
}

function renderCarForm(
  res: Response,
  options: {
    mode: "create" | "edit";
    car: unknown;
    errors: Array<{ message: string }> | readonly { message: string }[];
    formData: Record<string, unknown>;
    status?: number;
  },
) {
  const renderer = () =>
    res.render("cars/form", {
      mode: options.mode,
      car: options.car,
      errors: options.errors,
      formData: options.formData,
      yearOptions: buildYearOptions(),
    });

  if (options.status) {
    return res.status(options.status).render("cars/form", {
      mode: options.mode,
      car: options.car,
      errors: options.errors,
      formData: options.formData,
      yearOptions: buildYearOptions(),
    });
  }

  return renderer();
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
      image: "",
    },
    yearOptions: buildYearOptions(),
  });
}

async function postCreateCar(req: Request, res: Response) {
  const basePayload = {
    ...(req.body as Record<string, unknown>),
    galleryImages: sanitizeGalleryImages((req.body as Record<string, unknown>).galleryImages),
  };

  const parsed = carSchema.safeParse(basePayload);

  if (!parsed.success) {
    return renderCarForm(res, {
      mode: "create",
      car: null,
      errors: parsed.error.issues,
      formData: buildFormData(req.body as Record<string, unknown>),
      status: 400,
    });
  }

  try {
    const resolvedImages = await resolveCarImages(req, req.body as Record<string, unknown>);

    if (!resolvedImages.image) {
      return renderCarForm(res, {
        mode: "create",
        car: null,
        errors: [{ message: "Add a main image URL or upload a main image file." }],
        formData: buildFormData(req.body as Record<string, unknown>),
        status: 400,
      });
    }

    await createCar({
      ...parsed.data,
      image: resolvedImages.image,
      galleryImages: resolvedImages.galleryImages,
    }, req.session.user!.id);

    return res.redirect("/my-cars");
  } catch (error) {
    return renderCarForm(res, {
      mode: "create",
      car: null,
      errors: [{ message: error instanceof Error ? error.message : "Unknown error" }],
      formData: buildFormData(req.body as Record<string, unknown>),
      status: 400,
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
  const existingCar = await getCarById(carId);

  if (!existingCar) {
    return res.status(404).send("Auto neexistuje");
  }

  const basePayload = {
    ...(req.body as Record<string, unknown>),
    galleryImages: sanitizeGalleryImages((req.body as Record<string, unknown>).galleryImages),
  };

  const parsed = carSchema.safeParse(basePayload);

  if (!parsed.success) {
    return renderCarForm(res, {
      mode: "edit",
      car: { car_id: carId },
      errors: parsed.error.issues,
      formData: buildFormData(req.body as Record<string, unknown>),
      status: 400,
    });
  }

  try {
    const resolvedImages = await resolveCarImages(req, req.body as Record<string, unknown>, existingCar);

    if (!resolvedImages.image) {
      return renderCarForm(res, {
        mode: "edit",
        car: { car_id: carId },
        errors: [{ message: "Add a main image URL or upload a main image file." }],
        formData: buildFormData(req.body as Record<string, unknown>),
        status: 400,
      });
    }

    await updateCar(
      carId,
      {
        ...parsed.data,
        image: resolvedImages.image,
        galleryImages: resolvedImages.galleryImages,
      },
      req.session.user!.id,
      req.session.user!.isAdmin,
    );

    return res.redirect("/my-cars");
  } catch (error) {
    return renderCarForm(res, {
      mode: "edit",
      car: { car_id: carId },
      errors: [{ message: error instanceof Error ? error.message : "Unknown error" }],
      formData: buildFormData(req.body as Record<string, unknown>),
      status: 400,
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
