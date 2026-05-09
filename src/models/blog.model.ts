import pool from "../data/db.js";

type BlogRow = {
  blog_id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  created_at: Date;
  updated_at: Date;
};

class Blog {
  blog_id?: number;
  title!: string;
  slug!: string;
  excerpt!: string;
  content!: string;
  image!: string;
  created_at?: Date;
  updated_at?: Date;

  private static ensurePromise: Promise<void> | null = null;

  constructor(
    data: {
      title: string;
      slug?: string;
      excerpt: string;
      content: string;
      image?: string;
      created_at?: Date;
      updated_at?: Date;
    },
    blog_id?: number,
  ) {
    this.blog_id = blog_id;
    this.title = data.title;
    this.slug = data.slug || "";
    this.excerpt = data.excerpt;
    this.content = data.content;
    this.image = data.image || "/assets/img/ritual.webp";
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async ensureTable(): Promise<void> {
    if (!Blog.ensurePromise) {
      Blog.ensurePromise = (async () => {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS blogs (
            blog_id BIGSERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            excerpt TEXT NOT NULL,
            content TEXT NOT NULL,
            image TEXT NOT NULL DEFAULT '/assets/img/ritual.webp',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
      })();
    }

    return Blog.ensurePromise;
  }

  static slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "journal-entry";
  }

  static async resolveUniqueSlug(title: string, excludeId?: number): Promise<string> {
    await Blog.ensureTable();

    const base = Blog.slugify(title);
    let slug = base;
    let counter = 2;

    while (true) {
      const params: (string | number)[] = [slug];
      let query = `SELECT blog_id FROM blogs WHERE slug = $1`;

      if (excludeId) {
        query += ` AND blog_id != $2`;
        params.push(excludeId);
      }

      const result = await pool.query<{ blog_id: number }>(query, params);
      if (result.rows.length === 0) return slug;

      slug = `${base}-${counter}`;
      counter += 1;
    }
  }

  async save(): Promise<void> {
    await Blog.ensureTable();
    this.slug = await Blog.resolveUniqueSlug(this.title, this.blog_id);

    if (this.blog_id) {
      await pool.query(
        `UPDATE blogs
         SET title = $1, slug = $2, excerpt = $3, content = $4, image = $5, updated_at = NOW()
         WHERE blog_id = $6`,
        [this.title, this.slug, this.excerpt, this.content, this.image, this.blog_id],
      );
    } else {
      const result = await pool.query<{ blog_id: number }>(
        `INSERT INTO blogs (title, slug, excerpt, content, image)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING blog_id`,
        [this.title, this.slug, this.excerpt, this.content, this.image],
      );
      this.blog_id = result.rows[0].blog_id;
    }
  }

  static hydrate(row: BlogRow): Blog {
    return new Blog(
      {
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        content: row.content,
        image: row.image,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      row.blog_id,
    );
  }

  static async findAll(limit?: number): Promise<Blog[]> {
    await Blog.ensureTable();
    const query = `SELECT blog_id, title, slug, excerpt, content, image, created_at, updated_at
                   FROM blogs
                   ORDER BY created_at DESC${typeof limit === "number" ? ` LIMIT ${Math.max(1, limit)}` : ""}`;
    const result = await pool.query<BlogRow>(query);
    return result.rows.map(Blog.hydrate);
  }

  static async findLatest(limit = 3): Promise<Blog[]> {
    return Blog.findAll(limit);
  }

  static async findById(blog_id: number): Promise<Blog | null> {
    await Blog.ensureTable();
    const result = await pool.query<BlogRow>(
      `SELECT blog_id, title, slug, excerpt, content, image, created_at, updated_at
       FROM blogs WHERE blog_id = $1`,
      [blog_id],
    );
    return result.rows[0] ? Blog.hydrate(result.rows[0]) : null;
  }

  static async findBySlug(slug: string): Promise<Blog | null> {
    await Blog.ensureTable();
    const result = await pool.query<BlogRow>(
      `SELECT blog_id, title, slug, excerpt, content, image, created_at, updated_at
       FROM blogs WHERE slug = $1`,
      [slug],
    );
    return result.rows[0] ? Blog.hydrate(result.rows[0]) : null;
  }

  static async deleteById(blog_id: number): Promise<void> {
    await Blog.ensureTable();
    await pool.query(`DELETE FROM blogs WHERE blog_id = $1`, [blog_id]);
  }
}

export default Blog;
