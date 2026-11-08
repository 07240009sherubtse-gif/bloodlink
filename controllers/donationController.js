
const Donation = require('../models/Donation');
const { validateDonation } = require('../utils/validators');
const flash = require('../utils/flash');

exports.showForm = (req, res) => res.render('donate');

exports.submit = async (req, res) => {
  try {
    console.log('Donation submission received');

    const { error, data } = validateDonation(req.body);

    if (error) {
      console.error('Donation validation error:', error);
      return flash(res, '/donate', 'err', error);
    }

    await Donation.create(req.user.id, data);

    console.log('Donation registration saved successfully');

    return flash(
      res,
      '/success',
      'm',
      'Your donor registration has been submitted successfully.'
    );

  } catch (error) {
    console.error('DONATION SUBMISSION ERROR:', error);

    return flash(
      res,
      '/donate',
      'err',
      'Unable to save your registration. Please try again.'
    );
  }
};

exports.mine = async (req, res) =>
  res.render('my-donations', {
    rows: await Donation.listByUser(req.user.id)
  });
