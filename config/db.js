// PostgreSQL connection (pg-promise). Connects lazily on first query.
require('dotenv').config();
const pgp = require('pg-promise')();

module.exports = pgp(process.env.DATABASE_URL);
