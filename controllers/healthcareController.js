const Stock = require('../models/Stock');
const BloodRequest = require('../models/BloodRequest');
const Donation = require('../models/Donation');
const { ROLES, REQUEST_STATUSES, DONATION_STATUSES } = require('../utils/constants');
const { parseStockForm, toId } = require('../utils/validators');
const flash = require('../utils/flash');

// Admins can open the requests/donations lists to oversee them but only healthcare can change them.
const canManage = (req) => req.user.role === ROLES.HEALTHCARE;

// ---- Stock (healthcare only, for their own hospital) ----
exports.stockPage = async (req, res) => {
  const { hospital } = req.user;
  res.render('manage-stock', { hospital, rows: hospital ? await Stock.forHospital(hospital) : [] });
};

exports.saveStock = async (req, res) => {
  const { hospital } = req.user;
  if (!hospital) return flash(res, '/manage/stock', 'err', 'Your account has no hospital assigned.');
  const { error, units } = parseStockForm(req.body);
  if (error) return flash(res, '/manage/stock', 'err', error);
  await Stock.save(hospital, units);
  flash(res, '/manage/stock', 'ok', 'Stock levels updated.');
};

// ---- Blood requests ----
exports.requests = async (req, res) => {
  const status = REQUEST_STATUSES.includes(req.query.status) ? req.query.status : '';
  res.render('manage-requests', {
    rows: await BloodRequest.listAll(status), status, statuses: REQUEST_STATUSES, canManage: canManage(req),
  });
};

exports.updateRequest = async (req, res) => {
  const id = toId(req.params.id);
  if (!id || !REQUEST_STATUSES.includes(req.body.status)) return flash(res, '/manage/requests', 'err', 'Invalid request.');
  const row = await BloodRequest.updateStatus(id, req.body.status);
  flash(res, '/manage/requests', row ? 'ok' : 'err', row ? `Request marked "${req.body.status}".` : 'Request not found.');
};

// ---- Donations ----
exports.donations = async (req, res) => {
  const status = DONATION_STATUSES.includes(req.query.status) ? req.query.status : '';
  res.render('manage-donations', {
    rows: await Donation.listAll(status), status, statuses: DONATION_STATUSES, canManage: canManage(req),
    hospital: req.user.hospital,
  });
};

exports.updateDonation = async (req, res) => {
  const id = toId(req.params.id);
  if (!id || !DONATION_STATUSES.includes(req.body.status)) return flash(res, '/manage/donations', 'err', 'Invalid request.');
  const result = await Donation.setStatus(id, req.body.status, req.user.hospital);
  if (result === 'notfound') return flash(res, '/manage/donations', 'err', 'Donation not found.');
  if (result === 'locked') return flash(res, '/manage/donations', 'err', 'Completed donations can no longer be changed.');
  if (result === 'screening_required') return flash(res, '/manage/donations', 'err', 'Review the donor screening before marking this donation completed.');
  const extra = result === 'credited' ? ` 1 unit added to ${req.user.hospital} stock.` : '';
  flash(res, '/manage/donations', 'ok', `Donation marked "${req.body.status}".${extra}`);
};

exports.reviewDonationScreening = async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return flash(res, '/manage/donations', 'err', 'Invalid donation.');

  const result = await Donation.reviewScreening(id, req.user.id);
  if (result === 'notfound') return flash(res, '/manage/donations', 'err', 'Donation not found.');
  if (result === 'already_reviewed') return flash(res, '/manage/donations', 'err', 'This screening has already been reviewed.');
  flash(res, '/manage/donations', 'ok', 'Donor screening marked as reviewed.');
};
