import express from "express";
import { protectRoutes } from "../middleware/protect-routes.middleware.js";
import {
  getCarsPage,
  getCarDetailPage,
  getMyCarsPage,
  getCreateCarPage,
  postCreateCar,
  getEditCarPage,
  postEditCar,
  postDeleteCar,
} from "../controllers/car.controller.js";

const router = express.Router();

router.get("/cars", getCarsPage);

router.get("/my-cars", protectRoutes, getMyCarsPage);

router.get("/cars/new", protectRoutes, getCreateCarPage);
router.post("/cars/new", protectRoutes, postCreateCar);

router.get("/cars/:id/edit", protectRoutes, getEditCarPage);
router.post("/cars/:id/edit", protectRoutes, postEditCar);

router.post("/cars/:id/delete", protectRoutes, postDeleteCar);

router.get("/cars/:id", getCarDetailPage);

export default router;