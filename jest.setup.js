// Load test env vars before any module reads process.env.
require('dotenv').config({ path: '.env.test' });
