const User = require('../models/User');
const { isBloodGroup } = require('../utils/validators');

exports.find = async (req, res) => {
  const term = String(req.query.term || '').trim();
  const bg = isBloodGroup(req.query.bg) ? req.query.bg : '';

  res.render('find', {
    donors: await User.listDonors({
      excludeId: req.user.id,
      bg,
      term
    }),
    bg,
    term
  });
};