require('dotenv').config();

const pgp = require('pg-promise')();

const db = pgp({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  }
});

module.exports = db;