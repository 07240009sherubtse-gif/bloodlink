jest.mock('../models/User');
jest.mock('../models/Stock');
jest.mock('../models/BloodRequest');
jest.mock('../models/Donation');
jest.mock('../models/Alert');

const User = require('../models/User');
const Stock = require('../models/Stock');
const BloodRequest = require('../models/BloodRequest');
const Donation = require('../models/Donation');
const Alert = require('../models/Alert');
const { loginAs, request, app } = require('./helpers');

beforeEach(() => {
  jest.resetAllMocks();
  Stock.totals.mockResolvedValue([{ blood_group: 'A+', units: 9 }]);
  Stock.byHospital.mockResolvedValue({});
  Stock.forHospital.mockResolvedValue([{ blood_group: 'A+', units: 3 }]);
  BloodRequest.listAll.mockResolvedValue([]);
  BloodRequest.listByUser.mockResolvedValue([]);
  BloodRequest.counts.mockResolvedValue({ open: 0, urgent: 0 });
  BloodRequest.listOpen.mockResolvedValue([]);
  Donation.listAll.mockResolvedValue([]);
  Donation.countPending.mockResolvedValue(0);
  Alert.latest.mockResolvedValue(null);
  Alert.all.mockResolvedValue([]);
  User.listDonors.mockResolvedValue([]);
  User.list.mockResolvedValue([]);
  User.listPending.mockResolvedValue([]);
  User.recent.mockResolvedValue([]);
  User.counts.mockResolvedValue({ users: 0, healthcare: 0, admins: 1, pending: 0, suspended: 0 });
});

test('anonymous visitors are sent to /login', async () => {
  for (const path of ['/dashboard', '/donate', '/manage/stock', '/admin/users']) {
    const res = await request(app).get(path);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  }
});

describe('user role', () => {
  test('can donate and request with the same account', async () => {
    const agent = await loginAs({ role: 'user' });
    expect((await agent.get('/donate')).status).toBe(200);
    expect((await agent.get('/request')).status).toBe(200);
  });
  test.each(['/manage/stock', '/manage/requests', '/manage/alerts', '/admin/users', '/admin/verifications'])(
    'is blocked from %s', async (path) => {
      const agent = await loginAs({ role: 'user' });
      expect((await agent.get(path)).status).toBe(403);
    });
  test('cannot post admin actions', async () => {
    const agent = await loginAs({ role: 'user' });
    const res = await agent.post('/admin/users/3/action').type('form').send({ action: 'approve' });
    expect(res.status).toBe(403);
    expect(User.transition).not.toHaveBeenCalled();
  });
});

describe('healthcare role', () => {
  test('can open stock, requests, donations and alerts', async () => {
    const agent = await loginAs({ role: 'healthcare', hospital: 'JDWNR Hospital' });
    for (const path of ['/manage/stock', '/manage/requests', '/manage/donations', '/manage/alerts', '/dashboard']) {
      expect((await agent.get(path)).status).toBe(200);
    }
  });
  test('cannot donate, request blood or use admin pages', async () => {
    const agent = await loginAs({ role: 'healthcare', hospital: 'H' });
    for (const path of ['/donate', '/request', '/admin/users']) expect((await agent.get(path)).status).toBe(403);
  });
  test('stock is saved to their own hospital only', async () => {
    const agent = await loginAs({ role: 'healthcare', hospital: 'JDWNR Hospital' });
    const body = { hospital: 'Someone Else' };
    ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].forEach((g) => (body['units_' + g] = '10'));
    await agent.post('/manage/stock').type('form').send(body);
    expect(Stock.save.mock.calls[0][0]).toBe('JDWNR Hospital');
  });
});

describe('admin role', () => {
  test('can open admin pages and the dashboard', async () => {
    const agent = await loginAs({ role: 'admin' });
    for (const path of ['/dashboard', '/admin/users', '/admin/verifications', '/manage/requests', '/manage/alerts']) {
      expect((await agent.get(path)).status).toBe(200);
    }
  });
  test('cannot change request status or edit stock', async () => {
    const agent = await loginAs({ role: 'admin' });
    expect((await agent.post('/manage/requests/1/status').type('form').send({ status: 'Completed' })).status).toBe(403);
    expect((await agent.get('/manage/stock')).status).toBe(403);
  });
  test('approving records the verifying admin', async () => {
    User.transition.mockResolvedValue(9);
    const agent = await loginAs({ role: 'admin', id: 1 });
    await agent.post('/admin/users/9/action').type('form').send({ action: 'approve', back: '/admin/verifications' });
    expect(User.transition).toHaveBeenCalledWith(9, ['pending', 'rejected'], 'active', 1);
  });
  test('cannot act on their own account', async () => {
    const agent = await loginAs({ role: 'admin', id: 1 });
    const res = await agent.post('/admin/users/1/action').type('form').send({ action: 'suspend' });
    expect(decodeURIComponent(res.headers.location)).toMatch(/your own account/i);
    expect(User.transition).not.toHaveBeenCalled();
  });
});

test('a suspended account is logged out on its next request', async () => {
  const agent = await loginAs({ role: 'user' });
  User.findById.mockResolvedValue({ id: 1, role: 'user', status: 'suspended' });
  const res = await agent.get('/dashboard');
  expect(res.status).toBe(302);
  expect(res.headers.location).toMatch(/^\/login\?err=/);
});
