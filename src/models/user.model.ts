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
  avatar: string | null;
};

class User {
  user_id?: number;
  name!: string;
  email!: string;
  password!: string;
  isAdmin!: boolean;
  avatar?: string | null;

  private static ensurePromise: Promise<void> | null = null;

  constructor(
    data: {
      name: string;
      email: string;
      password: string;
      isAdmin?: boolean;
      avatar?: string | null;
    },
    user_id?: number,
  ) {
    this.user_id = user_id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.isAdmin = data.isAdmin ?? false;
    this.avatar = data.avatar ?? null;
  }

  static async ensureTable(): Promise<void> {
    if (!User.ensurePromise) {
      User.ensurePromise = (async () => {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            user_id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            is_admin BOOLEAN NOT NULL DEFAULT FALSE,
            avatar TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);

        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`);
      })();
    }

    return User.ensurePromise;
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
    await User.ensureTable();

    if (this.user_id) {
      await pool.query(
        `UPDATE users
         SET name = $1, email = $2, password = $3, is_admin = $4, avatar = $5
         WHERE user_id = $6`,
        [this.name, this.email, this.password, this.isAdmin, this.avatar ?? null, this.user_id],
      );
    } else {
      const hashedPassword = await User.hashPassword(this.password);

      const result = await pool.query<{ user_id: number }>(
        `INSERT INTO users (name, email, password, is_admin, avatar)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING user_id`,
        [this.name, this.email, hashedPassword, this.isAdmin, this.avatar ?? null],
      );

      this.user_id = result.rows[0].user_id;
      this.password = hashedPassword;
    }
  }

  static hydrate(row: UserRow): User {
    return new User(
      {
        name: row.name,
        email: row.email,
        password: row.password,
        isAdmin: row.isAdmin,
        avatar: row.avatar,
      },
      row.user_id,
    );
  }

  static async findByEmail(email: string): Promise<User | null> {
    await User.ensureTable();

    const result = await pool.query<UserRow>(
      `SELECT user_id, name, email, password, is_admin as "isAdmin", avatar
       FROM users
       WHERE email = $1`,
      [email],
    );

    return result.rows[0] ? User.hydrate(result.rows[0]) : null;
  }

  static async findAll(search?: string): Promise<User[]> {
    await User.ensureTable();

    let query = `SELECT user_id, name, email, password, is_admin as "isAdmin", avatar FROM users`;
    const params: (string | number)[] = [];

    if (search && search.trim() !== "") {
      query += ` WHERE name ILIKE $1 OR email ILIKE $2`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY user_id ASC`;

    const result = await pool.query<UserRow>(query, params);
    return result.rows.map(User.hydrate);
  }

  static async findById(user_id: number): Promise<User | null> {
    await User.ensureTable();

    const result = await pool.query<UserRow>(
      `SELECT user_id, name, email, password, is_admin as "isAdmin", avatar
       FROM users
       WHERE user_id = $1`,
      [user_id],
    );

    return result.rows[0] ? User.hydrate(result.rows[0]) : null;
  }

  static async updateAvatar(user_id: number, avatar: string | null): Promise<void> {
    await User.ensureTable();
    await pool.query(`UPDATE users SET avatar = $1 WHERE user_id = $2`, [avatar, user_id]);
  }

  static async deleteById(user_id: number): Promise<void> {
    await User.ensureTable();
    await pool.query(`DELETE FROM users WHERE user_id = $1`, [user_id]);
  }

  static async countAdmins(): Promise<number> {
    await User.ensureTable();
    const result = await pool.query<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM users WHERE is_admin = true`,
    );

    return result.rows[0].count;
  }

  static async emailExists(
    email: string,
    excludeUserId?: number,
  ): Promise<boolean> {
    await User.ensureTable();

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
