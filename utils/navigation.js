const NAV = {
  user: [
    ['/dashboard', 'Dashboard'],
    ['/request', 'Request Blood'],
    ['/donate', 'Donate Blood'],
    ['/availability', 'Blood Availability'],
    ['/find', 'Donor Search'],
    ['/alerts', 'Donation Alerts'],
    ['/my-requests', 'My Requests'],
    ['/my-donations', 'My Donations'],
    ['/profile', 'Profile & Settings'],
  ],
  healthcare: [
    ['/dashboard', 'Dashboard'],
    ['/manage/stock', 'Manage Stock'],
    ['/manage/requests', 'Blood Requests'],
    ['/manage/donations', 'Donations'],
    ['/manage/alerts', 'Alerts'],
    ['/availability', 'Blood Availability'],
    ['/find', 'Donor Search'],
    ['/profile', 'Profile & Settings'],
  ],
  admin: [
    ['/dashboard', 'Dashboard'],
    ['/admin/verifications', 'Verifications'],
    ['/admin/users', 'Users'],
    ['/manage/requests', 'Blood Requests'],
    ['/manage/donations', 'Donations'],
    ['/manage/alerts', 'Alerts'],
    ['/availability', 'Blood Availability'],
    ['/profile', 'Profile & Settings'],
  ],
};

module.exports = (role) => (NAV[role] || []).map(([href, label]) => ({ href, label }));
