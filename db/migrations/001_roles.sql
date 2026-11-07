-- Role-based accounts. Idempotent: safe on both existing and fresh databases.
-- Every existing account becomes role 'user' with status 'active', so nobody is locked out.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hospital TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_note TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_by INT REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin','healthcare','user'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_status_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active','pending','rejected','suspended'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_requests_status ON blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
