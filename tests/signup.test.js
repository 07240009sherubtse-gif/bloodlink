jest.mock('../models/User');
jest.mock('../models/Stock');

const User = require('../models/User');
const Stock = require('../models/Stock');
const { request, app } = require('./helpers');

const valid = { full_name: 'Tashi', phone: '17', email: 'a@b.co', blood_group: 'A+', password: 'secret1', confirm: 'secret1' };

beforeEach(() => {
  jest.resetAllMocks();
  Stock.hospitalNames.mockResolvedValue(['JDWNR Hospital']);
  User.emailExists.mockResolvedValue(false);
  User.create.mockResolvedValue({ id: 5 });
});

test('signup page offers all three roles', async () => {
  const res = await request(app).get('/signup');
  expect(res.status).toBe(200);
  expect(res.text).toMatch(/value="user"/);
  expect(res.text).toMatch(/value="healthcare"/);
  expect(res.text).toMatch(/value="admin"/);
});

test('a user is active immediately and logged in', async () => {
  const res = await request(app).post('/signup').type('form').send({ ...valid, role: 'user' });
  expect(res.status).toBe(302);
  expect(res.headers.location).toBe('/dashboard');
  expect(User.create.mock.calls[0][0]).toMatchObject({ role: 'user', status: 'active' });
});

test.each([
  ['healthcare', { license_number: 'L-1', hospital: 'JDWNR Hospital' }],
  ['admin', {}],
])('%s signup is created as pending and not logged in', async (role, extra) => {
  const res = await request(app).post('/signup').type('form').send({ ...valid, role, ...extra });
  expect(res.status).toBe(200);
  expect(res.text).toMatch(/awaiting verification/i);
  expect(User.create.mock.calls[0][0]).toMatchObject({ role, status: 'pending' });
  expect(res.headers['set-cookie']).toBeUndefined();
});

test('a submitted status field cannot activate a privileged account', async () => {
  await request(app).post('/signup').type('form').send({ ...valid, role: 'admin', status: 'active' });
  expect(User.create.mock.calls[0][0].status).toBe('pending');
});

test('healthcare signup without a license is rejected', async () => {
  const res = await request(app).post('/signup').type('form').send({ ...valid, role: 'healthcare', hospital: 'H' });
  expect(res.status).toBe(400);
  expect(User.create).not.toHaveBeenCalled();
});

test('duplicate email is rejected', async () => {
  User.emailExists.mockResolvedValue(true);
  const res = await request(app).post('/signup').type('form').send({ ...valid, role: 'user' });
  expect(res.status).toBe(400);
  expect(res.text).toMatch(/already registered/i);
});
