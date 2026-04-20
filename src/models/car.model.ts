import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "../data/db.js";

type CarRow = RowDataPacket & {
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
      await pool.query<ResultSetHeader>(
        `UPDATE cars
         SET title = ?, brand = ?, model = ?, year = ?, price = ?, mileage = ?, fuel = ?, transmission = ?, description = ?, image = ?
         WHERE car_id = ?`,
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
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO cars (title, brand, model, year, price, mileage, fuel, transmission, description, image, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

      this.car_id = result.insertId;
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

    if (search && search.trim() !== "") {
      whereConditions.push(`(title LIKE ? OR brand LIKE ? OR model LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
      whereConditions.push(`price >= ?`);
      params.push(Number(minPrice));
    }

    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
      whereConditions.push(`price <= ?`);
      params.push(Number(maxPrice));
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

    const [rows] = await pool.query<CarRow[]>(query, params);

    return rows.map(
      (row) =>
        new Car(
          {
            title: row.title,
            brand: row.brand,
            model: row.model,
            year: row.year,
            price: row.price,
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
    const [rows] = await pool.query<CarRow[]>(
      `SELECT * FROM cars WHERE car_id = ?`,
      [car_id],
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];

    return new Car(
      {
        title: row.title,
        brand: row.brand,
        model: row.model,
        year: row.year,
        price: row.price,
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
    const [rows] = await pool.query<CarRow[]>(
      `SELECT * FROM cars WHERE user_id = ? ORDER BY created_at DESC`,
      [userId],
    );

    return rows.map(
      (row) =>
        new Car(
          {
            title: row.title,
            brand: row.brand,
            model: row.model,
            year: row.year,
            price: row.price,
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
    await pool.query<ResultSetHeader>(
      `DELETE FROM cars WHERE car_id = ?`,
      [car_id],
    );
  }
}

export default Car;