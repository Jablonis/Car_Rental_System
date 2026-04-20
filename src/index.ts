import express from "express";
import path from "path";
import publicRoutes from "./routes/public.route.js";
import pool from "./data/db.js";
import session from "express-session";
import authRoutes from "./routes/auth.route.js";
import { checkAuthStatus } from "./middleware/check-auth.middleware.js";
import adminRoutes from "./routes/admin.route.js";
import carRoutes from "./routes/car.route.js";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// views
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));

// static assets
app.use(
  "/assets",
  express.static(path.join(process.cwd(), "src", "views", "public", "assets")),
);
app.use(
  session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false,
  }),
);
// routes
app.use(checkAuthStatus);

app.use("/", publicRoutes);
app.use("/", authRoutes);
app.use("/", adminRoutes);
app.use("/", carRoutes);

const PORT = 3000;

async function startServer() {
  try {
    const [rows] = await pool.query("SELECT 1");
    console.log("DB connected:", rows);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("DB connection failed:", error);
  }
}

startServer();