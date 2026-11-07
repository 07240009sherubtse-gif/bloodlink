const db = require('../config/db');

exports.create = (userId, d) =>
  db.none(
    'INSERT INTO blood_requests(user_id,patient_name,age,gender,hospital,blood_group,urgent,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
    [userId, d.patient_name, d.age, d.gender, d.hospital, d.blood_group, d.urgent, d.notes]
  );

exports.listByUser = (userId, limit = null) =>
  db.any('SELECT * FROM blood_requests WHERE user_id=$1 ORDER BY id DESC LIMIT $2', [userId, limit]);

// Open requests first, urgent ones on top.
exports.listAll = (status = '') =>
  db.any(
    `SELECT r.*, u.full_name AS requester, u.phone AS requester_phone
     FROM blood_requests r LEFT JOIN users u ON u.id = r.user_id
     WHERE ($1='' OR r.status=$1)
     ORDER BY (r.status IN ('Completed','Cancelled')), r.urgent DESC, r.id DESC`,
    [status]
  );

exports.listOpen = (limit) =>
  db.any(
    `SELECT r.*, u.full_name AS requester FROM blood_requests r LEFT JOIN users u ON u.id = r.user_id
     WHERE r.status NOT IN ('Completed','Cancelled') ORDER BY r.urgent DESC, r.id DESC LIMIT $1`,
    [limit]
  );

exports.updateStatus = (id, status) =>
  db.oneOrNone('UPDATE blood_requests SET status=$2 WHERE id=$1 RETURNING id', [id, status]);

exports.counts = () =>
  db.one(
    `SELECT count(*) FILTER (WHERE status NOT IN ('Completed','Cancelled'))::int open,
            count(*) FILTER (WHERE urgent AND status NOT IN ('Completed','Cancelled'))::int urgent
     FROM blood_requests`
  );
