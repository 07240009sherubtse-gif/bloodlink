jest.mock('../models/User');
jest.mock('../models/Donation');

const User = require('../models/User');
const Donation = require('../models/Donation');
const { loginAs, request, app } = require('./helpers');

const validRegistration = {
  hospital: 'JDWNR Hospital',
  blood_group: 'O+',
  donated_on: '',
  feeling_healthy: 'yes',
  illness_symptoms: 'no',
  recent_donation: 'no',
  taking_medication: 'no',
  previous_deferral: 'no',
  has_certificate: 'no',
  information_confirmed: 'on',
  terms: 'on'
};

beforeEach(() => {
  jest.resetAllMocks();
  Donation.create.mockResolvedValue(undefined);
});

test('user registration is saved and redirected to the success page', async () => {
  const agent = await loginAs({ role: 'user', id: 17, blood_group: 'O+' });
  const res = await agent
    .post('/donate')
    .type('form')
    .send(validRegistration);

  expect(Donation.create).toHaveBeenCalledWith(17, {
    hospital: 'JDWNR Hospital',
    blood_group: 'O+',
    donated_on: '',
    feeling_healthy: true,
    illness_symptoms: false,
    recent_donation: false,
    taking_medication: false,
    previous_deferral: false,
    has_certificate: false,
    information_confirmed: true,
    terms_accepted: true,
    contact_consent: false
  });
  expect(res.status).toBe(302);
  expect(res.headers.location).toMatch(/^\/success\?m=/);

  const success = await agent.get(res.headers.location);
  expect(success.status).toBe(200);
  expect(success.text).toMatch(/submitted successfully/i);
});

test('invalid registration is not saved', async () => {
  const agent = await loginAs({ role: 'user' });
  const res = await agent
    .post('/donate')
    .type('form')
    .send({ ...validRegistration, terms: undefined });

  expect(Donation.create).not.toHaveBeenCalled();
  expect(res.status).toBe(302);
  expect(res.headers.location).toMatch(/^\/donate\?err=/);
});

test('database errors are not reported as successful registrations', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  Donation.create.mockRejectedValue(new Error('database unavailable'));
  const agent = await loginAs({ role: 'user' });

  try {
    const res = await agent
      .post('/donate')
      .type('form')
      .send(validRegistration);

    expect(res.status).toBe(500);
    expect(res.text).toMatch(/something went wrong/i);
    expect(Donation.create).toHaveBeenCalled();
  } finally {
    errorSpy.mockRestore();
  }
});
