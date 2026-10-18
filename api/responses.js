// POST /api/responses  - saare jawab wapas karta hai (sirf admin ke liye)

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
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) {
      console.error('Supabase select error:', error);
      return res.status(500).json({ success: false, error: 'Data load nahi ho saka' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(data || []);
  } catch (err) {
    console.error('responses error:', err);
    return res.status(500).json({ success: false, error: 'Server mein masla aa gaya' });
  }
};