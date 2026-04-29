import Car from "../models/car.model.js";
import type { CarData } from "../validators/car.validator.js";

async function getAllCars(
  search?: string,
  sort?: string,
  minPrice?: number,
  maxPrice?: number,
) {
  return Car.findAll(search, sort, minPrice, maxPrice);
}

async function getCarById(carId: number) {
  return Car.findById(carId);
}

async function getCarsByUserId(userId: number) {
  return Car.findAllByUserId(userId);
}

async function createCar(data: CarData, userId: number) {
  const car = new Car({
    ...data,
    user_id: userId,
  });

  await car.save();
  return car;
}

async function updateCar(
  carId: number,
  data: CarData,
  currentUserId: number,
  isAdmin: boolean,
) {
  const car = await Car.findById(carId);

  if (!car) {
    throw new Error("Auto neexistuje");
  }

  if (!isAdmin && car.user_id !== currentUserId) {
    throw new Error("Nemáš právo upraviť toto auto");
  }

  car.title = data.title;
  car.brand = data.brand;
  car.model = data.model;
  car.year = data.year;
  car.price = data.price;
  car.mileage = data.mileage;
  car.fuel = data.fuel;
  car.transmission = data.transmission;
  car.description = data.description;
  car.image = data.image;
  car.galleryImages = data.galleryImages;

  await car.save();
  return car;
}

async function deleteCar(
  carId: number,
  currentUserId: number,
  isAdmin: boolean,
) {
  const car = await Car.findById(carId);

  if (!car) {
    throw new Error("Auto neexistuje");
  }

  if (!isAdmin && car.user_id !== currentUserId) {
    throw new Error("Nemáš právo vymazať toto auto");
  }

  await Car.deleteById(carId);
}

export {
  getAllCars,
  getCarById,
  getCarsByUserId,
  createCar,
  updateCar,
  deleteCar,
};
