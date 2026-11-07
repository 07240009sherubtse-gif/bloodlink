require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const { attachUser } = require('./middleware/auth');
const routes = require('./routes');
const { BLOOD_GROUPS, ROLE_LABELS, stockStatus } = require('./utils/constants');

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production');
}

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev',
    resave: false,
    saveUninitialized: false,
    // sameSite 'lax' stops other sites from submitting POST forms (e.g. admin actions) with the user's cookie.
    cookie: { httpOnly: true, sameSite: 'lax' },
  })
);

// Variables available in every view.
app.use((req, res, next) => {
  res.locals.err = req.query.err || null;
  res.locals.ok = req.query.ok || null;
  res.locals.active = req.path;
  res.locals.nav = [];
  res.locals.form = {};
  res.locals.G = BLOOD_GROUPS;
  res.locals.stat = stockStatus;
  res.locals.ROLE_LABELS = ROLE_LABELS;
  next();
});

app.use(attachUser);
app.use('/', routes);

app.use((req, res) => res.status(404).send('Page not found.'));
app.use((e, req, res, next) => {
  console.error(e);
  res.status(500).send('Something went wrong.');
});

module.exports = app;
