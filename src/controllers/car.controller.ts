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

async function getCarsPage(req: Request, res: Response) {
  const search =
    typeof req.query.search === "string" ? req.query.search : undefined;

  const sort =
    typeof req.query.sort === "string" ? req.query.sort : undefined;

  const minPrice =
    typeof req.query.minPrice === "string" && req.query.minPrice !== ""
      ? Number(req.query.minPrice)
      : undefined;

  const maxPrice =
    typeof req.query.maxPrice === "string" && req.query.maxPrice !== ""
      ? Number(req.query.maxPrice)
      : undefined;

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

  res.render("cars/detail", { car });
}

async function getMyCarsPage(req: Request, res: Response) {
  const cars = await getCarsByUserId(req.session.user!.id);

  res.render("cars/my-cars", { cars });
}

function getCreateCarPage(req: Request, res: Response) {
  res.render("cars/form", {
    mode: "create",
    car: null,
    errors: [],
    formData: {},
  });
}

async function postCreateCar(req: Request, res: Response) {
  const parsed = carSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).render("cars/form", {
      mode: "create",
      car: null,
      errors: parsed.error.issues,
      formData: req.body,
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
      formData: req.body,
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

  res.render("cars/form", {
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
    },
  });
}

async function postEditCar(req: Request, res: Response) {
  const carId = Number(req.params.id);
  const parsed = carSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).render("cars/form", {
      mode: "edit",
      car: { car_id: carId },
      errors: parsed.error.issues,
      formData: req.body,
    });
  }

  try {
    await updateCar(
      carId,
      parsed.data,
      req.session.user!.id,
      req.session.user!.isAdmin,
    );

    return res.redirect("/my-cars");
  } catch (error) {
    return res.status(400).render("cars/form", {
      mode: "edit",
      car: { car_id: carId },
      errors: [{ message: error instanceof Error ? error.message : "Unknown error" }],
      formData: req.body,
    });
  }
}

async function postDeleteCar(req: Request, res: Response) {
  const carId = Number(req.params.id);

  try {
    await deleteCar(
      carId,
      req.session.user!.id,
      req.session.user!.isAdmin,
    );

    return res.redirect("/my-cars");
  } catch (error) {
    return res.status(400).send(
      error instanceof Error ? error.message : "Unknown error",
    );
  }
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
};