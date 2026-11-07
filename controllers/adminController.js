const User = require('../models/User');
const { ROLES, USER_STATUS } = require('../utils/constants');
const { toId } = require('../utils/validators');
const flash = require('../utils/flash');

const ACTIONS = {
  approve: { from: ['pending', 'rejected'], to: 'active', verify: true, done: 'Account approved.' },
  reject: { from: ['pending'], to: 'rejected', verify: true, done: 'Registration rejected.' },
  suspend: { from: ['active'], to: 'suspended', verify: false, done: 'Account suspended.' },
  reactivate: { from: ['suspended'], to: 'active', verify: false, done: 'Account reactivated.' },
};
const BACK = ['/admin/users', '/admin/verifications'];

exports.verifications = async (req, res) => res.render('admin-verifications', { rows: await User.listPending() });

exports.users = async (req, res) => {
  const role = Object.values(ROLES).includes(req.query.role) ? req.query.role : '';
  const status = Object.values(USER_STATUS).includes(req.query.status) ? req.query.status : '';
  const q = String(req.query.q || '').trim();
  res.render('admin-users', {
    rows: await User.list({ role, status, q }), filters: { role, status, q },
    statuses: Object.values(USER_STATUS), roles: Object.values(ROLES),
  });
};

exports.act = async (req, res) => {
  const back = BACK.includes(req.body.back) ? req.body.back : '/admin/users';
  const id = toId(req.params.id);
  const rule = ACTIONS[req.body.action];
  if (!id || !rule) return flash(res, back, 'err', 'Invalid request.');
  if (id === req.user.id) return flash(res, back, 'err', 'You cannot change your own account.');

  const updated = await User.transition(id, rule.from, rule.to, rule.verify ? req.user.id : null);
  if (!updated) return flash(res, back, 'err', 'That account is not in a state that allows this action.');
  flash(res, back, 'ok', rule.done);
};
