const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');
const User = require('../models/User');

// Logs a supertest agent in as a user with the given row (models must be jest.mock'ed).
async function loginAs(row) {
  const password = 'secret1';
  const full = { id: 1, full_name: 'Test Person', email: 't@example.com', phone: '1', blood_group: 'O+',
    status: 'active', hospital: null, ...row, password_hash: await bcrypt.hash(password, 4) };
  User.findByLogin.mockResolvedValue([full]);
  User.findById.mockResolvedValue(full);
  const agent = request.agent(app);
  await agent.post('/login').type('form').send({ email: full.email, password });
  return agent;
}

module.exports = { loginAs, request, app };
