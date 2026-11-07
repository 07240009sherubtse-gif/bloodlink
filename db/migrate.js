// Usage: npm run db:migrate
// Applies db/schema.sql and every db/migrations/*.sql in order, then creates the first admin
// from ADMIN_EMAIL / ADMIN_PASSWORD if that email doesn't exist yet. Safe to run repeatedly.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../config/db');

async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return console.log('ADMIN_EMAIL/ADMIN_PASSWORD not set: skipping admin seed.');
  const exists = await db.oneOrNone('SELECT id FROM users WHERE LOWER(email)=LOWER($1)', [ADMIN_EMAIL]);
  if (exists) return console.log(`Admin seed: ${ADMIN_EMAIL} already exists, left unchanged.`);
  await db.none(
    `INSERT INTO users(full_name, email, phone, password_hash, role, status, verified_at)
     VALUES($1, LOWER($2), '', $3, 'admin', 'active', now())`,
    [ADMIN_NAME || 'System Admin', ADMIN_EMAIL, await bcrypt.hash(ADMIN_PASSWORD, 10)]
  );
  console.log(`Admin seed: created admin ${ADMIN_EMAIL}`);
}

(async () => {
  try {
    const dir = path.join(__dirname, 'migrations');
    const files = ['schema.sql', ...fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => path.join('migrations', f))];
    for (const f of files) {
      await db.multi(fs.readFileSync(path.join(__dirname, f), 'utf8'));
      console.log('applied', f);
    }
    await seedAdmin();
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exitCode = 1;
  } finally {
    db.$pool.end();
  }
})();
