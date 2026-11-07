const Alert = require('../models/Alert');
const { validateAlert, toId } = require('../utils/validators');
const flash = require('../utils/flash');

exports.list = async (req, res) => res.render('alerts', { alerts: await Alert.all() });

// Healthcare professionals and admins.
exports.manage = async (req, res) => res.render('manage-alerts', { alerts: await Alert.all() });

exports.create = async (req, res) => {
  const { error, data } = validateAlert(req.body);
  if (error) return flash(res, '/manage/alerts', 'err', error);
  await Alert.create(data, req.user.id);
  flash(res, '/manage/alerts', 'ok', 'Alert published.');
};

exports.remove = async (req, res) => {
  const id = toId(req.params.id);
  const removed = id && (await Alert.remove(id));
  flash(res, '/manage/alerts', removed ? 'ok' : 'err', removed ? 'Alert deleted.' : 'Alert not found.');
};
