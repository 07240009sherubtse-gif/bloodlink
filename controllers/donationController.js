
const Donation = require('../models/Donation');
const { validateDonation } = require('../utils/validators');
const flash = require('../utils/flash');

exports.showForm = (req, res) => res.render('donate');

exports.submit = async (req, res) => {
  const { error, data } = validateDonation(req.body);
  if (error) return flash(res, '/donate', 'err', error);

  await Donation.create(req.user.id, data);
  return flash(
    res,
    '/success',
    'm',
    'Your donor registration has been submitted successfully.'
  );
};

exports.mine = async (req, res) =>
  res.render('my-donations', {
    rows: await Donation.listByUser(req.user.id)
  });
