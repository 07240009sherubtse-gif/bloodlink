const db = require('../config/db');
const { BLOOD_GROUPS } = require('../utils/constants');

exports.totals = () =>
  db.any('SELECT blood_group, SUM(units)::int units FROM hospital_stock GROUP BY 1 ORDER BY 1');

// { hospital: { 'A+': n, ... } }
exports.byHospital = async () => {
  const rows = await db.any('SELECT * FROM hospital_stock ORDER BY hospital');
  const hospitals = {};
  rows.forEach((r) => ((hospitals[r.hospital] ||= {})[r.blood_group] = r.units));
  return hospitals;
};

exports.hospitalNames = async () =>
  (await db.any('SELECT DISTINCT hospital FROM hospital_stock ORDER BY 1')).map((r) => r.hospital);

// One row per blood group (missing ones as 0), in BLOOD_GROUPS order.
exports.forHospital = async (hospital) => {
  const rows = await db.any('SELECT blood_group, units FROM hospital_stock WHERE hospital=$1', [hospital]);
  const map = Object.fromEntries(rows.map((r) => [r.blood_group, r.units]));
  return BLOOD_GROUPS.map((g) => ({ blood_group: g, units: map[g] ?? 0 }));
};

exports.save = (hospital, units) =>
  db.tx((t) =>
    t.batch(
      Object.entries(units).map(([g, n]) =>
        t.none(
          `INSERT INTO hospital_stock(hospital, blood_group, units) VALUES($1,$2,$3)
           ON CONFLICT (hospital, blood_group) DO UPDATE SET units = EXCLUDED.units`,
          [hospital, g, n]
        )
      )
    )
  );
