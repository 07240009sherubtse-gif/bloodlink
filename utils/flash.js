// Redirect with a message in the query string (?err=... or ?ok=...), as the original app did.
module.exports = (res, path, key, message) =>
  res.redirect(`${path}?${key}=${encodeURIComponent(message)}`);
