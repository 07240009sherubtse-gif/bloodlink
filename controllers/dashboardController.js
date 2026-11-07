const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const Donation = require('../models/Donation');
const Stock = require('../models/Stock');
const Alert = require('../models/Alert');
const { ROLES } = require('../utils/constants');

async function userDashboard(req, res) {
  const { id } = req.user;
  const [stock, requests, alert, donors] = await Promise.all([
    Stock.totals(),
    BloodRequest.listByUser(id, 5),
    Alert.latest(),
    User.listDonors({ excludeId: id, limit: 5 }),
  ]);
  res.render('dashboard', { stock, requests, alert, donors });
}

async function healthcareDashboard(req, res) {
  const { hospital } = req.user;
  const [counts, pendingDonations, openRequests, hospitalStock, alert] = await Promise.all([
    BloodRequest.counts(),
    Donation.countPending(),
    BloodRequest.listOpen(5),
    hospital ? Stock.forHospital(hospital) : [],
    Alert.latest(),
  ]);
  res.render('healthcare-dashboard', { counts, pendingDonations, openRequests, hospitalStock, alert });
}

async function adminDashboard(req, res) {
  const [counts, stock, requestCounts, pendingDonations, recent] = await Promise.all([
    User.counts(),
    Stock.totals(),
    BloodRequest.counts(),
    Donation.countPending(),
    User.recent(5),
  ]);
  res.render('admin-dashboard', {
    counts, requestCounts, pendingDonations, recent,
    criticalGroups: stock.filter((s) => s.units < 4).length,
  });
}

exports.show = (req, res) => {
  if (req.user.role === ROLES.ADMIN) return adminDashboard(req, res);
  if (req.user.role === ROLES.HEALTHCARE) return healthcareDashboard(req, res);
  return userDashboard(req, res);
};
