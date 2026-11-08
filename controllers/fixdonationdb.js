
require('dotenv').config();

const db = require('./config/db');
const fs = require('fs');

async function main() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured.');
    }

    const sql = fs.readFileSync(
      './fix-donation.sql',
      'utf8'
    );

    await db.none(sql);

    console.log('Donation database columns updated successfully.');
  } catch (error) {
    console.error('Database migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    db.$pool.end();
  }
}

main();
