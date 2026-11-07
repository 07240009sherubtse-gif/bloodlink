const Stock = require('../models/Stock');

exports.show = async (req, res) => {
  const [stock, hospitals] = await Promise.all([Stock.totals(), Stock.byHospital()]);
  res.render('availability', { stock, hospitals });
};
