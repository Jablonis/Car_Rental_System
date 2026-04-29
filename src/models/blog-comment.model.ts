import pool from "../data/db.js";
import User from "./user.model.js";
import Blog from "./blog.model.js";

export type BlogCommentStatus = "pending" | "approved" | "declined";

type BlogCommentRow = {
  comment_id: number;
  blog_id: number;
  user_id: number;
  content: string;
  status: BlogCommentStatus;
  created_at: Date;
  updated_at: Date;
  user_name?: string;
  user_avatar?: string | null;
  blog_title?: string;
  blog_slug?: string;
};

class BlogComment {
  comment_id?: number;
  blog_id!: number;
  user_id!: number;
  content!: string;
  status!: BlogCommentStatus;
  created_at?: Date;
  updated_at?: Date;
  user_name?: string;
  user_avatar?: string | null;
  blog_title?: string;
  blog_slug?: string;

  private static ensurePromise: Promise<void> | null = null;

  constructor(data: {
    blog_id: number;
    user_id: number;
    content: string;
    status?: BlogCommentStatus;
    created_at?: Date;
    updated_at?: Date;
    user_name?: string;
    user_avatar?: string | null;
    blog_title?: string;
    blog_slug?: string;
  }, comment_id?: number) {
    this.comment_id = comment_id;
    this.blog_id = data.blog_id;
    this.user_id = data.user_id;
    this.content = data.content;
    this.status = data.status ?? "pending";
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.user_name = data.user_name;
    this.user_avatar = data.user_avatar ?? null;
    this.blog_title = data.blog_title;
    this.blog_slug = data.blog_slug;
  }

  static async ensureTable(): Promise<void> {
    if (!BlogComment.ensurePromise) {
      BlogComment.ensurePromise = (async () => {
        await User.ensureTable();
        await Blog.ensureTable();
        await pool.query(`
          CREATE TABLE IF NOT EXISTS blog_comments (
            comment_id BIGSERIAL PRIMARY KEY,
            blog_id BIGINT NOT NULL REFERENCES blogs(blog_id) ON DELETE CASCADE,
            user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
      })();
    }

    return BlogComment.ensurePromise;
  }

  static hydrate(row: BlogCommentRow): BlogComment {
    return new BlogComment({
      blog_id: row.blog_id,
      user_id: row.user_id,
      content: row.content,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_name: row.user_name,
      user_avatar: row.user_avatar,
      blog_title: row.blog_title,
      blog_slug: row.blog_slug,
    }, row.comment_id);
  }

  static async create(data: { blog_id: number; user_id: number; content: string }): Promise<BlogComment> {
    await BlogComment.ensureTable();
    const result = await pool.query<BlogCommentRow>(`
      INSERT INTO blog_comments (blog_id, user_id, content, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING comment_id, blog_id, user_id, content, status, created_at, updated_at
    `, [data.blog_id, data.user_id, data.content]);

    return BlogComment.hydrate(result.rows[0]);
  }

  static async findApprovedByBlogId(blog_id: number): Promise<BlogComment[]> {
    await BlogComment.ensureTable();
    const result = await pool.query<BlogCommentRow>(`
      SELECT c.comment_id, c.blog_id, c.user_id, c.content, c.status, c.created_at, c.updated_at,
             u.name as user_name, u.avatar as user_avatar
      FROM blog_comments c
      JOIN users u ON u.user_id = c.user_id
      WHERE c.blog_id = $1 AND c.status = 'approved'
      ORDER BY c.created_at DESC
    `, [blog_id]);

    return result.rows.map(BlogComment.hydrate);
  }

  static async findAllForAdmin(status?: BlogCommentStatus): Promise<BlogComment[]> {
    await BlogComment.ensureTable();
    const params: (string | number)[] = [];
    let where = '';
    if (status) {
      params.push(status);
      where = 'WHERE c.status = $1';
    }

    const result = await pool.query<BlogCommentRow>(`
      SELECT c.comment_id, c.blog_id, c.user_id, c.content, c.status, c.created_at, c.updated_at,
             u.name as user_name, u.avatar as user_avatar,
             b.title as blog_title, b.slug as blog_slug
      FROM blog_comments c
      JOIN users u ON u.user_id = c.user_id
      JOIN blogs b ON b.blog_id = c.blog_id
      ${where}
      ORDER BY CASE WHEN c.status = 'pending' THEN 0 ELSE 1 END, c.created_at DESC
    `, params);

    return result.rows.map(BlogComment.hydrate);
  }

  static async countByStatus(status: BlogCommentStatus): Promise<number> {
    await BlogComment.ensureTable();
    const result = await pool.query<{ count: number }>(`
      SELECT COUNT(*)::int as count FROM blog_comments WHERE status = $1
    `, [status]);
    return result.rows[0]?.count ?? 0;
  }

  static async updateStatus(comment_id: number, status: BlogCommentStatus): Promise<void> {
    await BlogComment.ensureTable();
    await pool.query(`UPDATE blog_comments SET status = $1, updated_at = NOW() WHERE comment_id = $2`, [status, comment_id]);
  }
}

export default BlogComment;
