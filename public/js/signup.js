// Shows only the signup fields that apply to the selected account type.
(function () {
  var form = document.getElementById('signup-form');
  if (!form) return;
  var bg = form.querySelector('[name="blood_group"]');
  var bgOptional = form.querySelector('[data-bg-optional]');
  var note = form.querySelector('[data-verify-note]');

  function sync() {
    var checked = form.querySelector('input[name="role"]:checked');
    var role = checked ? checked.value : 'user';
    form.querySelectorAll('[data-role-fields]').forEach(function (group) {
      var show = group.getAttribute('data-role-fields').split(' ').indexOf(role) !== -1;
      group.hidden = !show;
      group.querySelectorAll('[data-required-for]').forEach(function (input) {
        input.required = show && input.getAttribute('data-required-for').split(' ').indexOf(role) !== -1;
      });
    });
    bg.required = role === 'user';
    bgOptional.hidden = role === 'user';
    note.hidden = role === 'user';
  }

  form.querySelectorAll('input[name="role"]').forEach(function (r) { r.addEventListener('change', sync); });
  sync();
})();
