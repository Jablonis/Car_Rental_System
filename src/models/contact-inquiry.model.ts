import pool from "../data/db.js";

type ContactInquiryData = {
  name: string;
  email: string;
  focus: string | null;
  message: string;
};

class ContactInquiry {
  private static ensurePromise: Promise<void> | null = null;

  static async ensureTable(): Promise<void> {
    if (!ContactInquiry.ensurePromise) {
      ContactInquiry.ensurePromise = (async () => {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS contact_inquiries (
            inquiry_id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            focus TEXT,
            message TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
      })();
    }

    return ContactInquiry.ensurePromise;
  }

  static async create(data: ContactInquiryData): Promise<void> {
    await ContactInquiry.ensureTable();
    await pool.query(
      `INSERT INTO contact_inquiries (name, email, focus, message)
       VALUES ($1, $2, $3, $4)`,
      [data.name, data.email, data.focus, data.message],
    );
  }
}

export default ContactInquiry;
