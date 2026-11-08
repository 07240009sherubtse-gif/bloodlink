
require('dotenv').config();

async function main() {
  let db;

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is missing');
    }

    db = require('../config/db');

    const sql = `
      ALTER TABLE public.donations
        ADD COLUMN IF NOT EXISTS feeling_healthy BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS illness_symptoms BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS recent_donation BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS taking_medication BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS previous_deferral BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS has_certificate BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS information_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS contact_consent BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS screening_status TEXT NOT NULL DEFAULT 'Pending Review',
        ADD COLUMN IF NOT EXISTS screening_reviewed_by INTEGER REFERENCES public.users(id),
        ADD COLUMN IF NOT EXISTS screening_reviewed_at TIMESTAMP;
    `;

    await db.tx((transaction) => transaction.none(sql));

    console.log('SUCCESS: Donation database updated!');
  } catch (error) {
    console.error('ERROR: Unable to update donation database:', error.message);
    process.exitCode = 1;
  } finally {
    if (db) await db.$pool.end();
  }
}

main().catch((error) => {
  console.error('ERROR: Unable to close database connection:', error.message);
  process.exitCode = 1;
});
