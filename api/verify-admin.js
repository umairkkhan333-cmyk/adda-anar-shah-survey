// POST /api/verify-admin  - admin password check karta hai

const { isValidPassword, parseBody, onlyPost } = require('./_lib');

module.exports = async (req, res) => {
  if (!onlyPost(req, res)) return;

  try {
    if (!process.env.ADMIN_PASSWORD) {
      return res.status(500).json({ valid: false, error: 'ADMIN_PASSWORD set nahi hai' });
    }
    const { password } = parseBody(req);
    const valid = isValidPassword(password);
    return res.status(valid ? 200 : 401).json({ valid });
  } catch (err) {
    console.error('verify-admin error:', err);
    return res.status(500).json({ valid: false, error: 'Server mein masla aa gaya' });
  }
};