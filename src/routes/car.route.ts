import express from "express";
import { protectRoutes } from "../middleware/protect-routes.middleware.js";
import { carUpload } from "../middleware/upload.middleware.js";
import {
  getCarsPage,
  getCarDetailPage,
  getMyCarsPage,
  getCreateCarPage,
  postCreateCar,
  getEditCarPage,
  postEditCar,
  postDeleteCar,
  postUpdateAvatar,
} from "../controllers/car.controller.js";

const router = express.Router();

router.get("/cars", getCarsPage);

router.get("/my-cars", protectRoutes, getMyCarsPage);
router.post("/my-cars/avatar", protectRoutes, postUpdateAvatar);

router.get("/cars/new", protectRoutes, getCreateCarPage);
router.post("/cars/new", protectRoutes, carUpload, postCreateCar);

router.get("/cars/:id/edit", protectRoutes, getEditCarPage);
router.post("/cars/:id/edit", protectRoutes, carUpload, postEditCar);

router.post("/cars/:id/delete", protectRoutes, postDeleteCar);

router.get("/cars/:id", getCarDetailPage);

export default router;
