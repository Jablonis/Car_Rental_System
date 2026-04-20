import crypto from "crypto";
import { promisify } from "util";
import pool from "../data/db.js";

const scrypt = promisify(crypto.scrypt);

type UserRow = {
  user_id: number;
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
};

class User {
  user_id?: number;
  name!: string;
  email!: string;
  password!: string;
  isAdmin!: boolean;

  constructor(
    data: {
      name: string;
      email: string;
      password: string;
      isAdmin?: boolean;
    },
    user_id?: number,
  ) {
    this.user_id = user_id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.isAdmin = data.isAdmin ?? false;
  }

  static async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
  }

  static async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    const [salt, key] = hashedPassword.split(":");
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return key === derivedKey.toString("hex");
  }

  async save(): Promise<void> {
    if (this.user_id) {
      await pool.query(
        `UPDATE users
         SET name = $1, email = $2, password = $3, is_admin = $4
         WHERE user_id = $5`,
        [this.name, this.email, this.password, this.isAdmin, this.user_id],
      );
    } else {
      const hashedPassword = await User.hashPassword(this.password);

      const result = await pool.query<{ user_id: number }>(
        `INSERT INTO users (name, email, password, is_admin)
         VALUES ($1, $2, $3, $4)
         RETURNING user_id`,
        [this.name, this.email, hashedPassword, this.isAdmin],
      );

      this.user_id = result.rows[0].user_id;
      this.password = hashedPassword;
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query<UserRow>(
      `SELECT user_id, name, email, password, is_admin as "isAdmin"
       FROM users
       WHERE email = $1`,
      [email],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    return new User(
      {
        name: row.name,
        email: row.email,
        password: row.password,
        isAdmin: row.isAdmin,
      },
      row.user_id,
    );
  }

  static async findAll(search?: string): Promise<User[]> {
    let query = `SELECT user_id, name, email, password, is_admin as "isAdmin" FROM users`;
    const params: (string | number)[] = [];

    if (search && search.trim() !== "") {
      query += ` WHERE name ILIKE $1 OR email ILIKE $2`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY user_id ASC`;

    const result = await pool.query<UserRow>(query, params);

    return result.rows.map(
      (row) =>
        new User(
          {
            name: row.name,
            email: row.email,
            password: row.password,
            isAdmin: row.isAdmin,
          },
          row.user_id,
        ),
    );
  }

  static async findById(user_id: number): Promise<User | null> {
    const result = await pool.query<UserRow>(
      `SELECT user_id, name, email, password, is_admin as "isAdmin"
       FROM users
       WHERE user_id = $1`,
      [user_id],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    return new User(
      {
        name: row.name,
        email: row.email,
        password: row.password,
        isAdmin: row.isAdmin,
      },
      row.user_id,
    );
  }

  static async deleteById(user_id: number): Promise<void> {
    await pool.query(`DELETE FROM users WHERE user_id = $1`, [user_id]);
  }

  static async countAdmins(): Promise<number> {
    const result = await pool.query<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM users WHERE is_admin = true`,
    );

    return result.rows[0].count;
  }

  static async emailExists(
    email: string,
    excludeUserId?: number,
  ): Promise<boolean> {
    let query = `SELECT user_id FROM users WHERE email = $1`;
    const params: (string | number)[] = [email];

    if (excludeUserId) {
      query += ` AND user_id != $2`;
      params.push(excludeUserId);
    }

    const result = await pool.query(query, params);
    return result.rows.length > 0;
  }
}

export default User;