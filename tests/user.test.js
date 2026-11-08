jest.mock('../config/db', () => ({ any: jest.fn() }));

const db = require('../config/db');
const User = require('../models/User');

beforeEach(() => jest.clearAllMocks());

test('findByLogin matches phone numbers regardless of formatting', () => {
  User.findByLogin('+975 17-123-456');

  expect(db.any).toHaveBeenCalledWith(
    expect.stringContaining("regexp_replace(COALESCE(phone,''), '[^0-9]', '', 'g')=$2"),
    ['+975 17-123-456', '97517123456']
  );
});

test('findByLogin does not compare empty phone digits', () => {
  User.findByLogin('person@example.com');

  expect(db.any).toHaveBeenCalledWith(
    expect.stringContaining("($2<>'' AND regexp_replace"),
    ['person@example.com', '']
  );
});
