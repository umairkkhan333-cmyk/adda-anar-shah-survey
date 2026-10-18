// POST /api/stats  - { total, averageRating } wapas karta hai (sirf admin ke liye)

const { getSupabase, isValidPassword, parseBody, onlyPost } = require('./_lib');

module.exports = async (req, res) => {
  if (!onlyPost(req, res)) return;

  try {
    if (!process.env.ADMIN_PASSWORD) {
      return res.status(500).json({ success: false, error: 'ADMIN_PASSWORD set nahi hai' });
    }
    const { password } = parseBody(req);
    if (!isValidPassword(password)) {
      return res.status(401).json({ success: false, error: 'Ghalat password' });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('responses')
      .select('rating')
      .limit(5000);

    if (error) {
      console.error('Supabase stats error:', error);
      return res.status(500).json({ success: false, error: 'Stats load nahi ho sakay' });
    }

    const rows = data || [];
    const total = rows.length;
    const sum = rows.reduce((acc, row) => acc + (Number(row.rating) || 0), 0);
    const averageRating = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ total, averageRating });
  } catch (err) {
    console.error('stats error:', err);
    return res.status(500).json({ success: false, error: 'Server mein masla aa gaya' });
  }
};