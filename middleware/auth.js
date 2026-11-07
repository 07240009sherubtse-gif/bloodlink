const User = require('../models/User');
const navFor = require('../utils/navigation');
const { ROLE_LABELS } = require('../utils/constants');

// Runs on every request. The session only stores the user id; role and status are re-read from the
// database each time, so suspending an account or changing a role takes effect immediately.
async function attachUser(req, res, next) {
  res.locals.user = null;
  const id = req.session && req.session.userId;
  if (!id) return next();
  try {
    const u = await User.findById(id);
    if (!u || u.status !== 'active') {
      const msg = u ? 'Your account is no longer active.' : 'Please log in again.';
      return req.session.destroy(() => res.redirect('/login?err=' + encodeURIComponent(msg)));
    }
    req.user = u;
    res.locals.user = { id: u.id, name: u.full_name, bg: u.blood_group, role: u.role, roleLabel: ROLE_LABELS[u.role], hospital: u.hospital };
    res.locals.nav = navFor(u.role);
    next();
  } catch (e) {
    next(e);
  }
}

const requireAuth = (req, res, next) => (req.user ? next() : res.redirect('/login'));

// requireRole('admin') or requireRole('healthcare', 'admin'): login required, then role must match.
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.redirect('/login');
  if (!roles.includes(req.user.role)) return res.status(403).render('forbidden', { title: 'Access denied' });
  next();
};

module.exports = { attachUser, requireAuth, requireRole };
