const User = require('../models/User');
const { ROLES } = require('../utils/constants');
const { isBloodGroup } = require('../utils/validators');

exports.find = async (req, res) => {
  const term = String(req.query.term || '').trim();
  const bg = isBloodGroup(req.query.bg) ? req.query.bg : '';
  const canViewContact = req.user.role === ROLES.HEALTHCARE;

  res.render('find', {
    donors: await User.listDonors({
      excludeId: req.user.id,
      bg,
      term,
      includeContact: canViewContact
    }),
    bg,
    term,
    canViewContact
  });
};