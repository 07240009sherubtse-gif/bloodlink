const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const ROLES = { ADMIN: 'admin', HEALTHCARE: 'healthcare', USER: 'user' };

const ROLE_LABELS = {
  admin: 'Admin',
  healthcare: 'Healthcare Professional',
  user: 'User',
};

// Roles that must be approved by an admin before they can log in.
const VERIFIED_ROLES = [ROLES.ADMIN, ROLES.HEALTHCARE];
const requiresVerification = (role) => VERIFIED_ROLES.includes(role);

const USER_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

// Shown on the signup page, in this order.
const SIGNUP_ROLES = [
  { value: ROLES.USER, label: 'User', desc: 'Donate and request blood with one account.', verify: false },
  { value: ROLES.HEALTHCARE, label: 'Healthcare Professional', desc: 'Manage blood stock, requests and alerts.', verify: true },
  { value: ROLES.ADMIN, label: 'Admin', desc: 'Manage users and oversee the whole system.', verify: true },
];

const REQUEST_STATUSES = ['Requested', 'In Progress', 'Donor Assigned', 'Completed', 'Cancelled'];
const DONATION_STATUSES = ['Pending', 'Approved', 'Completed', 'Rejected'];
const OPEN_REQUEST_STATUSES = ['Requested', 'In Progress', 'Donor Assigned'];

const stockStatus = (u) => (u >= 8 ? 'Available' : u >= 4 ? 'Low' : 'Critical');

module.exports = {
  BLOOD_GROUPS, ROLES, ROLE_LABELS, VERIFIED_ROLES, requiresVerification, USER_STATUS,
  SIGNUP_ROLES, REQUEST_STATUSES, DONATION_STATUSES, OPEN_REQUEST_STATUSES, stockStatus,
};
