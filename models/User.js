const db = require('../config/db');

// Never select password_hash except where it is needed for login / password change.
const PUBLIC = `id, full_name, email, phone, blood_group, dob, address, role, status,
  license_number, hospital, verification_note, verified_at, created_at`;

exports.findById = (id) => db.oneOrNone(`SELECT ${PUBLIC} FROM users WHERE id=$1`, [id]);

// Phone numbers aren't unique, so this can return several rows; the caller checks each password.
exports.findByLogin = (identifier) =>
  db.any('SELECT * FROM users WHERE LOWER(email)=LOWER($1) OR phone=$1', [identifier]);

exports.emailExists = async (email) =>
  !!(await db.oneOrNone('SELECT 1 FROM users WHERE LOWER(email)=LOWER($1)', [email]));

exports.create = (d) =>
  db.one(
    `INSERT INTO users(full_name,phone,email,blood_group,password_hash,role,status,license_number,hospital,verification_note)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, role, status`,
    [d.full_name, d.phone, d.email, d.blood_group, d.password_hash, d.role, d.status,
      d.license_number, d.hospital, d.verification_note]
  );

exports.updateProfile = (id, d) =>
  db.none(
    `UPDATE users SET full_name=$1, phone=$2, blood_group=NULLIF($3,''), dob=NULLIF($4,'')::date, address=$5 WHERE id=$6`,
    [d.full_name, d.phone, d.blood_group, d.dob, d.address, id]
  );

exports.getPasswordHash = async (id) => (await db.one('SELECT password_hash FROM users WHERE id=$1', [id])).password_hash;
exports.updatePassword = (id, hash) => db.none('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, id]);

// Only active donors with a blood group are searchable, and never admins / healthcare staff.
exports.listDonors = ({ excludeId, bg = '', term = '', limit = null }) =>
  db.any(
    `SELECT full_name, blood_group, address FROM users
     WHERE role='user' AND status='active' AND blood_group IS NOT NULL AND id<>$1
     AND ($2='' OR blood_group=$2) AND ($3='' OR full_name ILIKE '%'||$3||'%' OR address ILIKE '%'||$3||'%')
     ORDER BY full_name LIMIT $4`,
    [excludeId, bg, term, limit]
  );

exports.list = ({ role = '', status = '', q = '' }) =>
  db.any(
    `SELECT id, full_name, email, phone, role, status, hospital, license_number, blood_group, created_at FROM users
     WHERE ($1='' OR role=$1) AND ($2='' OR status=$2)
     AND ($3='' OR full_name ILIKE '%'||$3||'%' OR email ILIKE '%'||$3||'%')
     ORDER BY created_at DESC, id DESC`,
    [role, status, q]
  );

exports.listPending = () =>
  db.any(
    `SELECT id, full_name, email, phone, role, hospital, license_number, verification_note, created_at
     FROM users WHERE status='pending' ORDER BY created_at, id`
  );

exports.recent = (n) =>
  db.any('SELECT id, full_name, role, status, created_at FROM users ORDER BY created_at DESC, id DESC LIMIT $1', [n]);

exports.counts = () =>
  db.one(
    `SELECT count(*) FILTER (WHERE role='user' AND status='active')::int users,
            count(*) FILTER (WHERE role='healthcare' AND status='active')::int healthcare,
            count(*) FILTER (WHERE role='admin' AND status='active')::int admins,
            count(*) FILTER (WHERE status='pending')::int pending,
            count(*) FILTER (WHERE status='suspended')::int suspended
     FROM users`
  );

// Moves an account between statuses, but only if it is currently in one of the `from` statuses.
// Returns the id, or null when the account wasn't in an allowed state (or doesn't exist).
exports.transition = async (id, from, to, verifierId = null) => {
  const row = verifierId
    ? await db.oneOrNone(
        'UPDATE users SET status=$3, verified_by=$4, verified_at=now() WHERE id=$1 AND status=ANY($2) RETURNING id',
        [id, from, to, verifierId])
    : await db.oneOrNone('UPDATE users SET status=$3 WHERE id=$1 AND status=ANY($2) RETURNING id', [id, from, to]);
  return row ? row.id : null;
};
