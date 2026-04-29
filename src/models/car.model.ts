import pool from "../data/db.js";

type CarRow = {
  car_id: number;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: string;
  transmission: string;
  description: string;
  image: string;
  gallery_images: string[] | string | null;
  user_id: number;
  created_at: Date;
  owner_name?: string;
};

class Car {
  car_id?: number;
  title!: string;
  brand!: string;
  model!: string;
  year!: number;
  price!: number;
  mileage!: number;
  fuel!: string;
  transmission!: string;
  description!: string;
  image!: string;
  galleryImages!: string[];
  user_id!: number;
  created_at?: Date;
  owner_name?: string;

  private static ensurePromise: Promise<void> | null = null;

  constructor(
    data: {
      title: string;
      brand: string;
      model: string;
      year: number;
      price: number;
      mileage: number;
      fuel: string;
      transmission: string;
      description: string;
      image: string;
      galleryImages?: string[];
      user_id: number;
      created_at?: Date;
      owner_name?: string;
    },
    car_id?: number,
  ) {
    this.car_id = car_id;
    this.title = data.title;
    this.brand = data.brand;
    this.model = data.model;
    this.year = data.year;
    this.price = data.price;
    this.mileage = data.mileage;
    this.fuel = data.fuel;
    this.transmission = data.transmission;
    this.description = data.description;
    this.image = data.image;
    this.galleryImages = data.galleryImages ?? [];
    this.user_id = data.user_id;
    this.created_at = data.created_at;
    this.owner_name = data.owner_name;
  }

  static async ensureTable(): Promise<void> {
    if (!Car.ensurePromise) {
      Car.ensurePromise = (async () => {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS cars (
            car_id BIGSERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER NOT NULL,
            price NUMERIC(12,2) NOT NULL,
            mileage INTEGER NOT NULL,
            fuel TEXT NOT NULL,
            transmission TEXT NOT NULL,
            description TEXT NOT NULL,
            image TEXT NOT NULL,
            gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
            user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);

        await pool.query(`ALTER TABLE cars ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb`);
      })();
    }

    return Car.ensurePromise;
  }

  static parseGalleryImages(value: CarRow["gallery_images"]): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
    }

    if (typeof value === "string" && value.trim() !== "") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.filter((item): item is string => typeof item === "string" && item.trim() !== "")
          : [];
      } catch {
        return value
          .split(/\r?\n|,/) 
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    return [];
  }

  static hydrate(row: CarRow): Car {
    return new Car(
      {
        title: row.title,
        brand: row.brand,
        model: row.model,
        year: row.year,
        price: Number(row.price),
        mileage: row.mileage,
        fuel: row.fuel,
        transmission: row.transmission,
        description: row.description,
        image: row.image,
        galleryImages: Car.parseGalleryImages(row.gallery_images),
        user_id: row.user_id,
        created_at: row.created_at,
        owner_name: row.owner_name,
      },
      row.car_id,
    );
  }

  async save(): Promise<void> {
    await Car.ensureTable();

    if (this.car_id) {
      await pool.query(
        `UPDATE cars
         SET title = $1, brand = $2, model = $3, year = $4, price = $5,
             mileage = $6, fuel = $7, transmission = $8, description = $9, image = $10, gallery_images = $11::jsonb
         WHERE car_id = $12`,
        [
          this.title,
          this.brand,
          this.model,
          this.year,
          this.price,
          this.mileage,
          this.fuel,
          this.transmission,
          this.description,
          this.image,
          JSON.stringify(this.galleryImages ?? []),
          this.car_id,
        ],
      );
    } else {
      const result = await pool.query<{ car_id: number }>(
        `INSERT INTO cars
         (title, brand, model, year, price, mileage, fuel, transmission, description, image, gallery_images, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)
         RETURNING car_id`,
        [
          this.title,
          this.brand,
          this.model,
          this.year,
          this.price,
          this.mileage,
          this.fuel,
          this.transmission,
          this.description,
          this.image,
          JSON.stringify(this.galleryImages ?? []),
          this.user_id,
        ],
      );

      this.car_id = result.rows[0].car_id;
    }
  }

  static async findAll(
    search?: string,
    sort?: string,
    minPrice?: number | string,
    maxPrice?: number | string,
  ): Promise<Car[]> {
    await Car.ensureTable();

    let query = `SELECT c.* FROM cars c`;
    const params: (string | number)[] = [];
    const whereConditions: string[] = [];
    let paramIndex = 1;

    if (search && search.trim() !== "") {
      whereConditions.push(`(c.title ILIKE $${paramIndex} OR c.brand ILIKE $${paramIndex + 1} OR c.model ILIKE $${paramIndex + 2})`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }

    if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
      whereConditions.push(`c.price >= $${paramIndex}`);
      params.push(Number(minPrice));
      paramIndex += 1;
    }

    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
      whereConditions.push(`c.price <= $${paramIndex}`);
      params.push(Number(maxPrice));
      paramIndex += 1;
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ` + whereConditions.join(` AND `);
    }

    switch (sort) {
      case "price_asc":
        query += ` ORDER BY c.price ASC`;
        break;
      case "price_desc":
        query += ` ORDER BY c.price DESC`;
        break;
      case "year_desc":
        query += ` ORDER BY c.year DESC`;
        break;
      case "year_asc":
        query += ` ORDER BY c.year ASC`;
        break;
      default:
        query += ` ORDER BY c.created_at DESC`;
        break;
    }

    const result = await pool.query<CarRow>(query, params);
    return result.rows.map(Car.hydrate);
  }

  static async findLatestWithOwner(limit = 6): Promise<Car[]> {
    await Car.ensureTable();

    const result = await pool.query<CarRow>(
      `SELECT c.*, u.name as owner_name
       FROM cars c
       LEFT JOIN users u ON u.user_id = c.user_id
       ORDER BY c.created_at DESC
       LIMIT $1`,
      [limit],
    );

    return result.rows.map(Car.hydrate);
  }

  static async findById(car_id: number): Promise<Car | null> {
    await Car.ensureTable();

    const result = await pool.query<CarRow>(
      `SELECT * FROM cars WHERE car_id = $1`,
      [car_id],
    );

    return result.rows[0] ? Car.hydrate(result.rows[0]) : null;
  }

  static async findAllByUserId(userId: number): Promise<Car[]> {
    await Car.ensureTable();

    const result = await pool.query<CarRow>(
      `SELECT * FROM cars WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );

    return result.rows.map(Car.hydrate);
  }

  static async deleteById(car_id: number): Promise<void> {
    await Car.ensureTable();
    await pool.query(`DELETE FROM cars WHERE car_id = $1`, [car_id]);
  }
}

export default Car;
