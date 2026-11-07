const v = require('./validators');

const base = {
  role: 'user', full_name: 'Tashi Dorji', phone: '17123456', email: 'Tashi@Example.com',
  blood_group: 'O+', password: 'secret1', confirm: 'secret1',
};

describe('validateSignup', () => {
  test('accepts a user and lowercases the email', () => {
    const { error, data } = v.validateSignup(base);
    expect(error).toBeUndefined();
    expect(data.email).toBe('tashi@example.com');
    expect(data.role).toBe('user');
  });

  test('defaults to user when no role is sent', () => {
    expect(v.validateSignup({ ...base, role: undefined }).data.role).toBe('user');
  });

  test('rejects an unknown role', () => {
    expect(v.validateSignup({ ...base, role: 'superadmin' }).error).toMatch(/account type/i);
  });

  test('users need a blood group; staff do not', () => {
    expect(v.validateSignup({ ...base, blood_group: '' }).error).toMatch(/blood group/i);
    const admin = v.validateSignup({ ...base, role: 'admin', blood_group: '' });
    expect(admin.error).toBeUndefined();
    expect(admin.data.blood_group).toBeNull();
  });

  test('rejects an invalid blood group', () => {
    expect(v.validateSignup({ ...base, blood_group: 'Z+' }).error).toMatch(/blood group/i);
  });

  test('healthcare professionals need a license and hospital', () => {
    const hc = { ...base, role: 'healthcare' };
    expect(v.validateSignup(hc).error).toMatch(/license/i);
    expect(v.validateSignup({ ...hc, license_number: 'BMHC-1' }).error).toMatch(/hospital/i);
    const ok = v.validateSignup({ ...hc, license_number: 'BMHC-1', hospital: 'JDWNR Hospital' });
    expect(ok.error).toBeUndefined();
    expect(ok.data.hospital).toBe('JDWNR Hospital');
  });

  test('license and hospital are dropped for plain users', () => {
    const { data } = v.validateSignup({ ...base, license_number: 'X', hospital: 'Y' });
    expect(data.license_number).toBeNull();
    expect(data.hospital).toBeNull();
  });

  test('never reads a status from the form', () => {
    const { data } = v.validateSignup({ ...base, status: 'active' });
    expect(data.status).toBeUndefined();
  });

  test('password rules', () => {
    expect(v.validateSignup({ ...base, password: 'abc', confirm: 'abc' }).error).toMatch(/at least/i);
    expect(v.validateSignup({ ...base, confirm: 'nope' }).error).toMatch(/do not match/i);
  });

  test('requires name, phone and a valid email', () => {
    expect(v.validateSignup({ ...base, full_name: ' ' }).error).toMatch(/name/i);
    expect(v.validateSignup({ ...base, phone: '' }).error).toMatch(/phone/i);
    expect(v.validateSignup({ ...base, email: 'nope' }).error).toMatch(/email/i);
  });
});

describe('other validators', () => {
  test('isPastOrTodayDate', () => {
    expect(v.isPastOrTodayDate('2020-02-29')).toBe(true);
    expect(v.isPastOrTodayDate('2021-02-29')).toBe(false);
    expect(v.isPastOrTodayDate('2999-01-01')).toBe(false);
    expect(v.isPastOrTodayDate('01/02/2020')).toBe(false);
  });

  test('toId', () => {
    expect(v.toId('12')).toBe(12);
    expect(v.toId('0')).toBeNull();
    expect(v.toId('1; DROP')).toBeNull();
    expect(v.toId('1.5')).toBeNull();
  });

  test('parseStockForm', () => {
    const good = {};
    ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].forEach((g) => (good['units_' + g] = '7'));
    expect(v.parseStockForm(good).units['AB-']).toBe(7);
    expect(v.parseStockForm({ ...good, 'units_O+': '-1' }).error).toMatch(/O\+/);
    expect(v.parseStockForm({ ...good, 'units_A+': '' }).error).toMatch(/A\+/);
  });

  test('validateBloodRequest', () => {
    const ok = { patient_name: 'P', hospital: 'H', blood_group: 'A+', age: '30', urgent: 'yes' };
    expect(v.validateBloodRequest(ok).data.urgent).toBe(true);
    expect(v.validateBloodRequest({ ...ok, blood_group: 'Q' }).error).toBeDefined();
    expect(v.validateBloodRequest({ ...ok, age: '-3' }).error).toBeDefined();
  });

  test('validateDonation', () => {
    expect(v.validateDonation({ hospital: 'H', blood_group: 'B-', donated_on: '' }).error).toBeUndefined();
    expect(v.validateDonation({ hospital: '', blood_group: 'B-' }).error).toBeDefined();
  });

  test('validateAlert', () => {
    expect(v.validateAlert({ title: 'T', body: 'B' }).data.title).toBe('T');
    expect(v.validateAlert({ title: '', body: 'B' }).error).toBeDefined();
  });
});
