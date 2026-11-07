const BloodRequest = require('../models/BloodRequest');
const { validateBloodRequest } = require('../utils/validators');
const flash = require('../utils/flash');

exports.showForm = (req, res) => res.render('request');

exports.submit = async (req, res) => {
  const { error, data } = validateBloodRequest(req.body);
  if (error) return flash(res, '/request', 'err', error);
  await BloodRequest.create(req.user.id, data);
  flash(res, '/success', 'm', 'Your blood request has been submitted.');
};

exports.mine = async (req, res) => res.render('my-requests', { rows: await BloodRequest.listByUser(req.user.id) });

exports.success = (req, res) => res.render('success', { m: req.query.m || 'Done.' });
