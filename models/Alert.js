const db = require('../config/db');

exports.latest = () => db.oneOrNone('SELECT * FROM alerts ORDER BY id DESC LIMIT 1');
exports.all = () => db.any('SELECT a.*, u.full_name AS author FROM alerts a LEFT JOIN users u ON u.id=a.created_by ORDER BY a.id DESC');
exports.create = (d, userId) => db.none('INSERT INTO alerts(title, body, created_by) VALUES($1,$2,$3)', [d.title, d.body, userId]);
exports.remove = (id) => db.oneOrNone('DELETE FROM alerts WHERE id=$1 RETURNING id', [id]);
