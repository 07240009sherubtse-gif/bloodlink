
const {
  BLOOD_GROUPS,
  ROLES,
  REQUEST_STATUSES
} = require('./constants');

const MIN_PASSWORD_LENGTH = 6;

const asForm = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const clean = (v) =>
  typeof v === 'string' ? v.trim() : '';

const isEmail = (v) =>
  typeof v === 'string' &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const isBloodGroup = (v) =>
  BLOOD_GROUPS.includes(v);

// YYYY-MM-DD, a real calendar date, not in the future.
function isPastOrTodayDate(v) {
  if (
    typeof v !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(v)
  ) {
    return false;
  }

  const d = new Date(v + 'T00:00:00Z');

  if (
    Number.isNaN(d.getTime()) ||
    d.toISOString().slice(0, 10) !== v
  ) {
    return false;
  }

  return v <= new Date().toISOString().slice(0, 10);
}

// Positive integer ID from a URL parameter.
function toId(v) {
  if (typeof v !== 'string' || !/^[1-9]\d*$/.test(v)) return null;
  const n = Number(v);
  return Number.isSafeInteger(n) ? n : null;
}

// SIGNUP VALIDATION
function validateSignup(b = {}) {
  b = asForm(b);
  const role = clean(b.role) || ROLES.USER;

  if (!Object.values(ROLES).includes(role)) {
    return { error: 'Please choose a valid account type.' };
  }

  const data = {
    role,
    full_name: clean(b.full_name).slice(0, 100),
    phone: clean(b.phone).slice(0, 30),
    email: clean(b.email).toLowerCase(),
    blood_group: clean(b.blood_group) || null,
    license_number: null,
    hospital: null,
    verification_note: null,
    password:
      typeof b.password === 'string' ? b.password : ''
  };

  if (!data.full_name) {
    return { error: 'Full name is required.' };
  }

  if (!data.phone) {
    return { error: 'Phone number is required.' };
  }

  if (!isEmail(data.email)) {
    return { error: 'Please enter a valid email address.' };
  }

  if (
    data.blood_group !== null &&
    !isBloodGroup(data.blood_group)
  ) {
    return { error: 'Please select a valid blood group.' };
  }

  if (role === ROLES.USER && !data.blood_group) {
    return { error: 'Please select your blood group.' };
  }

  if (role === ROLES.HEALTHCARE) {
    data.license_number =
      clean(b.license_number).slice(0, 60);

    data.hospital =
      clean(b.hospital).slice(0, 120);

    if (!data.license_number) {
      return {
        error: 'Professional license number is required for healthcare professionals.'
      };
    }

    if (!data.hospital) {
      return {
        error: 'Hospital / organization is required for healthcare professionals.'
      };
    }
  }

  if (role !== ROLES.USER) {
    data.verification_note =
      clean(b.verification_note).slice(0, 500) || null;
  }

  if (data.password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    };
  }

  if (data.password !== b.confirm) {
    return { error: 'Passwords do not match' };
  }

  return { data };
}

