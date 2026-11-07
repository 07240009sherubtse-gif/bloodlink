const bcrypt = require('bcrypt');
const User = require('../models/User');
const Stock = require('../models/Stock');
const { ROLE_LABELS, SIGNUP_ROLES, USER_STATUS, requiresVerification } = require('../utils/constants');
const { validateSignup } = require('../utils/validators');
const flash = require('../utils/flash');

const BLOCKED = {
  [USER_STATUS.PENDING]: (u) => `Your ${ROLE_LABELS[u.role]} account is awaiting verification by an administrator. You can log in once it has been approved.`,
  [USER_STATUS.REJECTED]: () => 'Your registration was not approved. Please contact an administrator.',
  [USER_STATUS.SUSPENDED]: () => 'Your account has been suspended. Please contact an administrator.',
};

const startSession = (req, userId) =>
  new Promise((resolve, reject) =>
    // New session id on login (prevents session fixation).
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = userId;
      resolve();
    })
  );

const renderSignup = async (res, extra = {}) =>
  res.render('signup', { roles: SIGNUP_ROLES, hospitals: await Stock.hospitalNames(), form: {}, ...extra });

exports.showLogin = (req, res) => (req.user ? res.redirect('/dashboard') : res.render('login'));

exports.login = async (req, res) => {
  const identifier = String(req.body.email || '').trim();
  const password = String(req.body.password || '');
  const candidates = identifier ? await User.findByLogin(identifier) : [];

  let user = null;
  for (const c of candidates) {
    if (await bcrypt.compare(password, c.password_hash)) { user = c; break; }
  }
  if (!user) return flash(res, '/login', 'err', 'Invalid email/phone or password');

  // Only reveal the account's status once the password was correct.
  const blocked = BLOCKED[user.status];
  if (blocked) return flash(res, '/login', 'err', blocked(user));

  await startSession(req, user.id);
  res.redirect('/dashboard');
};

exports.showSignup = (req, res) => (req.user ? res.redirect('/dashboard') : renderSignup(res));

exports.signup = async (req, res) => {
  const fail = (msg) => renderSignup(res.status(400), { err: msg, form: req.body });

  const { error, data } = validateSignup(req.body);
  if (error) return fail(error);
  if (await User.emailExists(data.email)) return fail('Email already registered');

  // Status is decided here, never by the form: admin and healthcare accounts start as pending.
  const status = requiresVerification(data.role) ? USER_STATUS.PENDING : USER_STATUS.ACTIVE;
  const { password, ...profile } = data;

  let user;
  try {
    user = await User.create({ ...profile, password_hash: await bcrypt.hash(password, 10), status });
  } catch (e) {
    if (e.code === '23505') return fail('Email already registered'); // unique violation (race)
    throw e;
  }

  if (status === USER_STATUS.PENDING) {
    return res.render('signup-success', { roleLabel: ROLE_LABELS[data.role] });
  }
  await startSession(req, user.id);
  res.redirect('/dashboard');
};

exports.logout = (req, res) => req.session.destroy(() => res.redirect('/login'));
