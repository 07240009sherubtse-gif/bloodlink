const db = require('../config/db');

exports.create = (userId, d) =>
  db.none(
    `INSERT INTO donations(user_id,hospital,blood_group,donated_on) VALUES($1,$2,$3,NULLIF($4,'')::date)`,
    [userId, d.hospital, d.blood_group, d.donated_on]
  );

exports.listByUser = (userId) => db.any('SELECT * FROM donations WHERE user_id=$1 ORDER BY id DESC', [userId]);

exports.listAll = (status = '') =>
  db.any(
    `SELECT d.*, u.full_name AS donor, u.phone AS donor_phone
     FROM donations d LEFT JOIN users u ON u.id = d.user_id
     WHERE ($1='' OR d.status=$1)
     ORDER BY (d.status IN ('Completed','Rejected')), d.id DESC`,
    [status]
  );

// Only completed donations count towards a donor's totals.
exports.statsForUser = (userId) =>
  db.one(`SELECT count(*)::int total, max(donated_on) last FROM donations WHERE user_id=$1 AND status='Completed'`, [userId]);

exports.countPending = async () => (await db.one(`SELECT count(*)::int n FROM donations WHERE status='Pending'`)).n;

// Changes a donation's status. When it becomes Completed for the first time, one unit is added to
// `creditHospital`'s stock in the same transaction. A Completed donation is locked.
// Returns 'notfound' | 'locked' | 'ok' | 'credited'.
exports.setStatus = (id, status, creditHospital) =>
  db.tx(async (t) => {
    const d = await t.oneOrNone('SELECT * FROM donations WHERE id=$1 FOR UPDATE', [id]);
    if (!d) return 'notfound';
    if (d.status === 'Completed') return 'locked';
    await t.none('UPDATE donations SET status=$2 WHERE id=$1', [id, status]);
    if (status === 'Completed' && creditHospital && d.blood_group) {
      await t.none(
        `INSERT INTO hospital_stock(hospital, blood_group, units) VALUES($1,$2,1)
         ON CONFLICT (hospital, blood_group) DO UPDATE SET units = hospital_stock.units + 1`,
        [creditHospital, d.blood_group]
      );
      return 'credited';
    }
    return 'ok';
  });
