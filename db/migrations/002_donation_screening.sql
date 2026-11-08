-- Store donor screening answers and track review of each registration.
ALTER TABLE donations ADD COLUMN IF NOT EXISTS feeling_healthy BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS illness_symptoms BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS recent_donation BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS taking_medication BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS previous_deferral BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS has_certificate BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS information_confirmed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS contact_consent BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS screening_status TEXT NOT NULL DEFAULT 'Pending Review';
ALTER TABLE donations ADD COLUMN IF NOT EXISTS screening_reviewed_by INT REFERENCES users(id);
ALTER TABLE donations ADD COLUMN IF NOT EXISTS screening_reviewed_at TIMESTAMP;
