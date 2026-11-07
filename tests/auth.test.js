jest.mock('../models/User');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { request, app } = require('./helpers');

async function row(status) {
  return { id: 2, role: 'healthcare', status, email: 'h@x.co', password_hash: await bcrypt.hash('secret1', 4) };
}
const login = (password = 'secret1') => request(app).post('/login').type('form').send({ email: 'h@x.co', password });

beforeEach(() => jest.resetAllMocks());

test('active account logs in', async () => {
  User.findByLogin.mockResolvedValue([await row('active')]);
  const res = await login();
  expect(res.headers.location).toBe('/dashboard');
});

test.each([
  ['pending', /awaiting verification/i],
  ['rejected', /not approved/i],
  ['suspended', /suspended/i],
])('%s account cannot log in', async (status, message) => {
  User.findByLogin.mockResolvedValue([await row(status)]);
  const res = await login();
  expect(res.headers.location).toMatch(/^\/login\?err=/);
  expect(decodeURIComponent(res.headers.location)).toMatch(message);
  expect(res.headers['set-cookie']).toBeUndefined();
});

test('wrong password gives the generic error, even for pending accounts', async () => {
  User.findByLogin.mockResolvedValue([await row('pending')]);
  const res = await login('wrong');
  expect(decodeURIComponent(res.headers.location)).toMatch(/invalid email\/phone or password/i);
});
