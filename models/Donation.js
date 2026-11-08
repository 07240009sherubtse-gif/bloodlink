
const db = require('../config/db');

// Create a new donation registration with health screening answers.
exports.create = (userId, d) =>
  db.none(
    `INSERT INTO donations (
      user_id,
      hospital,
      blood_group,
      donated_on,
      feeling_healthy,
      illness_symptoms,
      recent_donation,
      taking_medication,
      previous_deferral,
      has_certificate,
      information_confirmed,
      terms_accepted,
      contact_consent,
      screening_status
    )
    VALUES (
      $1, $2, $3, NULLIF($4,'')::date,
      $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Pending Review'
    )`,
    [
      userId,
      d.hospital,
      d.blood_group,
      d.donated_on,
      d.feeling_healthy,
      d.illness_symptoms,
      d.recent_donation,
      d.taking_medication,
      d.previous_deferral,
      d.has_certificate,
      d.information_confirmed,
      d.terms_accepted,
      d.contact_consent
    ]
  );

// Show all donation registrations belonging to a user.
exports.listByUser = (userId) =>
  db.any(
    `SELECT *
     FROM donations
     WHERE user_id=$1
     ORDER BY id DESC`,
    [userId]
  );

// Show donation registrations to healthcare professionals and admins.
exports.listAll = (status = '') =>
  db.any(
    `SELECT d.*, u.full_name AS donor, u.phone AS donor_phone
     FROM donations d
     LEFT JOIN users u ON u.id = d.user_id
     WHERE ($1='' OR d.status=$1)
     ORDER BY (d.status IN ('Completed','Rejected')), d.id DESC`,
    [status]
  );

// Only completed donations count towards donor statistics.
exports.statsForUser = (userId) =>
  db.one(
    `SELECT
       count(*)::int total,
       max(donated_on) last
     FROM donations
     WHERE user_id=$1
       AND status='Completed'`,
    [userId]
  );

exports.reviewScreening = async (id, reviewerId) => {
  const row = await db.oneOrNone(
    `UPDATE donations
     SET screening_status='Reviewed',
         screening_reviewed_by=$2,
         screening_reviewed_at=now()
     WHERE id=$1 AND screening_status='Pending Review'
     RETURNING id`,
    [id, reviewerId]
  );

  if (row) return 'reviewed';
  const existing = await db.oneOrNone(
    'SELECT screening_status FROM donations WHERE id=$1',
    [id]
  );
  return existing ? 'already_reviewed' : 'notfound';
};

// Count pending donation registrations.
exports.countPending = async () =>
  (
    await db.one(
      `SELECT count(*)::int n
       FROM donations
       WHERE status='Pending'`
    )
  ).n;

// Change donation status.
// Only an actual completed and verified blood donation
// should be marked Completed.
//
// When a donation becomes Completed, one unit is added
// to hospital stock within the same transaction.
//
// A completed donation cannot be changed again.
exports.setStatus = (id, status, creditHospital) =>
  db.tx(async (t) => {
    const d = await t.oneOrNone(
      'SELECT * FROM donations WHERE id=$1 FOR UPDATE',
      [id]
    );

    if (!d) return 'notfound';

    if (d.status === 'Completed') return 'locked';

    // Prevent recording completion before screening review.
    if (
      status === 'Completed' &&
      d.screening_status !== 'Reviewed'
    ) {
      return 'screening_required';
    }

    await t.none(
      'UPDATE donations SET status=$2 WHERE id=$1',
      [id, status]
    );

    if (
      status === 'Completed' &&
      creditHospital &&
      d.blood_group
    ) {
      await t.none(
        `INSERT INTO hospital_stock (
          hospital,
          blood_group,
          units
        )
        VALUES ($1,$2,1)
        ON CONFLICT (hospital, blood_group)
        DO UPDATE SET
          units = hospital_stock.units + 1`,
        [creditHospital, d.blood_group]
      );

      return 'credited';
    }

    return 'ok';
  });