// PASSWORD CHANGE VALIDATION
function validatePasswordChange(b = {}) {
  b = asForm(b);
  const next =
    typeof b.new === 'string' ? b.new : '';

  if (next.length < MIN_PASSWORD_LENGTH) {
    return `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (next !== b.confirm) {
    return 'Password not updated: check your entries';
  }

  return null;
}

// PROFILE VALIDATION
function validateProfile(b = {}, role) {
  b = asForm(b);
  const data = {
    full_name: clean(b.full_name).slice(0, 100),
    phone: clean(b.phone).slice(0, 30),
    blood_group: clean(b.blood_group),
    dob: clean(b.dob),
    address: clean(b.address).slice(0, 200)
  };

  if (!data.full_name) {
    return { error: 'Full name is required.' };
  }

  if (
    data.blood_group &&
    !isBloodGroup(data.blood_group)
  ) {
    return { error: 'Please select a valid blood group.' };
  }

  if (
    role === ROLES.USER &&
    !data.blood_group
  ) {
    return { error: 'Please select your blood group.' };
  }

  if (
    data.dob &&
    !isPastOrTodayDate(data.dob)
  ) {
    return { error: 'Please enter a valid date of birth.' };
  }

  return { data };
}

// BLOOD REQUEST VALIDATION
function validateBloodRequest(b = {}) {
  b = asForm(b);
  const age = clean(b.age);
  const validAge = age === '' || /^\d+$/.test(age);

  const data = {
    patient_name: clean(b.patient_name).slice(0, 100),
    age: age === '' || !validAge ? null : Number(age),
    gender:
      ['Male', 'Female', 'Other'].includes(b.gender)
        ? b.gender
        : null,
    hospital: clean(b.hospital).slice(0, 120),
    blood_group: clean(b.blood_group),
    urgent: b.urgent === 'yes',
    notes: clean(b.notes).slice(0, 1000)
  };

  if (!data.patient_name) {
    return { error: 'Patient name is required.' };
  }

  if (!data.hospital) {
    return { error: 'Hospital is required.' };
  }

  if (!isBloodGroup(data.blood_group)) {
    return { error: 'Please select a valid blood group.' };
  }

  if (
    (
      !validAge ||
      (data.age !== null && (
        !Number.isSafeInteger(data.age) ||
      data.age < 0 ||
      data.age > 130
      ))
    )
  ) {
    return { error: 'Please enter a valid age.' };
  }

  return { data };
}

// DONOR HEALTH SCREENING AND DONATION VALIDATION
function validateDonation(b = {}) {
  b = asForm(b);
  const hospital = clean(b.hospital).slice(0, 120);
  const blood_group = clean(b.blood_group);
  const donated_on = clean(b.donated_on);

  if (!hospital) {
    return { error: 'Hospital / location is required.' };
  }

  if (!isBloodGroup(blood_group)) {
    return { error: 'Please select a valid blood group.' };
  }

  if (
    donated_on &&
    !isPastOrTodayDate(donated_on)
  ) {
    return {
      error: 'Last donation date must be a valid date that is not in the future.'
    };
  }

  const questions = [
    'feeling_healthy',
    'illness_symptoms',
    'recent_donation',
    'taking_medication',
    'previous_deferral'
  ];

  const answers = {};

  for (const question of questions) {
    const answer = clean(b[question]);

    if (
      answer !== 'yes' &&
      answer !== 'no'
    ) {
      return {
        error: 'Please answer all donor health screening questions.'
      };
    }

    answers[question] = answer === 'yes';
  }

  // Donors must confirm the accuracy of their information.
  if (b.information_confirmed !== 'on') {
    return {
      error: 'Please confirm that your information is accurate.'
    };
  }

  if (b.has_certificate !== 'yes' && b.has_certificate !== 'no') {
    return { error: 'Please indicate whether you have a medical certificate.' };
  }

  // Contact consent is optional and must be freely given.
  const contact_consent = b.contact_consent === 'on';

  if (b.terms !== 'on') {
    return {
      error: 'Please agree to the terms and conditions.'
    };
  }

  const data = {
    hospital,
    blood_group,
    donated_on,
    ...answers,
    has_certificate: b.has_certificate === 'yes',
    information_confirmed: true,
    terms_accepted: true,
    contact_consent
  };

  return { data };
}

// STOCK VALIDATION
function parseStockForm(b = {}) {
  b = asForm(b);
  const units = {};

  for (const g of BLOOD_GROUPS) {
    const raw = clean(b['units_' + g]);
    const n = Number(raw);

    if (
      raw === '' ||
      !Number.isInteger(n) ||
      n < 0 ||
      n > 9999
    ) {
      return {
        error: `Units for ${g} must be a whole number between 0 and 9999.`
      };
    }

    units[g] = n;
  }

  return { units };
}

// ALERT VALIDATION
function validateAlert(b = {}) {
  b = asForm(b);
  const data = {
    title: clean(b.title).slice(0, 150),
    body: clean(b.body).slice(0, 1000)
  };

  if (!data.title) {
    return { error: 'Alert title is required.' };
  }

  if (!data.body) {
    return { error: 'Alert message is required.' };
  }

  return { data };
}

const isRequestStatus = (s) =>
  REQUEST_STATUSES.includes(s);

module.exports = {
  MIN_PASSWORD_LENGTH,
  isEmail,
  isBloodGroup,
  isPastOrTodayDate,
  toId,
  isRequestStatus,
  validateSignup,
  validatePasswordChange,
  validateProfile,
  validateBloodRequest,
  validateDonation,
  parseStockForm,
  validateAlert
};
