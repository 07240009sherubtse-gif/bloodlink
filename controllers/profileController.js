const bcrypt = require('bcrypt');
const User = require('../models/User');
const Donation = require('../models/Donation');
const { ROLES } = require('../utils/constants');
const { validateProfile, validatePasswordChange } = require('../utils/validators');
const flash = require('../utils/flash');

exports.show = async (req, res) => {
  const isDonor = req.user.role === ROLES.USER;
  res.render('profile', {
    p: req.user,
    stats: isDonor ? await Donation.statsForUser(req.user.id) : { total: 0, last: null },
  });
};

exports.update = async (req, res) => {
  const { error, data } = validateProfile(req.body, req.user.role);
  if (error) return flash(res, '/profile', 'err', error);
  await User.updateProfile(req.user.id, data);
  flash(res, '/profile', 'ok', 'Profile updated.');
};

exports.changePassword = async (req, res) => {
  const problem = validatePasswordChange(req.body);
  const hash = await User.getPasswordHash(req.user.id);
  if (problem || !(await bcrypt.compare(String(req.body.old || ''), hash))) {
    return flash(res, '/profile', 'err', problem || 'Password not updated: check your entries');
  }
  await User.updatePassword(req.user.id, await bcrypt.hash(req.body.new, 10));
  flash(res, '/profile', 'ok', 'Password updated.');
};
