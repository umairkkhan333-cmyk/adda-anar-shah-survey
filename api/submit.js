// POST /api/submit  - survey ka jawab save karta hai

const { getSupabase, parseBody, onlyPost } = require('./_lib');

const MAX_LONG = 2000;
const MAX_PHONE = 20;

function clean(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

module.exports = async (req, res) => {
  if (!onlyPost(req, res)) return;

  try {
    const body = parseBody(req);

    // Honeypot: insaan ye field nahi bharta, bots bhar dete hain
    if (body.website) {
      return res.status(200).json({ success: true });
    }

    const businessIdea = clean(body.business_idea, MAX_LONG);
    const missingThing = clean(body.missing_thing, MAX_LONG);
    const improveThing = clean(body.improve_thing, MAX_LONG);
    const suggestions = clean(body.suggestions, MAX_LONG);
    const extraNote = clean(body.extra_note, MAX_LONG);
    const phone = clean(body.phone, MAX_PHONE);
    const rating = Number(body.rating);

    if (!businessIdea) {
      return res.status(400).json({ success: false, error: 'Sawal 1 ka jawab zaroori hai' });
    }
    if (!missingThing) {
      return res.status(400).json({ success: false, error: 'Sawal 2 ka jawab zaroori hai' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating 1 se 5 ke beech honi chahiye' });
    }
    if (phone && !/^[0-9+\-\s]{7,20}$/.test(phone)) {
      return res.status(400).json({ success: false, error: 'Phone number sahi nahi hai' });
    }

    const supabase = getSupabase();
    const { error } = await supabase.from('responses').insert({
      business_idea: businessIdea,
      missing_thing: missingThing,
      improve_thing: improveThing || null,
      suggestions: suggestions || null,
      rating: rating,
      phone: phone || null,
      extra_note: extraNote || null,
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ success: false, error: 'Jawab save nahi ho saka. Dobara koshish karein' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('submit error:', err);
    return res.status(500).json({ success: false, error: 'Server mein masla aa gaya. Dobara koshish karein' });
  }
};