const router = require('express').Router();
const wrap = require('../utils/asyncHandler');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

const auth = require('../controllers/authController');
const dashboard = require('../controllers/dashboardController');
const profile = require('../controllers/profileController');
const request = require('../controllers/requestController');
const donation = require('../controllers/donationController');
const availability = require('../controllers/availabilityController');
const donor = require('../controllers/donorController');
const alert = require('../controllers/alertController');
const healthcare = require('../controllers/healthcareController');
const admin = require('../controllers/adminController');

const { USER, HEALTHCARE, ADMIN } = ROLES;

// ---- Public ----
router.get('/', (req, res) => res.redirect(req.user ? '/dashboard' : '/login'));
router.get('/login', auth.showLogin);
router.post('/login', wrap(auth.login));
router.get('/signup', wrap(auth.showSignup));
router.post('/signup', wrap(auth.signup));
router.get('/register', (req, res) => res.redirect('/signup')); // old URL
router.get('/logout', auth.logout);

// ---- Any logged-in role ----
router.get('/dashboard', requireAuth, wrap(dashboard.show));
router.get('/availability', requireAuth, wrap(availability.show));
router.get('/alerts', requireAuth, wrap(alert.list));
router.get('/profile', requireAuth, wrap(profile.show));
router.post('/profile', requireAuth, wrap(profile.update));
router.post('/profile/password', requireAuth, wrap(profile.changePassword));

// ---- Users: donate and request with the same account ----
const userOnly = requireRole(USER);
router.get('/request', userOnly, request.showForm);
router.post('/request', userOnly, wrap(request.submit));
router.get('/donate', userOnly, donation.showForm);
router.post('/donate', userOnly, wrap(donation.submit));
router.get('/my-requests', userOnly, wrap(request.mine));
router.get('/my-donations', userOnly, wrap(donation.mine));
router.get('/success', userOnly, request.success);

// ---- Donor search: users and healthcare professionals ----
router.get('/find', requireRole(USER, HEALTHCARE), wrap(donor.find));

// ---- Healthcare professionals: stock, requests, donations ----
const clinician = requireRole(HEALTHCARE);
router.get('/manage/stock', clinician, wrap(healthcare.stockPage));
router.post('/manage/stock', clinician, wrap(healthcare.saveStock));
router.post('/manage/requests/:id/status', clinician, wrap(healthcare.updateRequest));
router.post('/manage/donations/:id/status', clinician, wrap(healthcare.updateDonation));
router.post('/manage/donations/:id/screening', clinician, wrap(healthcare.reviewDonationScreening));

// ---- Healthcare + admin: view requests/donations (admin read-only), manage alerts ----
const staff = requireRole(HEALTHCARE, ADMIN);
router.get('/manage/requests', staff, wrap(healthcare.requests));
router.get('/manage/donations', staff, wrap(healthcare.donations));
router.get('/manage/alerts', staff, wrap(alert.manage));
router.post('/manage/alerts', staff, wrap(alert.create));
router.post('/manage/alerts/:id/delete', staff, wrap(alert.remove));

// ---- Admin ----
const adminOnly = requireRole(ADMIN);
router.get('/admin/verifications', adminOnly, wrap(admin.verifications));
router.get('/admin/users', adminOnly, wrap(admin.users));
router.post('/admin/users/:id/action', adminOnly, wrap(admin.act));

module.exports = router;
