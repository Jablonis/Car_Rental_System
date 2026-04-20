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
  user_id: number;
  created_at: Date;
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
  user_id!: number;
  created_at?: Date;

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
      user_id: number;
      created_at?: Date;
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
    this.user_id = data.user_id;
    this.created_at = data.created_at;
  }

  async save(): Promise<void> {
    if (this.car_id) {
      await pool.query(
        `UPDATE cars
         SET title = $1, brand = $2, model = $3, year = $4, price = $5,
             mileage = $6, fuel = $7, transmission = $8, description = $9, image = $10
         WHERE car_id = $11`,
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
          this.car_id,
        ],
      );
    } else {
      const result = await pool.query<{ car_id: number }>(
        `INSERT INTO cars
         (title, brand, model, year, price, mileage, fuel, transmission, description, image, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
    let query = `SELECT * FROM cars`;
    const params: (string | number)[] = [];
    const whereConditions: string[] = [];
    let paramIndex = 1;

    if (search && search.trim() !== "") {
      whereConditions.push(`(title ILIKE $${paramIndex} OR brand ILIKE $${paramIndex + 1} OR model ILIKE $${paramIndex + 2})`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }

    if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
      whereConditions.push(`price >= $${paramIndex}`);
      params.push(Number(minPrice));
      paramIndex += 1;
    }

    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
      whereConditions.push(`price <= $${paramIndex}`);
      params.push(Number(maxPrice));
      paramIndex += 1;
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ` + whereConditions.join(` AND `);
    }

    switch (sort) {
      case "price_asc":
        query += ` ORDER BY price ASC`;
        break;
      case "price_desc":
        query += ` ORDER BY price DESC`;
        break;
      case "year_desc":
        query += ` ORDER BY year DESC`;
        break;
      case "year_asc":
        query += ` ORDER BY year ASC`;
        break;
      default:
        query += ` ORDER BY created_at DESC`;
        break;
    }

    const result = await pool.query<CarRow>(query, params);

    return result.rows.map(
      (row) =>
        new Car(
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
            user_id: row.user_id,
            created_at: row.created_at,
          },
          row.car_id,
        ),
    );
  }

  static async findById(car_id: number): Promise<Car | null> {
    const result = await pool.query<CarRow>(
      `SELECT * FROM cars WHERE car_id = $1`,
      [car_id],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

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
        user_id: row.user_id,
        created_at: row.created_at,
      },
      row.car_id,
    );
  }

  static async findAllByUserId(userId: number): Promise<Car[]> {
    const result = await pool.query<CarRow>(
      `SELECT * FROM cars WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );

    return result.rows.map(
      (row) =>
        new Car(
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
            user_id: row.user_id,
            created_at: row.created_at,
          },
          row.car_id,
        ),
    );
  }

  static async deleteById(car_id: number): Promise<void> {
    await pool.query(`DELETE FROM cars WHERE car_id = $1`, [car_id]);
  }
}

export default Car;