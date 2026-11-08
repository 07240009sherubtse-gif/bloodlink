-- Fresh install. Safe to re-run (everything is IF NOT EXISTS).
-- Existing databases get the new columns from db/migrations/001_roles.sql.
CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY, full_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
  phone TEXT, password_hash TEXT NOT NULL, blood_group TEXT, dob DATE, address TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  license_number TEXT, hospital TEXT, verification_note TEXT,
  verified_by INT REFERENCES users(id), verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT users_role_check CHECK (role IN ('admin','healthcare','user')),
  CONSTRAINT users_status_check CHECK (status IN ('active','pending','rejected','suspended')));
CREATE TABLE IF NOT EXISTS blood_requests(
  id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), patient_name TEXT, age INT,
  gender TEXT, hospital TEXT, blood_group TEXT, urgent BOOLEAN DEFAULT false, notes TEXT,
  status TEXT DEFAULT 'Requested', created_at TIMESTAMP DEFAULT now());
CREATE TABLE IF NOT EXISTS donations(
  id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), hospital TEXT, blood_group TEXT,
  donated_on DATE, status TEXT DEFAULT 'Pending',
  feeling_healthy BOOLEAN NOT NULL DEFAULT false,
  illness_symptoms BOOLEAN NOT NULL DEFAULT false,
  recent_donation BOOLEAN NOT NULL DEFAULT false,
  taking_medication BOOLEAN NOT NULL DEFAULT false,
  previous_deferral BOOLEAN NOT NULL DEFAULT false,
  has_certificate BOOLEAN NOT NULL DEFAULT false,
  information_confirmed BOOLEAN NOT NULL DEFAULT false,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  contact_consent BOOLEAN NOT NULL DEFAULT false,
  screening_status TEXT NOT NULL DEFAULT 'Pending Review',
  screening_reviewed_by INT REFERENCES users(id),
  screening_reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now());
CREATE TABLE IF NOT EXISTS hospital_stock(
  hospital TEXT, blood_group TEXT, units INT, PRIMARY KEY(hospital, blood_group));
CREATE TABLE IF NOT EXISTS alerts(
  id SERIAL PRIMARY KEY, title TEXT, body TEXT,
  created_by INT REFERENCES users(id), created_at TIMESTAMP DEFAULT now());

INSERT INTO hospital_stock
SELECT h, g, (5 + (abs(hashtext(h||g)) % 12))
FROM unnest(ARRAY['JDWNR Hospital','Thimphu Referral','Gelephu Hospital','Mongar Hospital','Phuentsholing Hospital']) h,
     unnest(ARRAY['A+','A-','B+','B-','O+','O-','AB+','AB-']) g
ON CONFLICT DO NOTHING;

-- Sample alerts, only when the table is empty (so re-running doesn't duplicate them).
INSERT INTO alerts(title, body)
SELECT * FROM (VALUES
  ('Urgent need for O+','Multiple patients are in need of O+ blood at JDWNR Hospital.'),
  ('Next donation camp','Nov 02, 2025, 09:00 AM - 04:00 PM, Thimphu Clock Tower Ground.'),
  ('Blood stock low','B- blood level is 5 units at Gelephu Hospital.'),
  ('Donation camp reminder','Nov 10, 2025, 09:00 AM - 04:00 PM, Mongar Hospital.')
) v(title, body)
WHERE NOT EXISTS (SELECT 1 FROM alerts);
