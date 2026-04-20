import express from "express";
import path from "path";
import dotenv from "dotenv";
import publicRoutes from "./routes/public.route.js";
import pool from "./data/db.js";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import authRoutes from "./routes/auth.route.js";
import { checkAuthStatus } from "./middleware/check-auth.middleware.js";
import adminRoutes from "./routes/admin.route.js";
import carRoutes from "./routes/car.route.js";

dotenv.config();

const app = express();
const isVercel = Boolean(process.env.VERCEL);
const PORT = Number(process.env.PORT) || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));

app.use("/assets", express.static(path.join(process.cwd(), "public", "assets")));

app.set("trust proxy", 1);

const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool,                     // reuse your existing DB pool
      tableName: "session",     // the table you created in Supabase
      createTableIfMissing: false,
    }),
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

app.use(checkAuthStatus);

app.use("/", publicRoutes);
app.use("/", authRoutes);
app.use("/", adminRoutes);
app.use("/", carRoutes);

async function startLocalServer() {
  try {
    const { rows } = await pool.query("SELECT 1");
    console.log("DB connected:", rows);

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("DB connection failed:", error);
  }
}

if (!isVercel) {
  void startLocalServer();
}

export default app;