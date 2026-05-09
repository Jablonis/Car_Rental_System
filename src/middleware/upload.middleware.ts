import multer from "multer";

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!imageMimeTypes.has(file.mimetype)) {
      return callback(new Error("Only JPG, PNG, WEBP or GIF images are allowed."));
    }

    callback(null, true);
  },
});

export const carUpload = upload.fields([
  { name: "imageFile", maxCount: 1 },
  { name: "galleryImageFiles", maxCount: 8 },
]);

export const blogUpload = upload.fields([
  { name: "imageFile", maxCount: 1 },
]);
